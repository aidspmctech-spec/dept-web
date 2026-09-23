'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Deletes a student and all associated records.
 * This is a privileged operation that must only be performed by STAFF.
 */
export async function deleteStudent(formData: FormData) {
  const studentId = formData.get('id') as string;
  if (!studentId) {
    return { success: false, error: 'Student ID is required.' };
  }

  // 1. Verify the requester is authenticated and has the STAFF role
  const profile = await requireRole(['STAFF']);
  if (!profile) {
    return { success: false, error: 'Unauthorized: You must be a staff member to delete students.' };
  }

  const adminSupabase = createAdminClient();

  try {
    // 2. Perform the deletion using the admin client to bypass RLS
    // The database schema has ON DELETE CASCADE on most relations to students
    const { error: deleteError } = await adminSupabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (deleteError) {
      console.error('[DELETE_ERROR] Failed to delete student:', deleteError);
      return { success: false, error: 'Unable to delete the student. Please try again.' };
    }

    // 3. Log the action in the audit logs
    try {
      await adminSupabase.from('audit_logs').insert({
        user_id: profile.user_id,
        action: 'STAFF_DELETED_STUDENT',
        details: `Deleted student ID: ${studentId}`,
        timestamp: new Date().toISOString(),
      });
    } catch (logError) {
      console.warn('[AUDIT_LOG_WARN] Failed to record deletion:', logError);
    }

    revalidatePath('/staff/students');
    return { success: true };
  } catch (error: any) {
    console.error('[SERVER_ACTION_ERROR] deleteStudent:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}

/**
 * Changes the password for a student.
 * This is a privileged operation that must only be performed by STAFF.
 */
export async function changeStudentPassword(studentId: string, newPassword: string) {
  // 1. Verify the requester is authenticated and has the STAFF role
  const profile = await requireRole(['STAFF']);
  if (!profile) {
    throw new Error('Unauthorized: You must be a staff member to change passwords.');
  }

  const adminSupabase = createAdminClient();

  try {
    // 2. Find the student's Auth User ID using the profiles mapping
    const { data: studentProfile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('user_id')
      .eq('student_id', studentId)
      .single();

    if (profileError || !studentProfile) {
      throw new Error('This student does not have a login account.');
    }

    const authUserId = studentProfile.user_id;

    // 3. Update the password using Supabase Admin Auth API
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      authUserId,
      { password: newPassword }
    );

    if (authError) {
      console.error('[AUTH_ERROR] Password change failed:', authError);
      throw new Error('Unable to change the password. Please try again.');
    }

    // 4. Log the action in the audit logs if the table exists
    try {
      await adminSupabase.from('audit_logs').insert({
        user_id: profile.user_id,
        action: 'STAFF_CHANGED_STUDENT_PASSWORD',
        details: `Changed password for student ID: ${studentId}`,
        timestamp: new Date().toISOString(),
      });
    } catch (logError) {
      console.warn('[AUDIT_LOG_WARN] Failed to record password change:', logError);
    }

    revalidatePath(`/staff/students/${studentId}`);

    return { success: true, message: 'Student password changed successfully.' };
  } catch (error: any) {
    console.error('[SERVER_ACTION_ERROR] changeStudentPassword:', error);
    throw new Error(error.message || 'An unexpected error occurred.');
  }
}
