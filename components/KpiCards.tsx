import { PersonStanding, Zap, Dumbbell, Timer, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Circumference of SVG donut circle with r=22: 2π*22 ≈ 138.23
const CIRC = 2 * Math.PI * 22;

export type KpiData = {
  totalActivities: number;
  topSpeed: number | null;    // mph
  heaviestLift: number | null; // lbs
  longestRun: number | null;  // mi
  caloriesBurned: number | null; // kcal
};

interface KpiCardsProps {
  data: KpiData;
}

function DonutIcon({
  Icon,
  color,
  progress,
}: {
  Icon: LucideIcon;
  color: string;
  progress: number;
}) {
  const filled = (progress / 100) * CIRC;
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg viewBox="0 0 52 52" className="w-14 h-14" aria-hidden="true">
        {/* Track */}
        <circle cx="26" cy="26" r="22" fill="none" stroke="#F3F4F6" strokeWidth="3.5" />
        {/* Progress arc */}
        <circle
          cx="26" cy="26" r="22"
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${CIRC}`}
          strokeDashoffset={CIRC * 0.25}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon size={20} style={{ color }} strokeWidth={2.2} />
      </div>
    </div>
  );
}

function fmt(v: number | null, decimals = 0): string {
  if (v === null) return '—';
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Bottom row — 5 KPI summary cards — live data only, no mock arrays.
 * Spec: Features.md §5 — donut-stroke icon, large numeric value, delta tag.
 */
export default function KpiCards({ data }: KpiCardsProps) {
  const items = [
    {
      id: 'activities',
      label: 'TOTAL ACTIVITIES',
      value: String(data.totalActivities),
      unit: '',
      icon: PersonStanding,
      color: '#34C759',
      // Progress: cap at 50 activities as "full"
      progress: Math.min(100, (data.totalActivities / 50) * 100),
      delta: data.totalActivities > 0 ? `${data.totalActivities} logged` : 'No logs yet',
      deltaClass: data.totalActivities > 0 ? 'text-[#16A34A]' : 'text-[#9CA3AF]',
    },
    {
      id: 'speed',
      label: 'TOP SPEED (BEST)',
      value: fmt(data.topSpeed, 1),
      unit: data.topSpeed !== null ? 'mph' : '',
      icon: Zap,
      color: '#FF3B30',
      progress: data.topSpeed !== null ? Math.min(100, (data.topSpeed / 150) * 100) : 0,
      delta: data.topSpeed !== null ? 'Group best' : 'No logs yet',
      deltaClass: data.topSpeed !== null ? 'text-[#FF3B30]' : 'text-[#9CA3AF]',
    },
    {
      id: 'lift',
      label: 'HEAVIEST LIFT',
      value: fmt(data.heaviestLift),
      unit: data.heaviestLift !== null ? 'lbs' : '',
      icon: Dumbbell,
      color: '#AF52DE',
      progress: data.heaviestLift !== null ? Math.min(100, (data.heaviestLift / 500) * 100) : 0,
      delta: data.heaviestLift !== null ? 'Group PR' : 'No logs yet',
      deltaClass: data.heaviestLift !== null ? 'text-[#AF52DE]' : 'text-[#9CA3AF]',
    },
    {
      id: 'run',
      label: 'LONGEST RUN',
      value: fmt(data.longestRun, 1),
      unit: data.longestRun !== null ? 'mi' : '',
      icon: Timer,
      color: '#007AFF',
      progress: data.longestRun !== null ? Math.min(100, (data.longestRun / 26.2) * 100) : 0,
      delta: data.longestRun !== null ? 'Group best' : 'No logs yet',
      deltaClass: data.longestRun !== null ? 'text-[#007AFF]' : 'text-[#9CA3AF]',
    },
    {
      id: 'calories',
      label: 'CALORIES BURNED',
      value: fmt(data.caloriesBurned),
      unit: data.caloriesBurned !== null ? 'kcal' : '',
      icon: Flame,
      color: '#CEFF00',
      progress: data.caloriesBurned !== null ? Math.min(100, (data.caloriesBurned / 5000) * 100) : 0,
      delta: data.caloriesBurned !== null ? 'Group total' : 'No logs yet',
      deltaClass: data.caloriesBurned !== null ? 'text-[#65A30D]' : 'text-[#9CA3AF]',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map(({ id, label, value, unit, icon, color, progress, delta, deltaClass }) => (
        <div
          key={id}
          className="rounded-[24px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-5 flex flex-col gap-3"
        >
          <DonutIcon Icon={icon} color={color} progress={progress} />
          <div>
            <p className="text-[10px] font-bold tracking-wider text-[#6B7280] uppercase leading-tight">
              {label}
            </p>
            <p className="text-3xl font-black text-[#111827] leading-tight mt-0.5 tabular-nums">
              {value}
              {unit && (
                <span className="text-base font-semibold text-[#6B7280] ml-1">{unit}</span>
              )}
            </p>
            <p className={`text-[11px] font-semibold mt-1 ${deltaClass}`}>{delta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
