import { createClient as createSsrClient } from '@/lib/supabase/server';
import { cache } from 'react';
import { redirect } from 'next/navigation';

/**
 * Creates a Supabase server client for SSR.
 */
export async function createClient() {
  return await createSsrClient();
}

/**
 * AUTHENTICATION: Checks if a Supabase Auth user is currently logged in.
 * This function MUST NOT query the profiles table.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
});

/**
 * AUTHORIZATION: Fetches the application profile for the authenticated user.
 * This function checks authentication FIRST to avoid unnecessary database queries.
 */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    // [AUTH] Return null immediately for anonymous users to prevent database queries
    return null;
  }

  try {
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[AUTH] Database error fetching profile:', profileError);
      return null;
    }

    return profile;
  } catch (e) {
    console.error('[AUTH] Unexpected error fetching profile:', e);
    return null;
  }
});

/**
 * AUTHORIZATION: Convenience helper to get the user's role.
 */
export const getUserRole = cache(async () => {
  const profile = await getCurrentProfile();
  return profile?.role || null;
});

/**
 * AUTHORIZATION: Ensures the user is authenticated AND has one of the allowed roles.
 *
 * @param allowedRoles List of roles that can access the resource (e.g., ['STAFF', 'STUDENT']).
 * @returns The profile if authorized, or redirects/returns null.
 */
export async function requireRole(allowedRoles: string[]) {
  // 1. Check Authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Check Profile Existence
  const profile = await getCurrentProfile();
  if (!profile) {
    // User is authenticated but has no profile.
    // We return null to let the page render a controlled "Profile Not Found" state.
    return null;
  }

  // 3. Check Authorization (Role)
  const userRole = profile.role?.toUpperCase();
  if (!allowedRoles.map(r => r.toUpperCase()).includes(userRole)) {
    // User is authenticated but lacks the required role.
    redirect('/dashboard');
  }

  return profile;
}
