# Dev Log — UI Ticker, Bug Fixes & Dummy Data Purge

## 2026-07-10 | Step 9: Ticker + Bug Fixes + Dummy Data Purge

### Bug fixes
- `app/actions/signup.ts`: Strengthened invite code sanitization — now strips all whitespace AND all non-alphanumeric characters before uppercasing. Prevents crash from inputs like `"but 2025"` → `"BUT2025"`.

### Dummy data purge (100% complete)
- `components/MetricChart.tsx`: Removed `MOCK_USERS` array. Now accepts `users: ChartUser[]` prop. Empty array → clean SVG "No activity yet" empty state.
- `components/BreakingNewsFeed.tsx`: Removed `FEED` array. Now accepts `items: FeedItem[]` prop. Empty → Newspaper icon + "No activity yet" message.
- `components/KpiCards.tsx`: Removed `KPI_ITEMS` array. Now accepts `data: KpiData` prop. Null values → "—" display + "No logs yet" delta.

### New: MetricTicker
- `components/MetricTicker.tsx`: Two-row infinite marquee. Top row scrolls left (28s), bottom row scrolls right (32s). 14 metric items with inline SVG icons. Duplicate-array trick for seamless loop. Hover pauses animation via CSS.
- `app/globals.css`: Added `@keyframes ticker-left`, `@keyframes ticker-right`, `.animate-ticker-left`, `.animate-ticker-right`, `.ticker-track:hover` pause rules.

### Dashboard wiring
- `app/dashboard/page.tsx`: Async Server Component. Fetches live Supabase data (profiles, metric_logs). Builds `ChartUser[]`, `FeedItem[]`, `KpiData` server-side and passes as props. MetricTicker mounted full-bleed above padded content area.
