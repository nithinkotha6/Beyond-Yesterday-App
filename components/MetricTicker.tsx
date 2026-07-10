/**
 * MetricTicker — infinite two-row scrolling marquee.
 * Top row scrolls LEFT, bottom row scrolls RIGHT (opposite direction).
 * Styled as a premium sports-broadcast ticker: dark band, neon accent, small SVG icons.
 * Spec: dashboard UI §3 enhancement
 *
 * Anti-overflow: the outer container uses overflow-hidden so the internal
 * translateX animation never generates a horizontal scrollbar.
 */

type TickerItem = {
  label: string;
  icon: React.ReactNode;
  unit: string;
};

const METRICS: TickerItem[] = [
  {
    label: 'Long Run',
    unit: 'mi',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M13.5 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM8 7.5l-1.5 5H4l2-7h4l1.5 3L13 4h3l2 7h-2.5L14 7.5l-1.5 3.5H10L8 7.5Z" />
      </svg>
    ),
  },
  {
    label: 'Deadlift',
    unit: 'lbs',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2 8h2V6H2v2Zm0 6h2v-2H2v2Zm14-6h2V6h-2v2Zm0 6h2v-2h-2v2ZM5 7v6h10V7H5Zm3-3v2h4V4H8Z" />
      </svg>
    ),
  },
  {
    label: 'Top Speed',
    unit: 'mph',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0 1 12 2v5h4a1 1 0 0 1 .82 1.573l-7 10A1 1 0 0 1 8 18v-5H4a1 1 0 0 1-.82-1.573l7-10a1 1 0 0 1 1.12-.38Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: 'Beers',
    unit: 'cans',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M3 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1h2a2 2 0 0 1 0 4h-2v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Z" />
      </svg>
    ),
  },
  {
    label: 'Calories',
    unit: 'kcal',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 0 0-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 0 0-.613 3.58 2.64 2.64 0 0 1-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 0 0 7.07 4.56C3.48 6.28 2 9.125 2 12c0 3.866 3.134 7 7 7 3.866 0 7-3.134 7-7 0-3.116-1.752-5.835-4.605-7.447Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: 'Longest Swim',
    unit: 'm',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2 10.5a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5Zm0 3a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5ZM10 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      </svg>
    ),
  },
  {
    label: 'Weight',
    unit: 'lbs',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M10 2a1 1 0 0 1 1 1v1.323l3.954 1.582 1.599-.8a1 1 0 0 1 .894 1.79l-1.233.616 1.738 5.42a1 1 0 0 1-.285 1.05A3.989 3.989 0 0 1 15 14a3.989 3.989 0 0 1-2.667-1.019 1 1 0 0 1-.285-1.05l1.715-5.349L11 5.677V19a1 1 0 1 1-2 0V5.677L6.237 7.582l1.715 5.349a1 1 0 0 1-.285 1.05A3.989 3.989 0 0 1 5 15a3.989 3.989 0 0 1-2.667-1.019 1 1 0 0 1-.285-1.05l1.738-5.42-1.233-.617a1 1 0 0 1 .894-1.788l1.599.799L9 4.323V3a1 1 0 0 1 1-1Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: 'Cycling Distance',
    unit: 'mi',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM8 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm2-3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: 'Push-ups',
    unit: 'reps',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm7.5 1A2.5 2.5 0 1 0 11 6.5 2.5 2.5 0 0 0 13.5 9ZM17 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </svg>
    ),
  },
  {
    label: 'Pull-ups',
    unit: 'reps',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M2 5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm1 4a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H3Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: 'Sleep',
    unit: 'hrs',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M17.293 13.293A8 8 0 0 1 6.707 2.707a8.001 8.001 0 1 0 10.586 10.586Z" />
      </svg>
    ),
  },
  {
    label: 'Squat',
    unit: 'lbs',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2 8h2V6H2v2Zm0 6h2v-2H2v2Zm14-6h2V6h-2v2Zm0 6h2v-2h-2v2ZM5 7v6h10V7H5Z" />
      </svg>
    ),
  },
  {
    label: 'Heart Rate',
    unit: 'bpm',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 0 1 5.656 0L10 6.343l1.172-1.171a4 4 0 1 1 5.656 5.656L10 17.657l-6.828-6.829a4 4 0 0 1 0-5.656Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: '5K Time',
    unit: 'min',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm1-12a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l2.828 2.829a1 1 0 1 0 1.415-1.415L11 9.586V6Z" clipRule="evenodd" />
      </svg>
    ),
  },
];

// Duplicate the array so the seamless loop (0% → -50%) works at any container width.
const ROW_A = [...METRICS, ...METRICS];
const ROW_B = [...METRICS.slice().reverse(), ...METRICS.slice().reverse()];

function TickerItem({ item, dimmed }: { item: TickerItem; dimmed?: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-4 whitespace-nowrap',
        'text-[11px] font-bold tracking-[0.12em] uppercase',
        dimmed ? 'text-[#6B7280]' : 'text-white',
      ].join(' ')}
    >
      <span className="text-[#CEFF00] opacity-80">{item.icon}</span>
      {item.label}
      <span className="text-[#6B7280] font-normal normal-case tracking-normal ml-0.5">
        · {item.unit}
      </span>
      {/* bullet separator */}
      <span className="text-[#333] ml-3 select-none">◆</span>
    </span>
  );
}

/**
 * Premium sports-network news-broadcast ticker.
 * Two rows, opposite scroll directions, infinite loop.
 * overflow-hidden on both the outer wrapper and each row track
 * prevents horizontal scrollbar on mobile.
 */
export default function MetricTicker() {
  return (
    <div
      className="w-full overflow-hidden bg-[#0A0A0A] border-b border-white/5"
      aria-label="Metric ticker"
    >
      {/* ── LIVE badge + top row ───────────────────────────────── */}
      <div className="flex items-center ticker-track">
        {/* LIVE badge — fixed left, non-scrolling */}
        <div className="flex-shrink-0 flex items-center gap-1.5 bg-[#CEFF00] text-[#0A0A0A] px-3 h-8 font-black text-[10px] tracking-[0.2em] uppercase z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] animate-pulse" />
          LIVE
        </div>

        {/* Scrolling track — left direction */}
        <div className="flex-1 overflow-hidden h-8 flex items-center">
          <div className="flex animate-ticker-left">
            {ROW_A.map((item, i) => (
              <TickerItem key={i} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* ── TODAY badge + bottom row ───────────────────────────── */}
      <div className="flex items-center ticker-track border-t border-white/[0.04]">
        {/* TODAY badge */}
        <div className="flex-shrink-0 flex items-center gap-1.5 bg-[#1A1A1A] border-r border-white/10 text-[#6B7280] px-3 h-7 font-black text-[10px] tracking-[0.2em] uppercase z-10">
          TODAY
        </div>

        {/* Scrolling track — right direction */}
        <div className="flex-1 overflow-hidden h-7 flex items-center">
          <div className="flex animate-ticker-right">
            {ROW_B.map((item, i) => (
              <TickerItem key={i} item={item} dimmed />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
