import { CalendarDays, ChevronDown, PersonStanding, Dumbbell, Zap, Scale, Flame } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AddActivityModal from '@/components/AddActivityModal';
import MetricChart, { type ChartUser } from '@/components/MetricChart';
import BreakingNewsFeed, { type FeedItem } from '@/components/BreakingNewsFeed';
import KpiCards, { type KpiData } from '@/components/KpiCards';

/**
 * Dashboard page — async Server Component.
 * Fetches live Supabase data; no hardcoded mock arrays anywhere.
 * Spec: Features.md §3–§5, frontend.md §2–§4
 */

const METRIC_PILLS = [
  { id: 'long_run',  label: 'Long Run',  icon: PersonStanding, bg: 'bg-[#EAFCDB]', color: 'text-[#1E1E1E]' },
  { id: 'deadlift',  label: 'Deadlift',  icon: Dumbbell,       bg: 'bg-[#F3E8FF]', color: 'text-[#1E1E1E]' },
  { id: 'top_speed', label: 'Top Speed', icon: Zap,            bg: 'bg-[#FFE5E5]', color: 'text-[#FF3B30]' },
  { id: 'weight',    label: 'Weight',    icon: Scale,          bg: 'bg-[#E0F4F4]', color: 'text-[#1E1E1E]' },
  { id: 'calories',  label: 'Calories',  icon: Flame,          bg: 'bg-[#FFFBEB]', color: 'text-[#92400E]' },
];

const COLOR_PALETTE = ['#FF3B30', '#007AFF', '#AF52DE', '#34C759', '#FFCC00'];

