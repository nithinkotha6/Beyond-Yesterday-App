# The Growth Club — Kiosk Web Application

Welcome to **The Growth Club**, a mobile-first workout tracking and competitive dashboard. Designed for fitness groups, teams, and families to track activities, view progress, and compete on dynamic leaderboards.

---

## 🚀 Shipped Core Features
- **Strict Personal PIN Authentication:** One-step room selection and 4-digit PIN verification. Fully cookie-based session scoping (scraped via HTTP-only secure cookie `app_session`).
- **Interactive Trend Charts:** Clean ECharts visual charts utilizing a TradingView/Robinhood stock-market UX aesthetic. Floating curves with strict null normalization to eliminate zero-plunges on rest days.
- **Dynamic Leaderboards:** Multi-metric Olympic podium rankings (1st, 2nd, 3rd) and detailed scrollable rankings lists for other group members.
- **Community Roster Grid:** Clean visual directory cards displaying group members, nicknames, current levels, and cumulative XP badges.
- **Breaking News Feed:** Chronological natural language stream of recent activities decorated with initials-fallback `<UserAvatar />` badges.
- **Natural Language Ingestion:** Manual workout logging via natural language processing (powered by Gemini AI parsing updates to metric slugs).

---

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router, Turbopack)
- **Styling:** Tailwind CSS & Vanilla CSS
- **Database / Backend:** Supabase (PostgreSQL 15, Row Level Security, Triggers for automatic verification & XP calculations)
- **AI Processing:** Google Gemini 2.0 Flash (via `@ai-sdk/google`)
- **Data Visualization:** Apache ECharts (`echarts`, `echarts-for-react`)

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-secret-service-role-key"
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
SESSION_SECRET="your-session-jwt-encryption-key-min-32-chars"
TELEGRAM_WEBHOOK_SECRET="your-telegram-secret"
TELEGRAM_BOT_TOKEN="your-telegram-token"
```

---

## 💻 Local Development Workflow

Install dependencies:
```bash
npm install
```

Run the development server (Next.js Turbopack):
```bash
npm run dev
```

Build the application for production:
```bash
npm run build
```

Run linter / validation checks:
```bash
npm run lint
```
