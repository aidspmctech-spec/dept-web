import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudentDetailsClient from '../StudentDetailsClient';

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params;
  const supabase = await createClient();

  // 1. Student Basic Info
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (!student) redirect('/staff/students');

  // 2. Academic Records
  const { data: academics } = await supabase
    .from('academic_records')
    .select('*')
    .eq('student_id', id)
    .order('semester', { ascending: true });

  // 3. Fee Structure
  const { data: feeStructure } = await supabase
    .from('fee_structures')
    .select('*')
    .eq('student_id', id)
    .maybeSingle();

  // 4. Payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', id)
    .order('payment_date', { ascending: false });

  // 5. Achievements
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('student_id', id);

  // 6. Certifications
  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('student_id', id);

  // 7. Activities
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('student_id', id);

  // 8. Hostel & Transport
  const { data: hostel } = await supabase
    .from('hostel_details')
    .select('*')
    .eq('student_id', id)
    .maybeSingle();

  const { data: transport } = await supabase
    .from('transport_details')
    .select('*')
    .eq('student_id', id)
    .maybeSingle();

  return (
    <StudentDetailsClient
      student={student}
      academics={academics || []}
      feeStructure={feeStructure}
      payments={payments || []}
      achievements={achievements || []}
      certifications={certifications || []}
      activities={activities || []}
      hostel={hostel}
      transport={transport}
    />
  );
}
