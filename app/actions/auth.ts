'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient as createBaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import {
  encodeSession,
  SESSION_COOKIE,
  COOKIE_OPTIONS,
} from '@/lib/session';

// Helper to get an admin/service-role client if possible, fallback to anon client
async function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (serviceKey) {
    return createBaseClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
  // Fallback to standard client
  return createClient();
}

/**
 * Server Actions for Kiosk Auth flow.
 * Spec: architecture.md §7
 */

/* ── Types ────────────────────────────────────────────────────────────────── */

export type Group = {
  id:          string;
  name:        string;
};

export type GroupProfile = {
  id:        string;
  full_name: string;
  avatar_url: string | null;
};

export type GetGroupsResult = { groups: Group[]; error?: string };

export type VerifyPinResult =
  | { success: true;  profiles: GroupProfile[] }
  | { success: false; error: string };

/* ── getGroupsAction ──────────────────────────────────────────────────────── */

/**
 * Fetch all groups for the landing page dropdown.
 * Uses the service-role-less anon client — groups table is readable by all
 * (the landing page is public, there is no Supabase Auth session yet).
 */
export async function getGroupsAction(): Promise<GetGroupsResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('groups')
      .select('id, name')
      .not('invite_code', 'is', null)
      .order('name', { ascending: true });

    if (error) {
      console.error('[getGroupsAction]', error.message);
      return { groups: [], error: error.message };
    }

    return { groups: (data ?? []) as Group[] };
  } catch (err: any) {
    console.error('[getGroupsAction] catch block error:', err);
    return { groups: [], error: err?.message || 'Failed to connect to database' };
  }
}

/* ── loginWithPersonalPinAction ───────────────────────────────────────────── */

export type LoginResult =
  | { success: true; userName: string; userId: string; groupId: string; groupName: string }
  | { success: false; error: string };

/**
 * Verify a 4-digit personal PIN for a member of a specific group.
 * Sets the HTTP-only app_session cookie if the credentials match.
 */