// Day index: 0=SUN,1=MON,...,6=SAT → remap to chart Mon=0 … Sun=6
function dayToChartIndex(d: Date): number {
  const js = d.getDay(); // 0=Sun
  return js === 0 ? 6 : js - 1; // Sun→6, Mon→0, …, Sat→5
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // ── Auth context ─────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  let groupId: string | null = null;

  if (user) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', user.id)
      .single();
    groupId = prof?.group_id ?? null;
  }

  // Sandbox fallback (dev with no auth)
  if (!groupId) {
    const { data: any } = await supabase
      .from('profiles')
      .select('group_id')
      .not('group_id', 'is', null)
      .limit(1)
      .single();
    groupId = (any as { group_id: string } | null)?.group_id ?? null;
  }

  // ── Metric configs ────────────────────────────────────────────────
  const { data: configs = [] } = await supabase
    .from('metrics_config')
    .select('id, slug, display_name, unit');

  const cfgBySlug = Object.fromEntries((configs ?? []).map(c => [c.slug, c]));

  // ── Last 7 days of verified logs for this group ──────────────────
  const since = new Date();
  since.setDate(since.getDate() - 7);

  let allLogs: Array<{
    id: string;
    value: number;
    logged_at: string;
    user_id: string;
    metric_id: string;
  }> = [];

  let profileMap: Record<string, { full_name: string; avatar_url: string }> = {};

  if (groupId) {
    // 1. Fetch verified logs in date window (RLS scopes to the group)
    const { data: logs } = await supabase
      .from('metric_logs')
      .select('id, value, logged_at, user_id, metric_id')
      .eq('status', 'verified')
      .gte('logged_at', since.toISOString())
      .order('logged_at', { ascending: false });

    allLogs = (logs ?? []) as typeof allLogs;

    // 2. Fetch profiles for unique user_ids
    const uids = [...new Set(allLogs.map(l => l.user_id))];
    if (uids.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', uids);
      profileMap = Object.fromEntries(
        (profiles ?? []).map(p => [p.id, { full_name: p.full_name ?? 'Athlete', avatar_url: p.avatar_url ?? '' }])
      );
    }
  }

  // ── Build KPI stats (server-side, no raw array shipped to browser) ─
  const speedId   = cfgBySlug['top_speed']?.id ?? '';
  const liftId    = cfgBySlug['deadlift']?.id  ?? '';
  const runId     = cfgBySlug['long_run']?.id  ?? '';
  const calId     = cfgBySlug['calories']?.id  ?? '';

  const maxOf = (metricId: string) => {
    const vals = allLogs.filter(l => l.metric_id === metricId).map(l => Number(l.value));
    return vals.length > 0 ? Math.max(...vals) : null;
  };
  const sumOf = (metricId: string) => {
    const vals = allLogs.filter(l => l.metric_id === metricId).map(l => Number(l.value));
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : null;
  };

  const kpiData: KpiData = {
    totalActivities: allLogs.length,
    topSpeed:        maxOf(speedId),
    heaviestLift:    maxOf(liftId),
    longestRun:      maxOf(runId),
    caloriesBurned:  sumOf(calId),
  };

  // ── Build chart series for Long Run (default view) ────────────────
  const chartMetricId = cfgBySlug['long_run']?.id ?? '';
  const chartMetricName = cfgBySlug['long_run']?.display_name ?? 'Weekly Progress';
  const chartLogs = allLogs.filter(l => l.metric_id === chartMetricId);

  // Group by user, aggregate per day (take max value per day per user)
  const userSeriesMap: Record<string, { data: number[] }> = {};
  const userOrder: string[] = [];

  for (const log of chartLogs) {
    const uid = log.user_id;
    if (!userSeriesMap[uid]) {
      userSeriesMap[uid] = { data: Array(7).fill(0) };
      userOrder.push(uid);
    }
    const dayIdx = dayToChartIndex(new Date(log.logged_at));
    userSeriesMap[uid].data[dayIdx] = Math.max(userSeriesMap[uid].data[dayIdx], Number(log.value));
  }

  const chartUsers: ChartUser[] = userOrder.slice(0, 5).map((uid, i) => ({
    name: profileMap[uid]?.full_name ?? 'Athlete',
    color: COLOR_PALETTE[i % COLOR_PALETTE.length],
    avatar_url: profileMap[uid]?.avatar_url ?? '',
    data: userSeriesMap[uid].data,
  }));

  // ── Build breaking news feed (5 most recent logs) ─────────────────
  const feedItems: FeedItem[] = allLogs.slice(0, 5).map((log) => {
    const cfg = (configs ?? []).find(c => c.id === log.metric_id);
    const prof = profileMap[log.user_id];
    const d = new Date(log.logged_at);
    return {
      id: log.id,
      name: prof?.full_name ?? 'Athlete',
      avatar_url: prof?.avatar_url ?? '',
      action: `logged ${cfg?.display_name ?? 'activity'}`,
      metric: `${log.value} ${cfg?.unit ?? ''}`.trim(),
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  return (
    <div className="p-4 md:p-8">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-start justify-between gap-4 mb-6">

          {/* Left — Brand block */}
          <div className="min-w-0">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[#111827] leading-none">
              The Growth Club
            </h1>
            <p className="mt-2 text-[11px] font-bold tracking-[0.18em] text-[#6B7280] uppercase">
              Train Together. Compete Together. Grow Together.
            </p>
            {/* Hand-drawn green underline accent */}
            <svg
              width="340" height="14" viewBox="0 0 340 14"
              fill="none" aria-hidden="true" className="mt-0.5 max-w-full"
            >
              <path
                d="M2 10 C40 3, 90 13, 140 7 S210 2, 260 8 S305 12, 338 6"
                stroke="#22C55E" strokeWidth="2.8" strokeLinecap="round" fill="none"
              />
            </svg>
          </div>

          {/* Right — Controls */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button
              id="date-range-picker"
              className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-xl px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium text-[#111827] shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:bg-gray-50 transition-colors"
            >
              <CalendarDays size={14} className="text-[#6B7280]" />
              <span className="hidden sm:inline">Last 7 Days</span>
              <span className="sm:hidden">7d</span>
              <ChevronDown size={13} className="text-[#6B7280]" />
            </button>

            <AddActivityModal />
          </div>
        </header>

        {/* ── Metric Selector Pills ────────────────────────────────────── */}
        <div
          className="flex gap-2 md:gap-3 mb-6 overflow-x-auto pb-1 scrollbar-none"
          role="group"
          aria-label="Metric selector"
        >
          {METRIC_PILLS.map(({ id, label, icon: Icon, bg, color }) => (
            <button
              key={id}
              id={`metric-pill-${id}`}
              aria-pressed={id === 'long_run'}
              className={[
                'flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl',
                'text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-opacity',
                bg, color,
              ].join(' ')}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Middle row: Chart + Breaking News ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 md:gap-6 mb-5 md:mb-6">
          <MetricChart
            users={chartUsers}
            title={chartMetricName}
          />
          <BreakingNewsFeed items={feedItems} />
        </div>

        {/* ── Bottom row: 5 KPI summary cards ─────────────────────────── */}
        <KpiCards data={kpiData} />

      </div>
  );
}
