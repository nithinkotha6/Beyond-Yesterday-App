-- =============================================================================
-- Migration: 0002_schema_refactor.sql
-- Purpose:   Many-to-many group membership, unified metric event log (slug-based),
--            peer-review voting engine, Telegram bot auth column.
-- Applies on top of: 0000_initial_schema.sql, 0001_multi_tenant.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 1: groups table
-- Ensure it exists (0001 may have created it; use CREATE TABLE IF NOT EXISTS).
-- ---------------------------------------------------------------------------
create table if not exists public.groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SECTION 2: Alter profiles — remove old direct group_id FK, add new columns
--
-- We move to many-to-many via group_members, so group_id is no longer a
-- first-class column on profiles. We also add telegram_user_id for bot auth.
-- full_name replaces the old `username` column (added in 0001).
-- ---------------------------------------------------------------------------

-- Add telegram_user_id if it doesn't exist (idempotent).
do $$ begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'profiles'
       and column_name  = 'telegram_user_id'
  ) then
    alter table public.profiles add column telegram_user_id text unique;
  end if;
end $$;

-- Add full_name if it doesn't exist (may already exist from 0001).
do $$ begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'profiles'
       and column_name  = 'full_name'
  ) then
    alter table public.profiles add column full_name text;
  end if;
end $$;

-- Drop the old direct group_id column from profiles (replaced by group_members).
-- Guarded so re-running this migration on a fresh DB does not error.
do $$ begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'profiles'
       and column_name  = 'group_id'
  ) then
    alter table public.profiles drop column group_id;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- SECTION 3: group_members — many-to-many join table