export async function loginWithPersonalPinAction(
  groupId: string,
  pin: string,
): Promise<LoginResult> {
  if (!groupId || !pin) {
    return { success: false, error: 'Group and PIN are required.' };
  }

  // Sanitize: strip whitespace, keep only digits
  const sanitizedPin = pin.replace(/\s/g, '').trim();

  try {
    console.log("LOGIN ATTEMPT:", { groupId, pin });
    const supabase = await getAdminClient();

    // Query profiles in this group with the exact personal PIN
    const { data: member, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        groups!inner ( name ),
        profiles!inner ( id, full_name, nickname, pin )
      `)
      .eq('group_id', groupId)
      .eq('profiles.pin', sanitizedPin)
      .single();

    if (error || !member) {
      console.error('[loginWithPersonalPinAction] Query failed or no match:', error);
      return { success: false, error: 'Invalid PIN. Please try again.' };
    }

    const typedMember = member as unknown as {
      group_id: string;
      groups: { name: string };
      profiles: { id: string; full_name: string; nickname: string | null; pin: string };
    };

    const displayName = typedMember.profiles.nickname || typedMember.profiles.full_name;

    const token = await encodeSession({
      userId: typedMember.profiles.id,
      groupId: typedMember.group_id,
      groupName: typedMember.groups.name,
      userName: displayName,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, COOKIE_OPTIONS);

    return {
      success: true,
      userName: displayName,
      userId: typedMember.profiles.id,
      groupId: typedMember.group_id,
      groupName: typedMember.groups.name,
    };
  } catch (err: any) {
    console.error("LOGIN CRASH:", err);
    return { success: false, error: err?.message || JSON.stringify(err) || 'Login failed' };
  }
}

/* ── signUpAction ─────────────────────────────────────────────────────────── */

export type SignUpResult =
  | { success: true; userName: string; userId: string; groupId: string; groupName: string }
  | { success: false; error: string };

/**
 * Signs up a new user using a group invite code, full name, nickname, email, and PIN.
 * Automatically links the user to the group and logs them in.
 */
export async function signUpAction(
  inviteCode: string,
  fullName: string,
  nickname: string,
  email: string,
  pin: string,
): Promise<SignUpResult> {
  if (!inviteCode || !fullName || !pin) {
    return { success: false, error: 'Invite code, Full Name, and PIN are required.' };
  }

  const sanitizedPin = pin.replace(/\s/g, '').trim();
  if (sanitizedPin.length !== 4) {
    return { success: false, error: 'PIN must be exactly 4 digits.' };
  }

  const sanitizedInvite = inviteCode.trim();

  try {
    const supabase = await getAdminClient();

    // 1. Look up the group by invite_code
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name')
      .eq('invite_code', sanitizedInvite)
      .single();

    if (groupError || !group) {
      console.error('[signUpAction] Group invite code lookup failed:', groupError);
      return { success: false, error: 'Invalid Group Code' };
    }

    // 2. Prevent duplicate accounts in the specific group
    // Query group roster (group_members joined with profiles)
    const { data: existingMembers, error: checkError } = await supabase
      .from('group_members')
      .select('user_id, profiles!inner(full_name, email)')
      .eq('group_id', group.id);

    if (checkError) {
      console.error('[signUpAction] Duplicate check query failed:', checkError);
      return { success: false, error: 'Failed to verify unique account.' };
    }

    if (existingMembers && existingMembers.length > 0) {
      const hasDuplicate = existingMembers.some((m: any) => {
        const rawProfiles = m.profiles;
        if (!rawProfiles) return false;

        const profilesList = Array.isArray(rawProfiles) ? rawProfiles : [rawProfiles];

        return profilesList.some((p: any) => {
          if (!p) return false;

          // Strictly compare trimmed lowercase names
          const dbName = p.full_name?.toLowerCase().trim();
          const inputName = fullName.toLowerCase().trim();
          const nameMatch = dbName && inputName && dbName === inputName;

          // Strictly compare trimmed lowercase emails only if both are set and non-empty
          const dbEmail = p.email?.toLowerCase().trim();
          const inputEmail = email?.toLowerCase().trim();
          const emailMatch = dbEmail && inputEmail && dbEmail === inputEmail;

          return nameMatch || emailMatch;
        });
      });

      if (hasDuplicate) {
        return { success: false, error: 'An account with this name/email already exists in this group.' };
      }
    }

    // 3. Generate a new profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        full_name: fullName.trim(),
        nickname: nickname.trim() || null,
        email: email.trim() || null,
        pin: sanitizedPin,
      })
      .select('id, full_name, nickname')
      .single();

    if (profileError || !newProfile) {
      if (profileError) {
        console.error("SIGNUP CRASH:", profileError.message, profileError.details, profileError.code);
      }
      return { success: false, error: 'Failed to create user profile. The PIN/email may already be registered.' };
    }

    // 4. Link them in the group_members table
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        user_id: newProfile.id,
        group_id: group.id,
      });

    if (memberError) {
      console.error("SIGNUP CRASH:", memberError.message, memberError.details, memberError.code);
      // Clean up the created profile to prevent orphaned profiles
      await supabase.from('profiles').delete().eq('id', newProfile.id);
      return { success: false, error: 'Failed to link user to the group.' };
    }

    // 5. Encode session and set the HTTP-only cookie
    const displayName = newProfile.nickname || newProfile.full_name;
    const token = await encodeSession({
      userId: newProfile.id,
      groupId: group.id,
      groupName: group.name,
      userName: displayName,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, COOKIE_OPTIONS);

    return {
      success: true,
      userName: displayName,
      userId: newProfile.id,
      groupId: group.id,
      groupName: group.name,
    };
  } catch (err: any) {
    console.error("FINAL SIGNUP CRASH:", err);
    return { success: false, error: err?.message || JSON.stringify(err) || 'An unexpected error occurred during signup.' };
  }
}


/* ── selectProfileAction ─────────────────────────────────────────────────── */

/**
 * Called when a user taps their profile card.
 * Sets the HTTP-only `app_session` cookie and redirects to /dashboard.
 */
export async function selectProfileAction(
  userId:    string,
  groupId:   string,
  groupName: string,
  userName:  string,
): Promise<void> {
  const token = await encodeSession({ userId, groupId, groupName, userName });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, COOKIE_OPTIONS);

  redirect('/dashboard');
}

/* ── logoutAction ────────────────────────────────────────────────────────── */

/**
 * Deletes the `app_session` cookie and redirects to /.
 * Mounted in the Sidebar as "Switch Group".
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0, // expire immediately
  });

  redirect('/');
}
