'use server';

import { getCurrentProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function syncStudentFees(academicYear: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'STUDENT' || !profile.student_id) {
    throw new Error('Unauthorized');
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase.rpc('sync_student_fee_structure', {
    p_student_id: profile.student_id,
    p_academic_year: academicYear,
  });

  if (error) throw error;

  revalidatePath('/student/fees');
}

export async function updateFeeDetails(formData: FormData) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== 'STUDENT' || !profile.student_id) {
    throw new Error('Unauthorized');
  }

  const studentId = profile.student_id;
  const academicYear = formData.get('academicYear') as string;

  const tuitionTotal = parseFloat(formData.get('tuitionTotal') as string || '0');
  const tuitionPaid = parseFloat(formData.get('tuitionPaid') as string || '0');
  const hostelTotal = parseFloat(formData.get('hostelTotal') as string || '0');
  const hostelPaid = parseFloat(formData.get('hostelPaid') as string || '0');
  const busTotal = parseFloat(formData.get('busTotal') as string || '0');
  const busPaid = parseFloat(formData.get('busPaid') as string || '0');
  const customFeesRaw = formData.get('customFees') as string;
  const customFees: Record<string, number> = customFeesRaw ? JSON.parse(customFeesRaw) : {};

  const adminSupabase = createAdminClient();

  // 1. Persist totals into fee_structures
  const { error: structureError } = await adminSupabase
    .from('fee_structures')
    .upsert({
      student_id: studentId,
      academic_year: academicYear,
      tuition_fee: tuitionTotal,
      hostel_fee: hostelTotal,
      transport_fee: busTotal,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id,academic_year' });

  if (structureError) throw structureError;

  // 2. Persist paid amounts as payments
  const paymentsToUpsert: any[] = [];

  const standardComponents = [
    { name: 'TUITION', amount: tuitionPaid },
    { name: 'HOSTEL', amount: hostelPaid },
    { name: 'TRANSPORT', amount: busPaid },
  ];

  // Handle standard components
  for (const comp of standardComponents) {
    if (comp.amount > 0) {
      // We use a special reconciliation flow: the student reports the "Total Paid so far".
      // To keep PaymentHistory accurate, we clear existing payments for this component/year
      // and insert the new reported total as a single reconciled record.
      await adminSupabase
        .from('payments')
        .delete()
        .eq('student_id', studentId)
        .eq('academic_year', academicYear)
        .eq('fee_component', comp.name);

      const { error: rpcError } = await adminSupabase.rpc('submit_student_payment', {
        p_student_id: studentId,
        p_academic_year: academicYear,
        p_fee_component: comp.name,
        p_amount: comp.amount,
        p_payment_date: new Date().toISOString().split('T')[0],
        p_payment_mode: 'ONLINE',
        p_transaction_reference: 'SELF_REPORTED_RECONCILIATION',
      });

      if (rpcError) throw rpcError;
    }
  }

  // Handle custom components
  for (const [feeTypeId, amount] of Object.entries(customFees)) {
    if (amount > 0) {
      await adminSupabase
        .from('payments')
        .delete()
        .eq('student_id', studentId)
        .eq('academic_year', academicYear)
        .eq('fee_type_id', feeTypeId);

      const { error: customError } = await adminSupabase
        .from('payments')
        .insert({
          student_id: studentId,
          academic_year: academicYear,
          fee_component: 'CUSTOM',
          fee_type_id: feeTypeId,
          amount: amount,
          payment_date: new Date().toISOString(),
          payment_mode: 'ONLINE',
        });
      if (customError) throw customError;
    }
  }


  revalidatePath('/student/fees');
  revalidatePath('/staff/fees');
}
