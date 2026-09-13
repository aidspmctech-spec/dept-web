'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';

export async function createFeeType(formData: FormData) {
  await requireRole(['STAFF']);
  const adminSupabase = createAdminClient();

  const name = formData.get('name') as string;
  const academicYear = formData.get('academicYear') as string;
  const amount = parseFloat(formData.get('amount') as string || '0');
  const targetBatchId = formData.get('targetBatchId') === 'all' ? null : (formData.get('targetBatchId') as string);
  const targetSection = formData.get('targetSection') === 'all' ? null : (formData.get('targetSection') as string);
  const targetGender = formData.get('targetGender') === 'all' ? null : (formData.get('targetGender') as string);

  const { error } = await adminSupabase
    .from('fee_types')
    .insert({
      name,
      academic_year: academicYear,
      amount,
      target_batch_id: targetBatchId,
      target_section: targetSection,
      target_gender: targetGender,
    });

  if (error) throw error;
  revalidatePath('/admin/fee-types');
  revalidatePath('/staff/fees');
  revalidatePath('/student/fees');
}

export async function deleteFeeType(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) throw new Error('Fee type ID is required');

  await requireRole(['STAFF']);
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from('fee_types')
    .delete()
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/admin/fee-types');
  revalidatePath('/staff/fees');
  revalidatePath('/student/fees');
}
