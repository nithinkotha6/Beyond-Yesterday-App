# Product Features & Functional Requirements

## 1. The Split-Theme Layout Architecture
The interface utilizes a strict split-layout design to maximize contrast and focus.
- **Left Sidebar:** Dark theme (`bg-[#0A0A0A]`). Fixed width, occupying the left margin of the screen.
- **Main Dashboard Area:** Light theme (`bg-[#F7F8FA]`). Flexible CSS Grid occupying the remaining viewport.
- **Widgets & Cards:** Pure white (`bg-white`) with large `24px` border radiuses and soft, transparent shadows.

## 2. Sidebar Components (Dark Theme)
- **Primary Navigation:** Vertical menu list containing: 
  - `Dashboard` (Active state: accented with Neon Lime `#CEFF00` text and a subtle left border/indicator).
  - `Activity` (Activity queue/history).
  - `Leaderboard` (Olympic podium view rankings).
  - `Gang` (Roster of group members).
  - `Challenges` and `Gear` (Stubs for future features).
- **Gamified User Profile Block:** Positioned near the bottom of the navigation.
  - Displays the user's avatar.
  - Displays the user's name and group.
  - Contains a horizontal progress bar (Neon Lime) tracking Experience Points (XP) and current Level.

## 3. Header & Metric Toggles (Top Row, Light Theme)
- **Title Block:** 
  - Huge, black, uppercase typography reading **"THE GROWTH CLUB"**.
  - Subtitle: "TRAIN TOGETHER. COMPETE TOGETHER. GROW TOGETHER." 
  - A stylized, hand-drawn green underline accent placed beneath the subtitle.
- **Controls (Top Right):** 
  - **Date Range Picker:** A white dropdown button (e.g., `Last 7 Days`). Changing this dynamically re-fetches the database rows for the main chart.
  - **Add Activity Button:** A solid black button with a white `+` icon and text `+ Add Activity`.
- **Metric Selectors (Pills):** A horizontal row of toggles that dictate the data shown in the main chart below:
  - `Long Run` (Pastel Green background, black text/icon)
  - `Deadlift` (Pastel Purple background, black text/icon)
  - `Top Speed` (Pastel Red background, red text/icon)
  - `Weight` (Pastel Teal/Cyan background, black text/icon)
  - `Calories` (Pastel Orange background, brown text/icon)

## 4. Primary Charting & Social Feed (Middle Row)
- **Main Trend Chart (ECharts):**
  - **Robinhood Style:** Crisp 2.5px solid lines for multiple athletes; solid gradient under-fills are enabled only when isolating down to a single athlete.
  - **Scrubbing & Hovering:** Dash-style vertical crosshair cursor. Smooth drag and touch-scrubbing. Dynamic tooltip box sorting athletes descending by score.
  - **Floating Curves:** Employs strict null normalization to connect points smoothly across rest days instead of plunging to 0.
  - **Custom Endpoints:** Avatar badges (or circular initials fallback) styled with the athlete's assigned line color render at the final data point. Staggered offsets mitigate overlapping collisions.
- **Breaking News Stream:**
  - A vertical widget displaying a real-time feed of group accomplishments.
  - Each item features: A `<UserAvatar />` displaying their photo or initials fallback, natural language activity message, and relative timestamp.

## 5. Leaderboard View (Olympic Podium Layout)
- **Interactive Metric Selector:** Horizontal scrolling pills to switch between Long Run, Top Speed, Deadlift, Calories, Weight, and Total Activities.
- **Podium Header (Top 3):** Mobile-first staggered pedestal layout (1st place Center/tallest, 2nd place Left/medium, 3rd place Right/lower). Features gold, silver, and bronze badges.
- **Rankings Table:** Clean table underneath the podium detailing ranks 4 and below with user avatars, levels, XP details, and exact scores.

## 6. Gang Roster View
- **Roster Directory Grid:** Responsive square cards displaying members of the active group.
- **Member Roster Card:** Features large centered `<UserAvatar />` badges with level overlays, user full name, nickname, current Level, and total XP.

## 7. Background Workflows & Core Integrations
- **Manual AI Ingestion Modal:** Natural language activity parser via Next.js Server Action + Gemini AI. Auto-updates dashboard statistics and logs.
- **Multi-Tenancy Setup:** Group scoping and RLS isolation scoping queries.
- **Peer-Review Voting Engine:** Peer vote verification requirements before log transitions to `verified`.