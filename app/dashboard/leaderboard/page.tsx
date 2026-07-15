import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { decodeSession, SESSION_COOKIE } from '@/lib/session';
import UserAvatar from '@/components/UserAvatar';
import CheerButton from '@/components/CheerButton';

function PodiumWreath({ className }: { className?: string }) {
  // Generate 8 pairs of leaves along the curve
  const nodes = [];
  const nodeCount = 9;
  for (let i = 0; i < nodeCount; i++) {
    const t = i / (nodeCount - 1);
    // Angle from bottom-left (approx 1.75 rad) to top-left (approx 4.1 rad)
    const angle = 1.75 + t * 2.35;
    const radius = 62;
    const x = 100 + radius * Math.cos(angle);
    const y = 92 + radius * Math.sin(angle);
    const rot = (angle * 180) / Math.PI + 90;
    nodes.push({ x, y, rot });
  }

  return (
    <svg className={className} viewBox="0 0 200 200" fill="currentColor">
      {/* Left Branch */}
      <g>
        {/* Stem curve */}
        <path 
          d="M 100,162 C 58,162 33,130 33,92 C 33,54 58,22 100,22" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          opacity="0.85" 
        />
        {/* Leaf pairs */}
        {nodes.map((node, i) => (
          <g key={i} transform={`translate(${node.x}, ${node.y}) rotate(${node.rot})`}>
            {/* Outer leaf */}
            <path 
              d="M0,0 C-4,-8 -9,-15 -3,-22 C1,-22 4,-12 0,0" 
              transform="rotate(-20) scale(0.95)"
            />
            {/* Inner leaf */}
            <path 
              d="M0,0 C4,-8 9,-15 3,-22 C-1,-22 -4,-12 0,0" 
              transform="rotate(20) scale(0.95)"
            />
          </g>
        ))}
      </g>

      {/* Right Branch (Mirrored across x = 100 center line) */}
      <g transform="translate(200, 0) scale(-1, 1)">
        {/* Stem curve */}
        <path 
          d="M 100,162 C 58,162 33,130 33,92 C 33,54 58,22 100,22" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          opacity="0.85" 
        />
        {/* Leaf pairs */}
        {nodes.map((node, i) => (
          <g key={i} transform={`translate(${node.x}, ${node.y}) rotate(${node.rot})`}>
            {/* Outer leaf */}
            <path 
              d="M0,0 C-4,-8 -9,-15 -3,-22 C1,-22 4,-12 0,0" 
              transform="rotate(-20) scale(0.95)"
            />
            {/* Inner leaf */}
            <path 
              d="M0,0 C4,-8 9,-15 3,-22 C-1,-22 -4,-12 0,0" 
              transform="rotate(20) scale(0.95)"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

function RibbonBanner({ 
  className, 
  text, 
  colorMain = '#EF4444', 
  colorDark = '#B91C1C', 
  colorDarkest = '#7F1D1D' 
}: { 
  className?: string; 
  text: string;
  colorMain?: string;
  colorDark?: string;
  colorDarkest?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 200 60">
      {/* Left Swallow-Tail Wing */}
      <polygon points="50,15 15,15 28,28 15,40 50,40" fill={colorDark} />
      
      {/* Right Swallow-Tail Wing */}
      <polygon points="150,15 185,15 172,28 185,40 150,40" fill={colorDark} />
      
      {/* Left Shadow Fold triangle */}
      <polygon points="50,40 62,40 62,48" fill={colorDarkest} />
      
      {/* Right Shadow Fold triangle */}
      <polygon points="150,40 138,40 138,48" fill={colorDarkest} />
      
      {/* Center Main Banner Plate */}
      <polygon points="58,8 142,8 142,40 58,40" fill={colorMain} />
      
      {/* Banner Text overlay */}
      <text 
        x="100" 
        y="26" 
        fill="white" 
        fontSize="9" 
        fontWeight="900" 
        letterSpacing="1.2" 
        textAnchor="middle" 
        dominantBaseline="middle"
        className="font-sans select-none tracking-widest font-black"
      >
        {text}
      </text>
    </svg>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="bg-[#FFFDF0] text-base rounded-full w-6 h-6 flex items-center justify-center shadow border border-yellow-400 select-none">
        🥇
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="bg-[#F8FAFC] text-base rounded-full w-6 h-6 flex items-center justify-center shadow border border-slate-300 select-none">
        🥈
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="bg-[#FFFBEB] text-base rounded-full w-6 h-6 flex items-center justify-center shadow border border-amber-600 select-none">
        🥉
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 select-none flex-shrink-0">
      <div 
        className="w-8 h-8 flex items-center justify-center font-black text-xs text-white relative bg-slate-800 shadow-sm"
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
      >
        {rank}
      </div>
      <span className="text-base" role="img" aria-label="Medal">🏅</span>
    </div>
  );
}

// Curated list of metrics for ranking
const LEADERBOARD_METRICS = [
  { id: 'top_golf',         label: 'Top Golf Shot',     unit: 'Yards',  isCumulative: false },
  { id: 'weight',           label: 'Weight',            unit: 'lbs',    isCumulative: false },
  { id: 'highest_steps',   label: 'Highest Steps',     unit: 'steps',  isCumulative: false },
  { id: 'marathon',         label: 'Marathon',          unit: 'hrs',    isCumulative: false },
  { id: 'car_top_speed',   label: 'Car Top Speed',     unit: 'mph',    isCumulative: false },
  { id: 'underwater_swim', label: 'Underwater Swim',   unit: 'meters', isCumulative: false },
  { id: 'most_beers',      label: 'Most Beers',        unit: 'beers',  isCumulative: false },
  { id: 'catan_wins',      label: 'Catan Wins',        unit: 'wins',   isCumulative: true  },
  { id: 'national_parks',  label: 'National Parks',    unit: 'parks',  isCumulative: true  },
  { id: 'total_activities', label: 'Total Activities', unit: 'logs',   isCumulative: true  },
];

interface LeaderboardPageProps {
  searchParams: Promise<{ metric?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  // ── Session Authentication ─────────────────────────────────────────────
  const cookieStore = await cookies();
  const token       = cookieStore.get(SESSION_COOKIE)?.value;
  const session     = token ? await decodeSession(token) : null;
  if (!session) redirect('/');

  const { groupId, userId } = session;

  // ── Search Parameter Resolution ─────────────────────────────────────────
  const supabase = createAdminClient();

  // Query custom dynamic metric definitions from database (Pillar 4)
  const { data: dbDefinitions } = await supabase
    .from('metric_definitions')
    .select('*')
    .order('created_at', { ascending: true });

  const customMetrics = (dbDefinitions || []).map((def) => ({
    id: def.id,
    label: def.name,
    unit: def.unit,
    isCumulative: true,
    sort_direction: def.sort_direction
  }));

  const allMetrics = [
    ...LEADERBOARD_METRICS,
    ...customMetrics
  ];

  const params = await searchParams;
  const rawMetric = params.metric ?? 'top_golf';
  const metricPill = allMetrics.find((m) => m.id === rawMetric) ?? allMetrics[0];
  const activeMetric = metricPill.id;

  // ── Fetch Data from Supabase ────────────────────────────────────────────


  // 1. Fetch group details for header display
  const { data: group } = await supabase
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .single();

  // 2. Fetch all members belonging to the active group
  const { data: membersRaw } = await supabase
    .from('group_members')
    .select(`
      user_id,
      profiles!inner ( id, full_name, nickname, avatar_url, total_xp, current_level )
    `)
    .eq('group_id', groupId);

  // 3. Fetch all verified logs for the group, including profiles
  const logsQuery = supabase
    .from('metric_logs')
    .select(`
      user_id,
      value,
      metric_slug,
      profiles!inner ( id, full_name, nickname, avatar_url, total_xp, current_level )
    `)
    .eq('group_id', groupId)
    .eq('status', 'verified');

  // Filter logs by active metric slug, unless querying total activities
  if (activeMetric !== 'total_activities') {
    logsQuery.eq('metric_slug', activeMetric);
  }

  const { data: logsRaw } = await logsQuery;

  interface LeaderboardEntry {
    profile: {
      id: string;
      full_name: string | null;
      nickname: string | null;
      avatar_url: string | null;
      total_xp: number;
      current_level: number;
    };
    score: number;
    hasLogged: boolean;
  }

  type MemberProfile = {
    profiles: {
      id: string;
      full_name: string | null;
      nickname: string | null;
      avatar_url: string | null;
      total_xp: number;
      current_level: number;
    } | null;
  };

  type LogWithProfile = {
    user_id: string;
    value: number;
    metric_slug: string;
    profiles: {
      id: string;
      full_name: string | null;
      nickname: string | null;
      avatar_url: string | null;
      total_xp: number;
      current_level: number;
    } | null;
  };

  const members = (membersRaw as unknown as MemberProfile[]) ?? [];
  const logs = (logsRaw as unknown as LogWithProfile[]) ?? [];

  // Deduplicate and aggregate scores
  const userMap = new Map<string, LeaderboardEntry>();

  // Initialize with all members in the group (so everyone is represented, score defaults to 0)
  for (const m of members) {
    if (m.profiles) {
      userMap.set(m.profiles.id, {
        profile: m.profiles,
        score: 0,
        hasLogged: false,
      });
    }
  }

  const isLowerBetter = activeMetric === 'marathon' || (metricPill as { sort_direction?: string }).sort_direction === 'asc';

  // Process logs, reducing each user's records to their best single score (or sum/count)
  for (const log of logs) {
    const profile = log.profiles;
    if (!profile) continue;

    const existing = userMap.get(log.user_id);
    const logValue = Number(log.value);

    if (!existing) {
      // In case a log is found for a user not explicitly returned in the members list
      userMap.set(log.user_id, {
        profile,
        score: activeMetric === 'total_activities' ? 1 : logValue,
        hasLogged: true,
      });
      continue;
    }

    if (activeMetric === 'total_activities') {
      existing.score = existing.hasLogged ? existing.score + 1 : 1;
      existing.hasLogged = true;
    } else if (metricPill.isCumulative) {
      existing.score = existing.hasLogged ? existing.score + logValue : logValue;
      existing.hasLogged = true;
    } else {
      if (!existing.hasLogged) {
        existing.score = logValue;
        existing.hasLogged = true;
      } else {
        existing.score = isLowerBetter
          ? Math.min(existing.score, logValue)
          : Math.max(existing.score, logValue);
      }
    }
  }

  // Convert map to array, round values, and sort properly
  const leaderboard: LeaderboardEntry[] = Array.from(userMap.values())
    .map((entry) => ({
      ...entry,
      score: Math.round(entry.score * 10) / 10,
    }))
    .sort((a, b) => {
      // Unlogged athletes sit at the absolute bottom
      if (a.hasLogged && !b.hasLogged) return -1;
      if (!a.hasLogged && b.hasLogged) return 1;
      if (!a.hasLogged && !b.hasLogged) return 0;
      // Sort logged athletes depending on whether lower is better (marathon) or higher is better
      return isLowerBetter ? a.score - b.score : b.score - a.score;
    });

  // Distribute into Podium and Table lists
  const podiumAthletes = leaderboard.slice(0, 3);
  const tableAthletes  = leaderboard.slice(3);

  // Placeholders if group has fewer than 3 athletes
  const firstPlace  = podiumAthletes[0] ?? null;
  const secondPlace = podiumAthletes[1] ?? null;
  const thirdPlace  = podiumAthletes[2] ?? null;

  return (
    <div className="flex flex-col gap-y-4 px-4 md:px-8 pt-4 pb-24 min-h-screen bg-[#F7F8FA] min-w-0">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <header>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[#111827] leading-none flex items-center gap-3">
          <Trophy className="text-[#CEFF00] w-10 h-10 stroke-[2.5]" />
          Leaderboard
        </h1>
        <p className="mt-2 text-[11px] font-bold tracking-[0.18em] text-[#6B7280] uppercase">
          {group?.name ?? 'Texas Buds'} · Competitive Rankings
        </p>
        <svg width="220" height="14" viewBox="0 0 220 14" fill="none" aria-hidden="true" className="mt-1">
          <path d="M2 10 C30 3, 70 13, 110 7 S165 2, 218 6" stroke="#CEFF00" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        </svg>
      </header>

      {/* ── Metric Pill Selector ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide max-w-full">
        {allMetrics.map((m) => {
          const isSelected = activeMetric === m.id;
          return (
            <a
              key={m.id}
              href={`/dashboard/leaderboard?metric=${m.id}`}
              id={`metric-pill-${m.id}`}
              className={`px-4 rounded-full border text-xs font-bold whitespace-nowrap transition-[transform,background-color] duration-150 ease-out cursor-pointer min-h-[44px] flex items-center justify-center ${
                isSelected
                  ? 'bg-[#111827] text-[#CEFF00] border-[#111827] shadow-sm scale-102'
                  : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F9FAFB]'
              }`}
            >
              {m.label}
            </a>
          );
        })}
      </div>

      {/* ── Olympic Podium (Top 3) ───────────────────────────────────── */}
      <div 
        className="flex items-end justify-center gap-3 md:gap-6 bg-white rounded-[24px] border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 max-w-full overflow-hidden"
        style={{ minHeight: '280px' }}
      >
        {/* 2nd Place (Left Pedestal) */}
        <div className="flex flex-col items-center order-1 w-1/3 max-w-[150px]">
          {secondPlace ? (
            <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative flex flex-col items-center justify-center w-36 h-40 mb-2">
                {/* 1. The Laurel Wreath Background */}
                <PodiumWreath className="absolute inset-0 w-full h-full text-[#94A3B8] drop-shadow-md z-0 pointer-events-none" />

                {/* 2. Center Profile Avatar */}
                <div className="z-10 relative">
                  <UserAvatar 
                    user={secondPlace.profile} 
                    size="xl" 
                    className="shadow-md border-4 border-slate-300 hover:scale-105 transition-transform"
                  />
                </div>

                {/* 3. The Folded Award Ribbon */}
                <div className="z-20 -mt-2.5 w-full flex justify-center">
                  <RibbonBanner 
                    text="2ND PLACE" 
                    className="w-full h-10 drop-shadow-md" 
                    colorMain="#64748B" 
                    colorDark="#475569" 
                    colorDarkest="#334155" 
                  />
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#111827] truncate max-w-full mb-2">
                {secondPlace.profile.nickname || secondPlace.profile.full_name}
              </span>
              <div 
                className="relative w-full bg-white/80 border border-slate-300/40 flex flex-col items-center justify-center shadow-md p-1"
                style={{
                  height: '72px',
                  clipPath: 'polygon(10% 0%, 90% 0%, 90% 10px, 100% 10px, 100% 100%, 0% 100%, 0% 10px, 10% 10px)',
                }}
              >
                {/* Silver foil top border */}
                <div className="absolute top-0 left-[10%] right-[10%] h-1.5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 shadow-[0_1px_3px_rgba(200,200,200,0.5)]" />
                <span className="text-xl md:text-2xl font-black text-slate-600 tabular-nums tracking-tight mt-2">
                  {secondPlace.score}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {metricPill.unit}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-t-xl flex items-center justify-center">
              <span className="text-xs font-bold text-[#9CA3AF]">—</span>
            </div>
          )}
        </div>

        {/* 1st Place (Center Pedestal) */}
        <div className="flex flex-col items-center order-2 w-1/3 max-w-[180px]">
          {firstPlace ? (
            <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="relative flex flex-col items-center justify-center w-40 h-44 mb-2">
                {/* 1. The Laurel Wreath Background */}
                <PodiumWreath className="absolute inset-0 w-full h-full text-[#FACC15] drop-shadow-md z-0 pointer-events-none" />

                {/* 2. Center Profile Avatar */}
                <div className="z-10 relative">
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 text-xl animate-bounce" role="img" aria-label="Gold Trophy">🏆</span>
                  <UserAvatar 
                    user={firstPlace.profile} 
                    size="2xl" 
                    className="shadow-xl border-4 border-yellow-400 hover:scale-105 transition-transform"
                  />
                </div>

                {/* 3. The Folded Award Ribbon */}
                <div className="z-20 -mt-2.5 w-full flex justify-center">
                  <RibbonBanner 
                    text="CHAMPION" 
                    className="w-full h-11 drop-shadow-md" 
                    colorMain="#EF4444" 
                    colorDark="#B91C1C" 
                    colorDarkest="#7F1D1D" 
                  />
                </div>
              </div>
              <span className="text-xs font-black text-[#111827] truncate max-w-full mb-2">
                {firstPlace.profile.nickname || firstPlace.profile.full_name}
              </span>
              <div 
                className="relative w-full bg-white/90 border border-yellow-500/30 flex flex-col items-center justify-center p-1 shadow-lg"
                style={{
                  height: '100px',
                  clipPath: 'polygon(10% 0%, 90% 0%, 90% 10px, 100% 10px, 100% 100%, 0% 100%, 0% 10px, 10% 10px)',
                }}
              >
                {/* Gold foil top border */}
                <div className="absolute top-0 left-[10%] right-[10%] h-1.5 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 shadow-[0_1px_4px_rgba(250,204,21,0.5)]" />
                <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest mt-2 mb-0.5">Champion</span>
                <span className="text-2xl md:text-3xl font-black text-yellow-600 tabular-nums tracking-tight">
                  {firstPlace.score}
                </span>
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-wider">
                  {metricPill.unit}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full h-20 bg-zinc-50 border border-zinc-100 rounded-t-2xl flex items-center justify-center">
              <span className="text-xs font-bold text-[#9CA3AF]">Empty</span>
            </div>
          )}
        </div>

        {/* 3rd Place (Right Pedestal) */}
        <div className="flex flex-col items-center order-3 w-1/3 max-w-[150px]">
          {thirdPlace ? (
            <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative flex flex-col items-center justify-center w-36 h-40 mb-2">
                {/* 1. The Laurel Wreath Background */}
                <PodiumWreath className="absolute inset-0 w-full h-full text-[#D97706] drop-shadow-md z-0 pointer-events-none" />

                {/* 2. Center Profile Avatar */}
                <div className="z-10 relative">
                  <UserAvatar 
                    user={thirdPlace.profile} 
                    size="xl" 
                    className="shadow-md border-4 border-amber-600 hover:scale-105 transition-transform"
                  />
                </div>

                {/* 3. The Folded Award Ribbon */}
                <div className="z-20 -mt-2.5 w-full flex justify-center">
                  <RibbonBanner 
                    text="3RD PLACE" 
                    className="w-full h-10 drop-shadow-md" 
                    colorMain="#B45309" 
                    colorDark="#92400E" 
                    colorDarkest="#78350F" 
                  />
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#111827] truncate max-w-full mb-2">
                {thirdPlace.profile.nickname || thirdPlace.profile.full_name}
              </span>
              <div 
                className="relative w-full bg-white/80 border border-amber-600/30 flex flex-col items-center justify-center p-1 shadow-md"
                style={{
                  height: '56px',
                  clipPath: 'polygon(10% 0%, 90% 0%, 90% 8px, 100% 8px, 100% 100%, 0% 100%, 0% 8px, 10% 8px)',
                }}
              >
                {/* Bronze foil top border */}
                <div className="absolute top-0 left-[10%] right-[10%] h-1.5 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 shadow-[0_1px_3px_rgba(180,83,9,0.4)]" />
                <span className="text-lg md:text-xl font-black text-amber-800 tabular-nums tracking-tight mt-1.5">
                  {thirdPlace.score}
                </span>
                <span className="text-[8px] font-black text-amber-700 uppercase tracking-wider">
                  {metricPill.unit}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full h-10 bg-zinc-50 border border-zinc-100 rounded-t-xl flex items-center justify-center">
              <span className="text-xs font-bold text-[#9CA3AF]">—</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Rankings List (4th Place & Below) ───────────────────────── */}
      <div className="bg-white rounded-[24px] border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6">
        <h2 className="text-base font-bold text-[#111827] mb-4">Rankings</h2>

        {tableAthletes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {tableAthletes.map((athlete: LeaderboardEntry, index) => {
              const rank = index + 4;
              const isCurrentUser = athlete.profile.id === userId;
              return (
                <div
                  key={athlete.profile.id}
                  className={`rounded-2xl p-3 flex items-center justify-between transition-all duration-200 hover:shadow-[0_4px_15px_rgba(0,0,0,0.03)] border ${
                    isCurrentUser
                      ? 'bg-[#CEFF00]/10 border-[#CEFF00] shadow-sm'
                      : 'bg-white border-[#E5E7EB]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge with Medal Emoji for rank >= 4 */}
                    <RankBadge rank={rank} />
                    {/* Avatar */}
                    <UserAvatar user={athlete.profile} size="lg2" />
                    {/* Profile Details */}
                    <div>
                      <p className="font-bold text-[#111827]">
                        {athlete.profile.nickname || athlete.profile.full_name}
                      </p>
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider tabular-nums">
                        Lv {athlete.profile.current_level} · {athlete.profile.total_xp.toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                  {/* Score & Cheer Button */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-base text-[#111827] tabular-nums tracking-tight">
                        {athlete.score}
                      </span>
                      <span className="text-[10px] font-bold text-[#6B7280] ml-1 uppercase">
                        {metricPill.unit}
                      </span>
                    </div>
                    <CheerButton
                      targetUserId={athlete.profile.id}
                      targetName={athlete.profile.nickname || athlete.profile.full_name || 'Athlete'}
                      metricLabel={metricPill.label}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-[#9CA3AF] font-bold">
            No further rankings. Invite more athletes to grow the competition! 🏃‍♀️
          </div>
        )}
      </div>
    </div>
  );
}
