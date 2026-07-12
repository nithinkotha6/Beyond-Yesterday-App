/**
 * LiveAchievementTicker — single-line infinite-scroll achievement feed.
 * Pinned breaking news label + CSS-only linear scrolling track.
 */

import { createClient } from '@/lib/supabase/server';

/* ── Sentence formatter ────────────────────────────────────────────────── */

type LogRow = {
  value: number;
  metric_slug: string;
  unit: string;
  profiles: { full_name: string | null; nickname: string | null } | null;
};

function formatAchievement(log: LogRow): string {
  const name = log.profiles?.nickname ?? log.profiles?.full_name?.split(' ')[0] ?? 'Someone';
  const val  = Number(log.value);
  const slug = log.metric_slug ?? '';
  const unit = log.unit ?? '';

  switch (slug) {
    case 'long_run':
      return val >= 10
        ? `${name} crushed a ${val} ${unit} long run today 🏃‍♂️🔥`
        : `${name} knocked out a ${val} ${unit} run 🏃`;

    case 'weight':
      return `${name} checked in at ${val} ${unit} ⚖️`;

    case 'highest_steps':
      return val >= 15000
        ? `${name} logged an insane ${val.toLocaleString()} steps today 👟🔥`
        : `${name} clocked ${val.toLocaleString()} steps 👟`;

    case 'marathon':
      return `${name} completed a marathon in ${val} ${unit} 🏅`;

    case 'car_top_speed':
      return val >= 100
        ? `${name} pushed the Hycross to ${val} ${unit} — speed demon! 🚗💨`
        : `${name} clocked ${val} ${unit} in the Hycross 🚗`;

    case 'underwater_swim':
      return val >= 50
        ? `${name} swam ${val} meters underwater on one breath — INCREDIBLE 🤿`
        : `${name} swam ${val} meters underwater 🤿`;

    case 'most_beers':
      return val >= 10
        ? `${name} put away ${val} beers — absolute legend 🍺🏆`
        : `${name} had ${val} beer${val !== 1 ? 's' : ''} 🍺`;

    case 'catan_wins':
      return `${name} won a game of Catan! 🎲 Settlers beware…`;

    case 'national_parks':
      return `${name} visited a national park 🏔️ Living the dream!`;

    default: {
      const display = slug.replace(/_/g, ' ');
      return `${name} logged ${val} ${unit} of ${display} 🏆`;
    }
  }
}

/* ── Main component ──────────────────────────────────────────────────── */
export default async function LiveAchievementTicker({ groupId }: { groupId: string }) {
  const supabase = await createClient();

  // Fetch 15 most recent verified logs scoped to this group.
  const { data: logs } = await supabase
    .from('metric_logs')
    .select(`
      value,
      metric_slug,
      unit,
      profiles!inner ( full_name, nickname )
    `)
    .eq('group_id', groupId)
    .eq('status', 'verified')
    .order('logged_at', { ascending: false })
    .limit(15);

  const rows = (logs ?? []) as unknown as LogRow[];

  const sentences: string[] =
    rows.length > 0
      ? rows.map(formatAchievement)
      : [
          'Be the first to log an activity! 🚀',
          'Log your first run, lift, or swim to appear here 🏆',
          'The Growth Club is warming up… 🔥',
        ];

  const doubled = [...sentences, ...sentences];

  return (
    <div
      className="overflow-hidden whitespace-nowrap flex w-full bg-slate-900 border-y-2 border-yellow-400 py-2.5 relative select-none items-center"
      aria-label="Live achievement ticker"
      role="marquee"
    >
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0%); }
          to { transform: translateX(-50%); }
        }
        .animate-ticker-marquee {
          display: flex;
          white-space: nowrap;
          animation: marquee 60s linear infinite;
        }
        @keyframes flashRed {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .flash-red-dot {
          animation: flashRed 1s infinite;
        }
      `}</style>

      {/* Pinned Broadcast Tag */}
      <div className="z-10 bg-slate-900 pl-4 pr-3 py-1 flex-shrink-0 flex items-center gap-1.5 font-mono font-black tracking-widest text-red-500 uppercase text-xs md:text-sm border-r border-slate-800">
        <span className="w-2.5 h-2.5 rounded-full bg-red-600 flash-red-dot flex-shrink-0" />
        <span>🚨 BREAKING NEWS</span>
      </div>

      {/* Scrolling Track Content */}
      <div className="flex-grow overflow-hidden flex items-center">
        <div className="animate-ticker-marquee" style={{ willChange: 'transform' }}>
          {doubled.map((sentence, i) => (
            <span key={i} className="inline-flex items-center gap-2 font-mono font-black tracking-widest text-yellow-300 uppercase text-xs md:text-sm mr-16">
              <span>{sentence}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
