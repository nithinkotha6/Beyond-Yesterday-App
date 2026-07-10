/**
 * LiveAchievementTicker — single-line infinite-scroll achievement feed.
 *
 * Architecture:
 *  - Server Component: fetches the 15 most recent verified logs from Supabase.
 *  - RLS automatically scopes the query to the logged-in user's group.
 *  - Formats each log into a natural, exciting sentence with emoji.
 *  - Doubles the sentence array so the seamless -50% translateX loop
 *    never shows a gap at any viewport width.
 *  - overflow-hidden on the outer wrapper prevents any horizontal scrollbar.
 *
 * Spec: dashboard §3 enhancement (live achievement broadcast bar)
 */

import { createClient } from '@/lib/supabase/server';

/* ── Sentence formatter ────────────────────────────────────────────────── */

type LogRow = {
  value: number;
  metric_slug: string; // v2 schema: stored directly on the row
  unit: string;
  profiles: { full_name: string | null } | null;
};

function formatAchievement(log: LogRow): string {
  const name = log.profiles?.full_name?.split(' ')[0] ?? 'Someone';
  const val  = Number(log.value);
  const slug = log.metric_slug ?? '';
  const unit = log.unit ?? '';

  switch (slug) {
    // ── drinks / fun ────────────────────────────────────────────────
    case 'beers':
      return `${name} just drank ${val} beer${val !== 1 ? 's' : ''} 🍺`;

    // ── running ─────────────────────────────────────────────────────
    case 'long_run':
      return val >= 10
        ? `${name} crushed a ${val} ${unit} long run today 🏃‍♂️🔥`
        : `${name} knocked out a ${val} ${unit} run 🏃`;

    // ── strength ────────────────────────────────────────────────────
    case 'deadlift':
      return val >= 300
        ? `${name} pulled ${val} ${unit} on deadlifts — absolute BEAST 💪`
        : `${name} hit ${val} ${unit} on deadlifts 💪`;

    case 'squat':
      return `${name} squatted ${val} ${unit} today 🦵`;

    case 'bench_press':
      return `${name} benched ${val} ${unit} 🏋️`;

    case 'pull_ups':
      return `${name} repped out ${val} pull-up${val !== 1 ? 's' : ''} 🔝`;

    case 'push_ups':
      return `${name} did ${val} push-up${val !== 1 ? 's' : ''} 💥`;

    // ── speed ───────────────────────────────────────────────────────
    case 'top_speed':
      return val >= 100
        ? `${name} clocked a blistering top speed of ${val} ${unit} ⚡`
        : `${name} hit ${val} ${unit} top speed ⚡`;

    // ── swimming ────────────────────────────────────────────────────
    case 'longest_swim':
      return `${name} did the longest underwater swim at ${val} ${unit} 🏊‍♂️`;

    case 'swim_laps':
      return `${name} swam ${val} lap${val !== 1 ? 's' : ''} 🏊`;

    // ── cycling ─────────────────────────────────────────────────────
    case 'cycling_distance':
      return `${name} cycled ${val} ${unit} 🚴`;

    // ── calories / fitness ──────────────────────────────────────────
    case 'calories':
      return val >= 600
        ? `${name} did extensive pilates and burned ${val} ${unit} 🔥`
        : `${name} burned ${val} ${unit} today 🔥`;

    // ── body metrics ────────────────────────────────────────────────
    case 'weight':
      return `${name} checked in at ${val} ${unit} ⚖️`;

    case 'heart_rate':
      return `${name} logged a heart rate of ${val} ${unit} ❤️`;

    case 'sleep':
      return val >= 8
        ? `${name} slept a solid ${val} hrs 😴`
        : `${name} logged ${val} hrs of sleep 😴`;

    case '5k_time':
      return `${name} ran a 5K in ${val} minutes 🏅`;

    // ── generic fallback ────────────────────────────────────────────
    default: {
      const display = slug.replace(/_/g, ' ');
      return `${name} logged ${val} ${unit} of ${display} 🏆`;
    }
  }
}

/* ── Separator between items ────────────────────────────────────────────── */
function Separator() {
  return (
    <span className="mx-6 text-[#CEFF00]/30 select-none" aria-hidden="true">
      ◆
    </span>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */
export default async function LiveAchievementTicker({ groupId }: { groupId: string }) {
  const supabase = await createClient();

  // Fetch 15 most recent verified logs scoped to this group.
  // groupId is explicit (index scan) + RLS double-fences the result.
  const { data: logs } = await supabase
    .from('metric_logs')
    .select(`
      value,
      metric_slug,
      unit,
      profiles!inner ( full_name )
    `)
    .eq('group_id', groupId)
    .eq('status', 'verified')
    .order('logged_at', { ascending: false })
    .limit(15);

  const rows = (logs ?? []) as unknown as LogRow[];

  // If no data yet, show a warm placeholder so the ticker is never blank
  const sentences: string[] =
    rows.length > 0
      ? rows.map(formatAchievement)
      : [
          'Be the first to log an activity! 🚀',
          'Log your first run, lift, or swim to appear here 🏆',
          'The Growth Club is warming up… 🔥',
        ];

  // Double the array → seamless -50% loop at any screen width
  const doubled = [...sentences, ...sentences];

  return (
    /* Outer wrapper: dark band, overflow-hidden to block any scrollbar bleed */
    <div
      className="ticker-wrapper w-full overflow-hidden bg-[#0A0A0A] border-b border-white/5 h-9 flex items-center"
      aria-label="Live achievement ticker"
      role="marquee"
    >
      {/* LIVE badge — pinned left, outside the scroll track */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5 bg-[#CEFF00] text-[#0A0A0A] px-3 h-full font-black text-[10px] tracking-[0.2em] uppercase z-10 select-none"
        aria-hidden="true"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] animate-pulse" />
        LIVE
      </div>

      {/* Scrolling track — flex-1 + overflow-hidden prevents width bleed */}
      <div className="flex-1 overflow-hidden h-full flex items-center">
        <div
          className="flex whitespace-nowrap animate-ticker-scroll"
          /* will-change: transform helps GPU-composite the animation smoothly */
          style={{ willChange: 'transform' }}
        >
          {doubled.map((sentence, i) => (
            <span key={i} className="inline-flex items-center">
              <span className="text-white text-[11px] font-semibold tracking-wide">
                {sentence}
              </span>
              <Separator />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
