# System Architecture & Communication Map

## 1. Infrastructure Overview

| Layer | Technology |
|---|---|
| Hosting & Serverless API | Vercel (Next.js 16 App Router) |
| Database, Auth, Storage | Supabase Cloud (PostgreSQL 15) |
| Bot Ingestion Interface | Green API WhatsApp Gateway via Webhooks |
| AI Processing Engine | Google Gemini via Vercel AI SDK |

---

## 2. Database Schema (Supabase PostgreSQL 15)

### Core Directory Tables
```
groups                  id (UUID PK), name, invite_code (UNIQUE)
profiles                id (UUID PK), full_name, nickname, email, pin (VARCHAR 4),
                        avatar_url, total_xp (INT), current_level (INT), is_active (BOOLEAN default true)
group_members           user_id (→ profiles), group_id (→ groups), role (TEXT default 'member'), joined_at
                        PK: (user_id, group_id)
```

### Ingestion & Activity Logs
```
metric_definitions      id (UUID PK), name (TEXT), unit (TEXT), sort_direction (TEXT),
                        group_id (UUID FK), is_hidden (BOOLEAN default false)
metric_logs             id (UUID PK), user_id, group_id, metric_slug (TEXT),
                        value (NUMERIC), unit (TEXT), status (pending|verified|rejected),
                        evidence_url, caption, logged_at
log_votes               id (UUID PK), log_id (→ metric_logs), user_id (→ profiles), cast_at
                        UNIQUE(log_id, user_id)
```

- **Auto-verify trigger** (`trg_auto_verify`): fires `AFTER INSERT` on `log_votes`. When `count(votes for log_id) >= 3`, the trigger flips `metric_logs.status → 'verified'`.
- **XP trigger** (`trg_award_xp_v2`): fires `AFTER UPDATE OF status` on `metric_logs`. Awards 25 XP for verified logs, updates `total_xp`, and recomputes `current_level` on profiles.

### AI Lore & Slang Customization Tables
```
member_lore             user_id (UUID PK → profiles), stunts (TEXT[] default '{}'), 
                        good_habits (TEXT[] default '{}'), bad_habits (TEXT[] default '{}'), 
                        ego_trigger (TEXT), catchphrase (TEXT), nemesis_id (UUID FK → profiles)
vocab_banks             id (UUID PK), tone (TEXT), target_gender (TEXT), words (TEXT[]),
                        UNIQUE(tone, target_gender)
chat_history            id (UUID PK), group_id (UUID FK → groups), role (TEXT),
                        sender_name (TEXT), content (TEXT), created_at (TIMESTAMPTZ)
```

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
- All standard metrics (e.g. `highest_steps`, `marathon`, `catan_wins`, `national_parks`) automatically verify to `status = 'verified'` immediately upon insertion.
- Extreme achievements (`car_top_speed` and `most_beers`) default to `status = 'pending'` and must go through peer review.
- Peers verify logs directly from the Breaking News Activity Ledger using interactive **✅ (Approve)** and **❌ (Reject)** buttons.
- Authors can delete their own entries.

---

## 4. Ingestion & AI Pipelines

### Path A — Manual Dashboard Input
1. **AI Assist Form:** The user enters a sentence description of their activity. Next.js Server Action (`ingestActivity`) parses it via Gemini AI and maps it to a metric slug.
2. **Structured Manual Form:** Defaults to the active view. Fields adapt depending on the metric category (standard numerical values or endurance duration blocks).

### Path B — WhatsApp Bot Webhook (`/api/webhooks/whatsapp`)
1. User sends message to WhatsApp group.
2. Webhook payload parsed by Green API instance.
3. Message checked for commands (e.g. `/clear` triggers conversation context wipe).
4. AI context assembled from chat history and recent logs, combined with Hyderabadi persona instructions, and queried against Gemini.
5. Outbound roast/reply sent back via Green API.

### Path C — Admin Tone Dispatch Poke (`adminTriggerPoke`)
1. Admin triggers poke from settings console.
2. Fetch target user's custom lore (`member_lore`) and nemesis.
3. Fetch slang words list based on vibe/tone and gender styles (`vocab_banks`).
4. Assemble micro-prompt with custom context.
5. Invoke Gemini, retrieve roast, and dispatch to WhatsApp instantly.

### Path D — Wearables Sync Engine (`/api/cron/sync-wearables`)
1. Cron scheduler executes GET request.
2. Refreshes OAuth tokens for active connections, fetches Google Fit aggregates, and logs daily scores directly to the database.

---

## 5. Security & Isolation
- Row Level Security (RLS) is enabled on all core tables.
- Cross-tenant group isolation is maintained at the application and query layers.
- A cookie-based JWT secure token `app_session` protects dashboard client routing and session actions.