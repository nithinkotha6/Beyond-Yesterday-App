## 1. Core App Features
- **WhatsApp AI Bot (Fisky):** Real-time conversational AI chat companion using Google Gemini for group banter, daily digests, and roasts.
- **AI Tone Dispatcher:** Admin override tool to force-trigger AI WhatsApp pokes using specific tones, gender override configurations, and situational contexts.
- **Dynamic Metric Tracking:** Log group activities and sports logs, view progress curves, and display relative rankings on a dynamic leaderboard.
- **Google Fit Integration:** OAuth connection pipeline syncing daily steps, resting heart rate, and sleep duration automatically via cron actions.
- **God Mode Admin Console:** Secret pin-unlocked dashboard providing log modifications, bot muting controls, user state deactivations, and metric settings CRUD tools.
- **Targeted Peer-Review Gate:** Low-risk fitness metrics auto-verify instantly; extreme achievements (e.g. alcohol, top speed) require group approval votes to count.

## 2. Database Schema (The Blueprint)

| Table Name | Primary Purpose | Key Columns |
|---|---|---|
| `profiles` | User accounts, XP points, current level, and authorization credentials | `id` (PK), `full_name`, `nickname`, `email`, `pin`, `total_xp`, `current_level`, `is_active` (soft-delete flag) |
| `groups` | Tenancy routing scoping contexts for separate friend circles or teams | `id` (PK), `name`, `invite_code` |
| `group_members` | Map linking users to their active groups with role assignments | `user_id` (FK), `group_id` (FK), `role` (`admin`, `co-admin`, `member`) |
| `metric_definitions` | Dynamic metrics available for tracking and scoring calculations | `id` (PK), `name`, `unit`, `sort_direction`, `group_id` (FK), `is_hidden` (soft-hide flag) |
| `metric_logs` | Performance history and activity log logs logged by members | `id` (PK), `user_id` (FK), `group_id` (FK), `metric_slug`, `value`, `unit`, `status` |
| `log_votes` | Validation votes cast by peers for verification triggers | `id` (PK), `log_id` (FK), `user_id` (FK) |
| `member_lore` | Custom inside joke data and habits for targeted AI roasts | `user_id` (PK, FK), `stunts` (text array), `good_habits`, `bad_habits`, `ego_trigger`, `catchphrase`, `nemesis_id` (FK) |
| `vocab_banks` | Group slang expressions mapped to specific vibes and genders | `id` (PK), `tone`, `target_gender`, `words` (text array) |
| `chat_history` | Historical logs of chat messages parsed for context window feeding | `id` (PK), `group_id` (FK), `role` (`user`/`assistant`), `content` |

## 3. AI Architecture Pipeline
- **WhatsApp Webhook Ingestion Flow:** WhatsApp Incoming Message webhook (`/api/webhooks/whatsapp`) -> Check Bot Mute Status -> Extract Text -> Match Group ID -> Fetch Chat History -> Fetch Recent Verified Logs -> Build Dynamic Prompt (Hyderabadi Banter Rules + Word Limit Clamp) -> Invoke Gemini Flash API -> Send Outbound WhatsApp Message -> Save Chat logs to Database.
- **Admin Tone Dispatch Poke Flow:** Settings Dispatch Form -> Server Action (`adminTriggerPoke`) -> Fetch Target User Profile -> Resolve Gender & Tone -> Fetch Target User Lore & Enemies (`member_lore` query) -> Fetch Custom Slang Words (`vocab_banks` query) -> Inject Situational Context -> Construct System Prompt -> Call Gemini API -> Send Response via Green API sendMessage -> Return Dispatch Text.
- **Mirror Output Clamp Constraints:** Output is restricted to a maximum of 2-3 sentences. When triggered via webhook, length limits dynamically scale with user input word count, completely banning newline spacing (`\n`) to avoid multi-paragraph blocks.

## 4. UI/UX Standard
- **Page Canvas Background:** `#F7F8FA`
- **Module Cards Background:** `#FFFFFF` (`bg-white border border-slate-200 shadow-sm rounded-xl`)
- **Primary Hero Accents / Buttons:** `#CEFF00` (Neon Lime/Yellow)
- **Secondary Borders & Focus Rings:** `#E2E8F0` (`border-slate-200`)
- **Main Slate Typography:** `#111827` (`text-slate-900 font-extrabold`)
- **Secondary Muted Text:** `#6B7280` (`text-slate-500`)
- **Destructive Action Indicators:** `text-red-600` / `bg-red-50` / `border-red-200`
- **Success/Verified Action Indicators:** `text-emerald-600` / `bg-emerald-50` / `border-emerald-200`
