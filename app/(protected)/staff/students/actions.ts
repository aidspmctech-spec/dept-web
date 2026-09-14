'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function deleteStudent(formData: FormData) {
  const studentId = formData.get('id') as string;
  if (!studentId) throw new Error('Student ID is required');

  // Re‑verify staff role on each request
  const profile = await requireRole(['STAFF']);
  if (!profile) throw new Error('Unauthorized');

  const adminSupabase = createAdminClient();

  try {
    // 1. Find associated Auth User ID from profiles
    const { data: studentProfile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('user_id')
      .eq('student_id', studentId)
      .single();

    if (profileError || !studentProfile) {
      throw new Error('Could not find associated user account for this student.');
    }

    const authUserId = studentProfile.user_id;

    // 2. Delete Auth User
    // This is critical to avoid orphaned auth records
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(authUserId);
    if (authError) {
      console.error('[DELETE STUDENT] Auth delete error:', authError.message);
      // We continue even if auth delete fails, as the database cascade
      // will handle the student record and profile.
    }

    // 3. Delete Student record
    // This triggers cascading deletion of:
    // - Profile (if not already deleted by auth cascade)
    // - Fee Structures
    // - Payments
    // - Academic Records
    // - Achievements
    // - Certifications
    // - Activities
    // - Hostel/Transport details
    const { error: studentError } = await adminSupabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (studentError) throw studentError;

    revalidatePath('/staff/students');
    return { success: true };
  } catch (error: any) {
    console.error('[DELETE STUDENT] Error:', error.message);
    return { success: false, error: error.message };
  }
}
