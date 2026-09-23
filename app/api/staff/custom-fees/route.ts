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
    // 2. Validate UUID for batch if it's not 'all'
    if (batch !== 'all') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(batch)) {
        return NextResponse.json({ error: 'Invalid batch ID format' }, { status: 400 });
      }
    }

    // 3. Fetch Custom Fee Definitions with filters and joined batch name
    let feeQuery = supabase
      .from('custom_fee_definitions')
      .select('id, fee_name, amount, batch_id, batches(name), section, gender, due_date');

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
    if (feeError) {
      console.error('Custom fees API error (fetching definitions):', feeError);
      throw feeError;
    }

    // 4. Fetch all assignments for the found fees to calculate stats
    const feeIds = fees?.map(f => f.id) || [];
    let assignmentQuery = supabase
      .from('custom_fee_assignments')
      .select('custom_fee_id, payment_status');

    if (feeIds.length > 0) {
      assignmentQuery = assignmentQuery.in('custom_fee_id', feeIds);
    } else {
      // If no fees found, we can skip the assignments query
      return NextResponse.json({ fees: [] });
    }

    const { data: assignments, error: assignError } = await assignmentQuery;
    if (assignError) {
      console.error('Custom fees API error (fetching assignments):', assignError);
      throw assignError;
    }

    // 5. Process data and calculate stats
    const result = (fees || []).map(fee => {
      const feeAssignments = assignments?.filter(a => a.custom_fee_id === fee.id) || [];
      const assignedCount = feeAssignments.length;
      const paidCount = feeAssignments.filter(a => a.payment_status === 'PAID').length;
      const pendingCount = assignedCount - paidCount;
      const feeStatus = pendingCount === 0 && assignedCount > 0 ? 'PAID' : (assignedCount === 0 ? 'NOT ASSIGNED' : 'PENDING');

      // Filter by status if requested
      if (status !== 'all') {
        if (status === 'Pending' && feeStatus !== 'PENDING') return null;
        if (status === 'Fully Paid' && feeStatus !== 'PAID') return null;
      }

      return {
        id: fee.id,
        fee_name: fee.fee_name,
        batch: (fee.batches as any)?.name || (Array.isArray(fee.batches) ? (fee.batches as any)[0]?.name : 'Unknown Batch'),
        section: fee.section,
        gender: fee.gender,
        amount: fee.amount,
        assigned_count: assignedCount,
        paid_count: paidCount,
        pending_count: pendingCount,
        status: feeStatus,
        due_date: fee.due_date,
      };
    }).filter(Boolean);

    return NextResponse.json({ fees: result });
  } catch (error: any) {
    console.error('Custom fees API error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message
    }, { status: 500 });
  }
}
