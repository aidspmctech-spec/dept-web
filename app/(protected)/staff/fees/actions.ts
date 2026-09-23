'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { normalizeFeeName } from '@/lib/fee-utils';

export async function getMatchingStudentsCount(formData: FormData) {
  const profile = await requireRole(['STAFF']);

  if (!profile) {
    throw new Error('Unauthorized');
  }

  const batchId = String(formData.get('batchId') ?? '');
  const section = String(formData.get('section') ?? '');
  const gender = String(formData.get('gender') ?? '');

  const adminSupabase = createAdminClient();

  try {
    let query = adminSupabase
      .from('students')
      .select('id', { count: 'exact', head: true });

    if (batchId && batchId !== 'all') {
      query = query.eq('batch_id', batchId);
    }
    if (section && section !== 'all') {
      query = query.eq('section', section);
    }
    if (gender && gender !== 'all') {
      query = query.eq('gender', gender);
    }

    const { count, error } = await query;
    if (error) throw error;

    return { count: count || 0 };
  } catch (error: any) {
    console.error('Error checking matching students:', error);
    throw new Error('Unable to check matching students');
  }
}

export async function createCustomFee(formData: FormData) {
  const profile = await requireRole(['STAFF']);
  if (!profile) throw new Error('Unauthorized');

  const rawName = formData.get('name') as string;
  if (!rawName) throw new Error('Fee name is required');

  // Normalize to Title Case: "book fees" -> "Book Fees"
  const name = rawName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const amount = parseFloat(formData.get('amount') as string);
  const batchId = formData.get('batchId') as string;
  const section = formData.get('section') as string;
  const gender = formData.get('gender') as string;
  const description = formData.get('description') as string;
  const dueDate = formData.get('dueDate') as string;

  if (isNaN(amount) || amount < 0) {
    throw new Error('Invalid amount');
  }

  const adminSupabase = createAdminClient();

  try {
    // Duplicate check: Prevent same normalized name for the same batch (unless All Batches)
    if (batchId !== 'all') {
      const { data: existing } = await adminSupabase
        .from('custom_fee_definitions')
        .select('id')
        .eq('fee_name', name)
        .eq('batch_id', batchId)
        .maybeSingle();

      if (existing) {
        throw new Error(`A fee named "${name}" already exists for this batch.`);
      }
    }

    // 1. Create the Definition
    const { data: definition, error: defError } = await adminSupabase
      .from('custom_fee_definitions')
      .insert({
        fee_name: name,
        amount,
        batch_id: batchId === 'all' ? null : batchId,
        section: section === 'all' ? null : section,
        gender: gender === 'all' ? null : gender,
        description,
        due_date: dueDate || null,
        created_by: profile.user_id,
      })
      .select()
      .single();

    if (defError) throw defError;

    // 2. Find matching students
    let studentQuery = adminSupabase
      .from('students')
      .select('id');

    if (batchId !== 'all') studentQuery = studentQuery.eq('batch_id', batchId);
    if (section !== 'all') studentQuery = studentQuery.eq('section', section);
    if (gender !== 'all') studentQuery = studentQuery.eq('gender', gender);

    const { data: matchingStudents, error: studentsError } = await studentQuery;
    if (studentsError) throw studentsError;

    if (matchingStudents && matchingStudents.length > 0) {
      // 3. Create Assignments
      const assignments = matchingStudents.map(s => ({
        custom_fee_id: definition.id,
        student_id: s.id,
        assigned_amount: amount,
        payment_status: 'PENDING',
      }));

      const { error: assignError } = await adminSupabase
        .from('custom_fee_assignments')
        .insert(assignments);

      if (assignError) throw assignError;
    }

    revalidatePath('/staff/fees');
    return { success: true, assignedCount: matchingStudents?.length || 0 };
  } catch (error: any) {
    console.error('[CREATE CUSTOM FEE] Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteCustomFee(feeId: string) {
  const profile = await requireRole(['STAFF']);
  if (!profile) throw new Error('Unauthorized');

  const adminSupabase = createAdminClient();

  try {
    // 1. Delete all assignments associated with this fee
    const { error: assignError } = await adminSupabase
      .from('custom_fee_assignments')
      .delete()
      .eq('custom_fee_id', feeId);

    if (assignError) throw assignError;

    // 2. Delete the fee definition
    const { error: defError } = await adminSupabase
      .from('custom_fee_definitions')
      .delete()
      .eq('id', feeId);

    if (defError) throw defError;

    revalidatePath('/staff/custom-fees');
    return { success: true };
  } catch (error: any) {
    console.error('[DELETE CUSTOM FEE] Error:', error.message);
    return { success: false, error: error.message };
  }
}
