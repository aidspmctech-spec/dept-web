import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FeesClientWrapper from './FeesClientWrapper';

export default async function FeesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createClient();
  const currentYear = '2024-2025';

  // 1. Fetch the student's reported fee totals
  const { data: feeStructures } = await supabase
    .from('fee_structures')
    .select('*')
    .eq('student_id', profile.student_id)
    .eq('academic_year', currentYear)
    .maybeSingle();

  // 2. Fetch all payments for this student for the year
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*, custom_fee_assignments(custom_fee_definitions(fee_name))')
    .eq('student_id', profile.student_id)
    .eq('academic_year', currentYear)
    .order('payment_date', { ascending: false });

  if (paymentsError) {
    console.error('[DEBUG] Error fetching payments:', paymentsError);
  }

  // 3. Fetch student type/transport for applicability logic
  const { data: hostel } = await supabase
    .from('hostel_details')
    .select('accommodation_type')
    .eq('student_id', profile.student_id)
    .maybeSingle();

  const { data: transport } = await supabase
    .from('transport_details')
    .select('transport_type')
    .eq('student_id', profile.student_id)
    .maybeSingle();

  // 4. Fetch Custom Fee Assignments
  const { data: studentData } = await supabase
    .from('students')
    .select('batch_id, section, gender')
    .eq('id', profile.student_id)
    .maybeSingle();

  const { data: customFees, error: customFeesError } = await supabase
    .from('custom_fee_assignments')
    .select('*, custom_fee_definitions(fee_name, amount, description)')
    .eq('student_id', profile.student_id);

  // TEMPORARY SERVER LOGS
  console.log('[CUSTOM FEE DIAGNOSTICS] Student View:', {
    studentId: profile.student_id,
    batchId: studentData?.batch_id,
    section: studentData?.section,
    assignmentCount: customFees?.length || 0,
    feeNames: customFees?.map(cf => cf.custom_fee_definitions?.fee_name),
  });

  if (customFeesError) {
    console.error('[DEBUG] Error fetching custom fees:', customFeesError);
  }

  console.log('[DEBUG] Custom fees fetched:', {
    count: customFees?.length,
    fees: customFees,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d] mb-2">Fees & Payments</h1>
          <p className="text-gray-600">Enter your fee totals and submit payment installments here.</p>
        </div >
      </div >

      <FeesClientWrapper
        initialFeeStructure={feeStructures}
        initialPayments={payments || []}
        initialHostelType={hostel?.accommodation_type}
        initialTransportType={transport?.transport_type}
        initialCustomFees={customFees || []}
      />
    </div >
  );
}
