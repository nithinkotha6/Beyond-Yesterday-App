'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, decodeSession } from '@/lib/session';
 
export async function createMetricDefinition(name: string, unit: string, sortDirection: 'asc' | 'desc') {
  if (!name.trim() || !unit.trim() || !sortDirection) {
    return { success: false, error: 'All fields are required.' };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? await decodeSession(token) : null;
  if (!session) {
    return { success: false, error: 'Unauthorized: Session credentials mismatch.' };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('metric_definitions')
    .insert({
      name: name.trim(),
      unit: unit.trim(),
      sort_direction: sortDirection,
      group_id: session.groupId,
    })
    .select()
    .single();

  if (error) {
    console.error('[createMetricDefinition] error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings/metrics');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/leaderboard');
  return { success: true, definition: data };
}
