# System Architecture & Communication Map

## 1. Infrastructure Overview

| Layer | Technology |
|---|---|
| Hosting & Serverless API | Vercel (Next.js 16 App Router) |
| Database, Auth, Storage | Supabase Cloud (PostgreSQL 15) |
| Bot Ingestion Interface | Telegram Bot API via Webhooks |
| AI Processing Engine | Google Gemini 2.0 Flash (via `@ai-sdk/google`) |

---

## 2. Database Schema (v4 — Consolidated Schema)

### Core Directory Tables
```
groups                  id (UUID PK), name, invite_code (UNIQUE)
profiles                id (UUID PK), full_name, nickname, email, pin (VARCHAR 4),
                        avatar_url, telegram_user_id (TEXT UNIQUE), total_xp (INT), current_level (INT)
group_members           user_id (→ profiles), group_id (→ groups), joined_at
                        PK: (user_id, group_id)
```

### Ingestion & Activity Logs
```
metric_logs             id (UUID PK), user_id, group_id, metric_slug (TEXT),
                        value (NUMERIC), unit (TEXT), status (pending|verified|rejected),
                        evidence_url, caption, logged_at
log_votes               id (UUID PK), log_id (→ metric_logs), user_id (→ profiles), cast_at
                        UNIQUE(log_id, user_id)
```

- **Auto-verify trigger** (`trg_auto_verify`): fires `AFTER INSERT` on `log_votes`. When `count(votes for log_id) >= 3`, the trigger flips `metric_logs.status → 'verified'`.
- **XP trigger** (`trg_award_xp_v2`): fires `AFTER UPDATE OF status` on `metric_logs`. Awards 25 XP for logs, updates `total_xp`, and recomputes `current_level` on profiles atomically.

### Wearables Integrations (Google Fit)
```
wearable_connections    id (UUID PK), user_id (→ profiles), provider, access_token,
                        refresh_token, token_expires_at, last_synced_at
wearable_steps          id (UUID PK), connection_id, logged_date, value, updated_at
wearable_sleep          id (UUID PK), connection_id, logged_date, value, updated_at
wearable_resting_hr     id (UUID PK), connection_id, logged_date, value, updated_at
```

---

## 3. Targeted Peer-Review Verification Lifecycle
- All standard metrics (e.g. `long_run`, `weight`, `highest_steps`, `marathon`, `catan_wins`, `national_parks`) automatically verify to `status = 'verified'` immediately upon insertion.
- Extreme achievements (`car_top_speed` and `most_beers`) default to `status = 'pending'` and must go through peer review.
- Peers verify logs directly from the Breaking News Activity Ledger using interactive **✅ (Approve)** and **❌ (Reject)** buttons.
- Authors see a **🗑️ Delete** button on their own entries.

---

## 4. Ingestion Pipelines

### Path A — Manual Dashboard Input
1. **AI Assist Form:** The user enters a sentence description of their activity. Next.js Server Action (`ingestActivity`) parses it via Gemini AI and maps it to a metric slug.
2. **Structured Manual Form:** Defaults to the active view. Fields adapt depending on the metric category (standard numerical values or endurance duration blocks).

### Path B — Telegram Bot Webhook (`/api/telegram`)
1. User sends message to Telegram bot.
2. Webhook verified via `X-Telegram-Bot-Api-Secret-Token`.
3. Resolves profile and group. Gemini AI parses values using a strict Zod schema.
4. Parameterized insert into `metric_logs`.

### Path C — Wearables Sync Engine (`/api/cron/sync-wearables`)
1. Cron scheduler (Github Actions / pg_cron) executes GET request.
2. Refreshes OAuth tokens for active connections, fetches Google Fit aggregates, and logs daily scores directly to the database.

---

## 5. Security & Isolation
- Row Level Security (RLS) is enabled on all core tables.
- Cross-tenant group isolation is maintained at the application and query layers.
- A cookie-based JWT secure token `app_session` protects dashboard client routing and session actions.