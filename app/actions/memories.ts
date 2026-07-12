'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: insert a new memory record with column-probing fallbacks.
 */
export async function addMemory(imageUrl: string, groupId: string, userId: string, caption?: string) {
  if (!imageUrl || !groupId || !userId) {
    return { success: false, error: 'Missing required parameters' };
  }

  const supabase = await createClient();

  // Probing write attempt 1: image_url
  let res = await supabase.from('memories').insert({
    group_id: groupId,
    user_id: userId,
    image_url: imageUrl,
    caption: caption || '',
  }).select();

  // Fallback probing if image_url is missing
  if (res.error && (res.error.message.includes('image_url') || res.error.message.includes('column'))) {
    res = await supabase.from('memories').insert({
      group_id: groupId,
      user_id: userId,
      url: imageUrl,
      caption: caption || '',
    }).select();
  }

  if (res.error) {
    console.error('[addMemory] failed:', res.error);
    return { success: false, error: res.error.message };
  }

  revalidatePath('/dashboard/memories');
  return { success: true, memory: res.data?.[0] };
}

/**
 * Server Action: insert a new comment for a memory with column-probing fallbacks.
 */
export async function addMemoryComment(memoryId: string, content: string, userId: string) {
  if (!memoryId || !content || !userId) {
    return { success: false, error: 'Missing required parameters' };
  }

  const supabase = await createClient();

  // Probing write attempt 1: content
  let res = await supabase.from('memory_comments').insert({
    memory_id: memoryId,
    user_id: userId,
    content: content,
  }).select();

  // Fallback probing if content column is missing
  if (res.error && (res.error.message.includes('content') || res.error.message.includes('column'))) {
    res = await supabase.from('memory_comments').insert({
      memory_id: memoryId,
      user_id: userId,
      text: content,
    }).select();

    if (res.error && (res.error.message.includes('text') || res.error.message.includes('column'))) {
      res = await supabase.from('memory_comments').insert({
        memory_id: memoryId,
        user_id: userId,
        comment: content,
      }).select();
    }
  }

  if (res.error) {
    console.error('[addMemoryComment] failed:', res.error);
    return { success: false, error: res.error.message };
  }

  revalidatePath('/dashboard/memories');
  return { success: true, comment: res.data?.[0] };
}
