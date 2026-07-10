/**
 * lib/queries.ts — Server-side data fetching utilities.
 *
 * All functions accept a Supabase server client and operate server-side only.
 * RLS on the Supabase project ensures all results are automatically scoped
 * to the calling user's groups; the groupId parameter acts as an additional
 * explicit filter for performance (index scan on group_id).
 *
 * Spec: architecture.md §4 (Dynamic Query Engine)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/* ── Types ────────────────────────────────────────────────────────────────── */

export type MetricLogRow = {
  id: string;
  user_id: string;
  group_id: string;
  metric_slug: string;
  value: number;
  unit: string;
  status: 'pending' | 'verified' | 'rejected';
  logged_at: string;
  evidence_url: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

export type DashboardData = {
  logs: MetricLogRow[];
  kpi: {
    totalActivities: number;
    topSpeed: number | null;
    heaviestLift: number | null;
    longestRun: number | null;
    caloriesBurned: number | null;
  };
};

/* ── getDashboardData ─────────────────────────────────────────────────────── */

/**
 * Fetches the most recent verified logs for a group.
 *
 * @param supabase   Supabase server client (SSR, carries the user's session)
 * @param groupId    The group UUID to filter by (explicit + RLS double-fences)
 * @param metricSlug Optional slug to narrow to one metric (e.g. 'deadlift')
 * @param days       Lookback window in days (default 7)
 * @param limit      Maximum rows to return (default 50)
 */
export async function getDashboardData(
  supabase: SupabaseClient,
  groupId: string,
  metricSlug?: string,
  days = 7,
  limit = 50,
): Promise<DashboardData> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Base query — join profiles for author name + avatar
  let query = supabase
    .from('metric_logs')
    .select(`
      id,
      user_id,
      group_id,
      metric_slug,
      value,
      unit,
      status,
      logged_at,
      evidence_url,
      profiles!inner ( full_name, avatar_url )
    `)
    .eq('group_id', groupId)          // explicit group filter (performance)
    .eq('status', 'verified')         // only show peer-approved data
    .gte('logged_at', since.toISOString())
    .order('logged_at', { ascending: false })
    .limit(limit);

  // Conditional metric filter — appended only when slug is provided
  if (metricSlug) {
    query = query.eq('metric_slug', metricSlug);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getDashboardData] Supabase error:', error.message);
  }

  const logs = (data ?? []) as unknown as MetricLogRow[];

  // ── KPI aggregates (server-side, nothing raw shipped to browser) ────────
  const maxOf = (slug: string) => {
    const vals = logs.filter(l => l.metric_slug === slug).map(l => Number(l.value));
    return vals.length ? Math.max(...vals) : null;
  };
  const sumOf = (slug: string) => {
    const vals = logs.filter(l => l.metric_slug === slug).map(l => Number(l.value));
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  };

  return {
    logs,
    kpi: {
      totalActivities: logs.length,
      topSpeed:        maxOf('top_speed'),
      heaviestLift:    maxOf('deadlift'),
      longestRun:      maxOf('long_run'),
      caloriesBurned:  sumOf('calories'),
    },
  };
}

/* ── getGroupIdForUser ────────────────────────────────────────────────────── */

/**
 * Returns the first group_id the authenticated user belongs to.
 * Used as a default when no specific group is selected.
 */
export async function getGroupIdForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  return (data as { group_id: string } | null)?.group_id ?? null;
}

/* ── getPendingLogsForGroup ───────────────────────────────────────────────── */

/**
 * Returns pending logs for a group — used by the peer-review UI.
 * Excludes the calling user's own logs (they cannot vote on their own entries).
 */
export async function getPendingLogsForGroup(
  supabase: SupabaseClient,
  groupId: string,
  callerId: string,
): Promise<MetricLogRow[]> {
  const { data, error } = await supabase
    .from('metric_logs')
    .select(`
      id,
      user_id,
      group_id,
      metric_slug,
      value,
      unit,
      status,
      logged_at,
      evidence_url,
      profiles!inner ( full_name, avatar_url )
    `)
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .neq('user_id', callerId)         // caller cannot vote on own logs
    .order('logged_at', { ascending: true })
    .limit(20);

  if (error) {
    console.error('[getPendingLogsForGroup] Supabase error:', error.message);
  }

  return (data ?? []) as unknown as MetricLogRow[];
}
