# System Architecture & Communication Map

## 1. Infrastructure Overview

| Layer | Technology |
|---|---|
| Hosting & Serverless API | Vercel (Next.js 15 App Router) |
| Database, Auth, Storage | Supabase Cloud (PostgreSQL 15) |
| Bot Ingestion Interface | Telegram Bot API via Webhooks |
| AI Processing Engine | Google Gemini 2.0 Flash (via `@ai-sdk/google`) |

---

## 2. Database Schema (v3 — Migration 0002)

### Core Tables

```
groups            id (UUID PK), name, invite_code (UNIQUE)
profiles          id (UUID PK → auth.users), full_name, avatar_url,
                  total_xp, current_level, telegram_user_id (TEXT UNIQUE)
group_members     user_id (→ profiles), group_id (→ groups),
                  joined_at  │  PK: (user_id, group_id)  ← many-to-many
```

### Event Engine

```
metric_logs       id (UUID PK), user_id, group_id, metric_slug (TEXT),
                  value (NUMERIC), unit (TEXT), status (pending|verified|rejected),
                  evidence_url, logged_at
```

`metric_logs` stores slugs directly (e.g. `'deadlift'`, `'top_speed'`) for low-latency ingest without FK lookups.

### Peer-Review Engine

```
log_votes         id (UUID PK), log_id (→ metric_logs), user_id (→ profiles),
                  cast_at  │  UNIQUE(log_id, user_id) — prevents double-voting
```

- **Auto-verify trigger** (`trg_auto_verify`): fires `AFTER INSERT` on `log_votes`. When `count(votes for log_id) >= 3`, the trigger flips `metric_logs.status → 'verified'`.
- **XP trigger** (`trg_award_xp_v2`): fires `AFTER UPDATE OF status` on `metric_logs`. Awards 25 XP for logs, updates `total_xp`, and recomputes `current_level` on profiles atomically.

---

## 3. Multi-Tenant Isolation (Many-to-Many)

A user can belong to **multiple groups simultaneously** via `group_members`.

### RLS Isolation Predicate
A security-definer helper function `shares_group_with_caller(target_user_id)` is used as the core isolation predicate:
```sql
select exists (
  select 1
    from group_members a
    join group_members b on a.group_id = b.group_id
   where a.user_id = auth.uid()
     and b.user_id = target_user_id
);
```

---

## 4. Dynamic Query Engine (`lib/queries.ts`)

All dashboard data flows through server-side server actions or utility functions.
- `getChartData(supabase, groupId, metricSlug, range, isCumulative)` — returns normalized date labels and chronological series, utilizing `null` instead of `0` to prevent zero-plunges on rest days.
- `getFeedItems(supabase, groupId, limit)` — returns latest verified and pending logs for the Breaking News stream.
- `getGroupIdForUser(supabase, userId)` — resolves primary group for a user.
- `getPendingLogsForGroup(supabase, groupId, callerId)` — returns peer-review queue.

---

## 5. Data Ingestion Paths

### Path A — Manual (Dashboard Modal)
1. User clicks `+ Add Activity` → Dialog opens.
2. Raw text submitted → Next.js Server Action (`ingestActivity`).
3. `generateText` (Gemini AI) extracts `{ metric_slug, value, unit }`.
4. Inserted into `metric_logs` with `status: 'pending'`.

### Path B — Telegram Bot Webhook (`/api/telegram`)
1. User sends message to Telegram bot.
2. Webhook verified via `X-Telegram-Bot-Api-Secret-Token`.
3. Resolves profile and group. Gemini AI parses values using a strict Zod schema.
4. Parameterized insert into `metric_logs` with `status: 'pending'`.

---

## 6. Environment Variables Required

| Variable | Where Used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service client (peer-voting verification) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini AI `@ai-sdk/google` integration |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram webhook routing token |
| `SESSION_SECRET` | Kiosk JWT cookie encryption key |

---

## 7. Kiosk Auth Model & Room Session Security

### Personal PINs & 1-Step Login
1. **Selection & Verification**: The user selects a group and enters their 4-digit personal PIN.
2. **Database Verification**: The server action `loginWithPersonalPinAction` verifies that the `pin` matches the profile within the selected `groupId`.
3. **Session Cookie**: Issues a signed, HTTP-only `app_session` cookie containing `{ userId, groupId, groupName, userName }`.
4. **Welcome Confetti**: Success triggers client redirect. Next.js request proxy (`proxy.ts`) protects dashboard routes, ensuring a valid session cookie exists.