-- A user can belong to multiple groups simultaneously.
-- ---------------------------------------------------------------------------
create table if not exists public.group_members (
  user_id   uuid        not null references public.profiles (id) on delete cascade,
  group_id  uuid        not null references public.groups   (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (user_id, group_id)
);

create index if not exists group_members_group_id_idx on public.group_members (group_id);

-- ---------------------------------------------------------------------------
-- SECTION 4: New metric_logs — slug-based unified event log
--
-- The new schema stores metric_slug directly (e.g. 'deadlift') instead of
-- an FK into metrics_config. This allows the Telegram bot and AI pipeline
-- to insert without a secondary lookup, and keeps the table append-only.
-- group_id on each log row records the group context of the submission.
-- ---------------------------------------------------------------------------

-- Rename the old EAV table to preserve history if it exists.
do $$ begin
  if exists (
    select 1 from information_schema.tables
     where table_schema = 'public'
       and table_name   = 'metric_logs'
  ) then
    -- Only rename if the new table doesn't already exist.
    if not exists (
      select 1 from information_schema.tables
       where table_schema = 'public'
         and table_name   = 'metric_logs_v1_archive'
    ) then
      alter table public.metric_logs rename to metric_logs_v1_archive;
    end if;
  end if;
end $$;

create table if not exists public.metric_logs (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  group_id    uuid        not null references public.groups   (id) on delete cascade,
  metric_slug text        not null,           -- e.g. 'deadlift', 'beers', 'long_run'
  value       numeric     not null,
  unit        text        not null default '',
  status      text        not null default 'pending'
                          check (status in ('pending', 'verified', 'rejected')),
  evidence_url text,
  logged_at   timestamptz not null default now()
);

create index if not exists metric_logs_group_id_idx    on public.metric_logs (group_id);
create index if not exists metric_logs_user_id_idx     on public.metric_logs (user_id);
create index if not exists metric_logs_metric_slug_idx on public.metric_logs (metric_slug);
create index if not exists metric_logs_status_idx      on public.metric_logs (status);
create index if not exists metric_logs_logged_at_idx   on public.metric_logs (logged_at desc);

-- ---------------------------------------------------------------------------
-- SECTION 5: log_votes — peer-review voting engine
-- Each vote is one approval from one group peer.
-- UNIQUE(log_id, user_id) prevents double-voting at the DB level.
-- ---------------------------------------------------------------------------
create table if not exists public.log_votes (
  id      uuid primary key default uuid_generate_v4(),
  log_id  uuid not null references public.metric_logs (id) on delete cascade,
  user_id uuid not null references public.profiles    (id) on delete cascade,
  cast_at timestamptz not null default now(),
  unique (log_id, user_id)   -- one vote per user per log, enforced in Postgres
);

create index if not exists log_votes_log_id_idx on public.log_votes (log_id);

-- ---------------------------------------------------------------------------
-- SECTION 6: Auto-verify trigger
-- When a log accumulates 3 distinct votes from group peers, flip status →
-- 'verified' automatically. XP trigger on metric_logs fires next.
-- ---------------------------------------------------------------------------
create or replace function public.auto_verify_on_votes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vote_count integer;
begin
  select count(*)
    into v_vote_count
    from public.log_votes
   where log_id = NEW.log_id;

  if v_vote_count >= 3 then
    update public.metric_logs
       set status = 'verified'
     where id = NEW.log_id
       and status = 'pending';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_auto_verify on public.log_votes;
create trigger trg_auto_verify
  after insert on public.log_votes
  for each row
  execute function public.auto_verify_on_votes();

-- ---------------------------------------------------------------------------
-- SECTION 7: XP award trigger (new metric_logs table)
-- Fires when status transitions to 'verified'.
-- XP reward is looked up from metrics_config by slug (if it exists).
-- Falls back to 25 XP for unknown slugs.
-- ---------------------------------------------------------------------------
create or replace function public.award_xp_on_verify_v2()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp integer := 25; -- default XP for unmapped slugs
begin
  if OLD.status <> 'verified' and NEW.status = 'verified' then

    -- Try to get XP reward from the metrics catalogue
    select coalesce(xp_reward, 25)
      into v_xp
      from public.metrics_config
     where slug = NEW.metric_slug
     limit 1;

    update public.profiles
       set total_xp      = total_xp + v_xp,
           current_level = floor(1 + sqrt((total_xp + v_xp)::float / 500)) + 1
     where id = NEW.user_id;

  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_award_xp_v2 on public.metric_logs;
create trigger trg_award_xp_v2
  after update of status on public.metric_logs
  for each row
  execute function public.award_xp_on_verify_v2();

-- ---------------------------------------------------------------------------
-- SECTION 8: Row Level Security — many-to-many group-scoped policies
--
-- Helper: shared_group(uid_a, uid_b) → true if both users are in any common group.
-- Used as the core isolation predicate for all group-scoped tables.
-- ---------------------------------------------------------------------------
create or replace function public.shares_group_with_caller(target_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
      from public.group_members a
      join public.group_members b
        on a.group_id = b.group_id
     where a.user_id = auth.uid()
       and b.user_id = target_user_id
  );
$$;

-- ── groups ──────────────────────────────────────────────────────────────────
alter table public.groups enable row level security;

drop policy if exists "groups: members can read own groups" on public.groups;
create policy "groups: members can read own groups"
  on public.groups for select
  to authenticated
  using (
    id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

-- ── group_members ────────────────────────────────────────────────────────────
alter table public.group_members enable row level security;

drop policy if exists "group_members: read own group roster" on public.group_members;
create policy "group_members: read own group roster"
  on public.group_members for select
  to authenticated
  using (
    group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

drop policy if exists "group_members: insert own membership" on public.group_members;
create policy "group_members: insert own membership"
  on public.group_members for insert
  to authenticated
  with check (user_id = auth.uid());

-- ── profiles ─────────────────────────────────────────────────────────────────
-- Drop old overly-permissive read-all policy from 0000.
drop policy if exists "profiles: authenticated users can read all" on public.profiles;

drop policy if exists "profiles: group peers can read" on public.profiles;
create policy "profiles: group peers can read"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()                          -- always see own row
    or public.shares_group_with_caller(id)   -- or any group peer
  );

-- Keep existing insert/update own-row policies (idempotent).
drop policy if exists "profiles: users can insert own row" on public.profiles;
create policy "profiles: users can insert own row"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles: users can update own row" on public.profiles;
create policy "profiles: users can update own row"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- ── metric_logs ──────────────────────────────────────────────────────────────
alter table public.metric_logs enable row level security;

-- Drop old permissive read-all policies from previous migrations.
drop policy if exists "metric_logs: authenticated users can read all" on public.metric_logs;
drop policy if exists "metric_logs: group members can read"           on public.metric_logs;

drop policy if exists "metric_logs: group members can read v2" on public.metric_logs;
create policy "metric_logs: group members can read v2"
  on public.metric_logs for select
  to authenticated
  using (
    group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

drop policy if exists "metric_logs: users can insert own logs" on public.metric_logs;
create policy "metric_logs: users can insert own logs"
  on public.metric_logs for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

-- ── log_votes ────────────────────────────────────────────────────────────────
alter table public.log_votes enable row level security;

drop policy if exists "log_votes: group peers can read" on public.log_votes;
create policy "log_votes: group peers can read"
  on public.log_votes for select
  to authenticated
  using (
    exists (
      select 1
        from public.metric_logs ml
       where ml.id = log_votes.log_id
         and ml.group_id in (
           select group_id from public.group_members where user_id = auth.uid()
         )
    )
  );

-- A user may cast a vote only if:
--   (a) they share a group with the log's author, AND
--   (b) they are NOT the log's author (no self-voting).
drop policy if exists "log_votes: group peers can vote, no self-vote" on public.log_votes;
create policy "log_votes: group peers can vote, no self-vote"
  on public.log_votes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
        from public.metric_logs ml
       where ml.id = log_votes.log_id
         and ml.user_id <> auth.uid()           -- cannot vote on own log
         and ml.group_id in (
           select group_id from public.group_members where user_id = auth.uid()
         )
    )
  );
