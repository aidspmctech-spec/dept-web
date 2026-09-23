import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. Authorization Check
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
  }
  if (profile.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const batch = searchParams.get('batch') || 'all';
  const section = searchParams.get('section') || 'all';
  const gender = searchParams.get('gender') || 'all';
  const component = searchParams.get('component') || 'all';
  const status = searchParams.get('status') || 'all';

  const supabase = await createAdminClient();

  try {
    // 2. Fetch matching custom fee definitions
    let feeQuery = supabase
      .from('custom_fee_definitions')
      .select('id, fee_name, amount');

    if (batch !== 'all') {
      feeQuery = feeQuery.eq('batch_id', batch);
    }
    if (section !== 'all') {
      feeQuery = feeQuery.eq('section', section);
    }
    if (gender !== 'all') {
      feeQuery = feeQuery.eq('gender', gender);
    }
    if (component !== 'all') {
      // Ensure component is a valid UUID before filtering
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(component)) {
        return NextResponse.json({ error: 'Invalid custom fee ID format' }, { status: 400 });
      }
      feeQuery = feeQuery.eq('id', component);
    }

    const { data: fees, error: feeError } = await feeQuery;
    if (feeError) throw feeError;

    if (!fees || fees.length === 0) {
      return NextResponse.json([]);
    }

    const feeIds = fees.map(f => f.id);

    // 3. Fetch all assignments for these fees, joined with student and batch info
    let assignmentQuery = supabase
      .from('custom_fee_assignments')
      .select(`
        payment_status,
        paid_at,
        assigned_amount,
        custom_fee_definitions(fee_name),
        payments(payment_mode),
        students (
          name,
          register_number,
          section,
          gender,
          batches(name)
        )
      `)
      .in('custom_fee_id', feeIds);


    // Apply filters to the assignments (student-level)
    if (batch !== 'all') {
      assignmentQuery = assignmentQuery.eq('students.batch_id', batch);
    }
    if (section !== 'all') {
      assignmentQuery = assignmentQuery.eq('students.section', section);
    }
    if (gender !== 'all') {
      assignmentQuery = assignmentQuery.eq('students.gender', gender);
    }
    if (status !== 'all') {
      const statusMap: Record<string, string> = {
        'paid': 'PAID',
        'pending': 'PENDING'
      };
      const mappedStatus = statusMap[status.toLowerCase()] || status;
      assignmentQuery = assignmentQuery.eq('payment_status', mappedStatus);
    }

    const { data: assignments, error: assignError } = await assignmentQuery;
    if (assignError) throw assignError;

    // 4. Format for Excel
    const exportData = assignments.map(a => {
      const student = a.students as any;
      const def = a.custom_fee_definitions as any;
      const payment = Array.isArray(a.payments) ? a.payments[0] : a.payments;

      const batchName = student?.batches?.name || (Array.isArray(student?.batches) ? student.batches[0]?.name : 'N/A');

      return {
        'Student Name': student?.name || 'N/A',
        'Register Number': student?.register_number || 'N/A',
        'Batch': batchName,
        'Section': student?.section || 'N/A',
        'Gender': student?.gender || 'N/A',
        'Fee Name': def?.fee_name || 'N/A',
        'Amount': a.assigned_amount,
        'Payment Status': a.payment_status === 'PAID' ? 'Paid' : 'Pending',
        'Payment Date': a.paid_at ? new Date(a.paid_at).toLocaleDateString() : '',
        'Payment Mode': payment?.payment_mode || 'N/A',
      };
    });

    return NextResponse.json(exportData);
  } catch (error: any) {
    console.error('Custom fees export API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
