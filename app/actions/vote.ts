'use server';

import { createClient as createBaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getAdminClient() {
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type VoteResult = { success: true } | { success: false; error: string };

/**
 * Inserts a vote row for `logId` by `userId`.
 * The DB UNIQUE(log_id, user_id) constraint prevents double-votes.
 * The DB RLS INSERT policy on log_votes prevents self-votes (ml.user_id <> auth.uid()).
 * Because we use the admin client (bypasses RLS for the anon kiosk session),
 * we enforce the self-vote check here in application code.
 * Spec: architecture.md §2, §3
 */
export async function castVoteAction(
  logId: string,
  logOwnerId: string,
  voterId: string,
): Promise<VoteResult> {
  if (logOwnerId === voterId) {
    return { success: false, error: 'You cannot verify your own activity.' };
  }

  const supabase = getAdminClient();

  // Check if already voted
  const { data: existing } = await supabase
    .from('log_votes')
    .select('id')
    .eq('log_id', logId)
    .eq('user_id', voterId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'You already verified this activity.' };
  }

  const { error } = await supabase
    .from('log_votes')
    .insert({ log_id: logId, user_id: voterId });

  if (error) {
    console.error('VOTE INSERT ERROR:', error.message, error.details, error.code);
    return { success: false, error: error.message ?? 'Failed to cast vote.' };
  }

  // Trigger manual check/update to verified status if DB trigger has lag/missing
  const { data: votes } = await supabase
    .from('log_votes')
    .select('id')
    .eq('log_id', logId);

  if (votes && votes.length >= 3) {
    await supabase
      .from('metric_logs')
      .update({ status: 'verified' })
      .eq('id', logId);
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Server Action: cast peer approval vote on a pending activity log.
 */
export async function approveActivityAction(
  logId: string,
  voterId: string,
  logOwnerId: string,
): Promise<VoteResult> {
  const result = await castVoteAction(logId, logOwnerId, voterId);
  if (result.success) {
    revalidatePath('/dashboard');
  }
  return result;
}

/**
 * Server Action: update log status to 'rejected'.
 */
export async function rejectActivityAction(
  logId: string,
  voterId: string,
): Promise<VoteResult> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('metric_logs')
    .update({ status: 'rejected' })
    .eq('id', logId);

  if (error) {
    console.error('[rejectActivityAction] Error:', error.message);
    return { success: false, error: 'Failed to reject activity.' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Server Action: safely delete a metric log if caller matches owner.
 */
export async function deleteActivityAction(
  logId: string,
  userId: string,
): Promise<VoteResult> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('metric_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', userId);

  if (error) {
    console.error('[deleteActivityAction] Error:', error.message);
    return { success: false, error: 'Failed to delete activity.' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
