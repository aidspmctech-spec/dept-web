'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';

export async function updateFeeStructure(formData: FormData) {
  await requireRole(['STAFF']);
  const adminSupabase = createAdminClient();
  const studentId = formData.get('studentId') as string;
  const academicYear = formData.get('academicYear') as string;

  const updates = {
    tuition_fee: parseFloat(formData.get('tuitionFee') as string || '0'),
    transport_fee: parseFloat(formData.get('transportFee') as string || '0'),
    hostel_fee: parseFloat(formData.get('hostelFee') as string || '0'),
    updated_at: new Date().toISOString(),
  };

  const { error } = await adminSupabase
    .from('fee_structures')
    .upsert({
      student_id: studentId,
      academic_year: academicYear,
      ...updates,
    }, { onConflict: 'student_id,academic_year' });

  if (error) throw error;
  revalidatePath('/staff/fees');
}
