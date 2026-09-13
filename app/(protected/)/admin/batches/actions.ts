'use server';

import { batchRepository } from '@/lib/repositories/batchRepository';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Creates a new academic batch.
 * Requires STAFF role.
 */
export async function createBatch(formData: FormData) {
  const profile = await requireRole(['STAFF']);
  if (!profile) throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  if (!name || name.trim() === '') {
    return { success: false, error: 'Batch name is required' };
  }

  try {
    await batchRepository.create(name.trim());
    revalidatePath('/admin/batches');
    return { success: true };
  } catch (error: any) {
    console.error('[CREATE BATCH] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes an academic batch.
 * Requires STAFF role.
 * Blocks deletion if students are still assigned to the batch.
 */
export async function deleteBatch(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, error: 'Batch ID is required' };
  }

  const profile = await requireRole(['STAFF']);
  if (!profile) throw new Error('Unauthorized');

  try {
    const adminSupabase = createAdminClient();

    // Pre-check: Count students assigned to this batch to prevent accidental mass-orphaning
    const { count, error: countError } = await adminSupabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', id);

    if (countError) throw countError;
    if (count && count > 0) {
      throw new Error(`Cannot delete: ${count} students are still assigned to this batch. Reassign or remove them first.`);
    }

    await batchRepository.delete(id);
    revalidatePath('/admin/batches');
    return { success: true };
  } catch (error: any) {
    console.error('[DELETE BATCH] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Registers a new student and assigns them to a batch.
 * Handles atomic-like creation across Supabase Auth and Database.
 * Requires STAFF role.
 */
export async function registerStudentInBatch(formData: FormData) {
  const profile = await requireRole(['STAFF']);
  if (!profile) return { success: false, error: 'Unauthorized' };

  const fullName = (formData.get('fullName') as string || '').trim();
  const registerNumber = (formData.get('registerNumber') as string || '').trim().toUpperCase();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = (formData.get('password') as string || '').trim();
  const batchId = (formData.get('batchId') as string || '').trim();
  const section = (formData.get('section') as string || '').trim().toUpperCase();

  if (!fullName || !registerNumber || !email || !password || !batchId || !section) {
    return { success: false, error: 'All fields are required' };
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long' };
  }

  if (section !== 'A' && section !== 'B') {
    return { success: false, error: 'Only sections A and B are allowed' };
  }

  const adminSupabase = createAdminClient();

  try {
    // 1. Verify Batch exists
    const { data: batch } = await adminSupabase
      .from('batches')
      .select('id')
      .eq('id', batchId)
      .single();

    if (!batch) {
      return { success: false, error: 'Invalid batch selected' };
    }

    // 2. Check duplicate register number
    const { data: existingStudent } = await adminSupabase
      .from('students')
      .select('id')
      .eq('register_number', registerNumber)
      .maybeSingle();

    if (existingStudent) {
      return { success: false, error: 'Register number already in use' };
    }

    // 3. Check duplicate email in Auth
    const { data: authUsers, error: authListError } = await adminSupabase.auth.admin.listUsers();
    if (authListError) throw authListError;
    if (authUsers.users.some(u => u.email === email)) {
      return { success: false, error: 'Email already in use' };
    }

    // 4. Create Auth User
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;
    const authUserId = authData.user.id;

    let studentId: string | null = null;
    try {
      // 5. Create Student Record
      const { data: studentData, error: studentError } = await adminSupabase
        .from('students')
        .insert({
          register_number: registerNumber,
          name: fullName,
          email,
          batch_id: batchId,
          section,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (studentError) throw studentError;
      studentId = studentData.id;

      // 6. Create Profile Record
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .insert({
          user_id: authUserId,
          role: 'STUDENT',
          student_id: studentId,
        });

      if (profileError) throw profileError;

      revalidatePath(`/admin/batches/${batchId}/users`);
      return { success: true };

    } catch (innerError: any) {
      // Explicit cleanup of database records created before failure
      // Order: Profile -> Student -> Auth User (to respect potential foreign keys)

      try {
        const { error: profileDeleteError } = await adminSupabase
          .from('profiles')
          .delete()
          .eq('user_id', authUserId);
        if (profileDeleteError) {
          console.error('Rollback profiles failed:', profileDeleteError.message);
        }
      } catch (e) {
        console.error('Unexpected error during profile rollback:', e);
      }

      if (studentId) {
        try {
          const { error: studentDeleteError } = await adminSupabase
            .from('students')
            .delete()
            .eq('id', studentId);
          if (studentDeleteError) {
            console.error('Rollback students failed:', studentDeleteError.message);
          }
        } catch (e) {
          console.error('Unexpected error during student rollback:', e);
        }
      }

      try {
        const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(authUserId);
        if (authDeleteError) {
          console.error('Rollback auth user failed:', authDeleteError.message);
        }
      } catch (e) {
        console.error('Unexpected error during auth rollback:', e);
      }

      throw innerError;
    }
  } catch (err: any) {
    console.error('[STAFF STUDENT CREATE] Error:', err.message);
    return { success: false, error: err.message };
  }
}
