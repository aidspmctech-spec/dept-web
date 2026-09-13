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
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', profile.student_id)
    .eq('academic_year', currentYear)
    .order('payment_date', { ascending: false });

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

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d] mb-2">Fees & Payments</h1>
          <p className="text-gray-600">Enter your fee totals and submit payment installments. All payments are subject to verification.</p>
        </div >
      </div >

      <FeesClientWrapper
        initialFeeStructure={feeStructures}
        initialPayments={payments || []}
        initialHostelType={hostel?.accommodation_type}
        initialTransportType={transport?.transport_type}
      />
    </div >
  );
}
