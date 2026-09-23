import { createClient } from '@/lib/supabase/server';
import { batchRepository } from '@/lib/repositories/batchRepository';
import Link from 'next/link';
import DataFilterBar from '../components/DataFilterBar';
import FeeFilterBar from '../components/FeeFilterBar';
import ExportExcelButton from '../components/ExportExcelButton';
import CreateFeeModal from './CreateFeeModal';

export default async function FeesManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; section?: string; component?: string; status?: string }>;
}) {
  const { batch, section, component = 'TUITION', status } = await searchParams;
  const supabase = await createClient();

  const batches = await batchRepository.getAll();

  // Fetch custom fees that have assignments matching current filters
  let availableCustomFees: { id: string; name: string }[] = [];

  let assignmentQuery = supabase
    .from('custom_fee_assignments')
    .select('custom_fee_id, custom_fee_definitions(fee_name), students(batch_id, section)');

  if (batch && batch !== 'all') {
    assignmentQuery = assignmentQuery.eq('students.batch_id', batch);
  }
  if (section && section !== 'all') {
    assignmentQuery = assignmentQuery.eq('students.section', section);
  }

  const { data: assignmentsData, error: assignmentsError } = await assignmentQuery;

  if (!assignmentsError && assignmentsData) {
    const uniqueFees = new Map();
    assignmentsData.forEach(item => {
      const def = item.custom_fee_definitions as any;
      if (def && def.fee_name) {
        uniqueFees.set(item.custom_fee_id, def.fee_name);
      }
    });
    availableCustomFees = Array.from(uniqueFees.entries()).map(([id, name]) => ({ id, name }));
  }

  // 1. Fetch filtered students with their fee structures and payments

  // 1. Fetch filtered students with their fee structures and payments
  let query = supabase
    .from('students')
    .select('*, batches(name), fee_structures(*), payments(*)')
    .order('name');

  if (batch) {
    query = query.eq('batch_id', batch);
  }
  if (section) {
    query = query.eq('section', section);
  }

  const { data: students, error } = await query;

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error loading fee data: {error.message}
      </div>
    );
  }

  // For custom fees, fetch assignments for the selected custom fee ID
  let customAssignments: any[] = [];
  if (component !== 'TUITION' && component !== 'TRANSPORT' && component !== 'HOSTEL') {
    const { data: assignments } = await supabase
      .from('custom_fee_assignments')
      .select('*')
      .eq('custom_fee_id', component);
    customAssignments = assignments || [];
  }

  // 2. Compute Paid/Pending status in the Server Component
  const processedData = students.map(student => {
    const structure = student.fee_structures?.find((s: any) => s.academic_year === '2024-2025') || {}; // Default year for now
    const studentPayments = student.payments || [];

    let total = 0;
    let paid = 0;

    if (component === 'TUITION') {
      total = structure.tuition_fee || 0;
      paid = studentPayments
        .filter((p: any) => p.fee_component === 'TUITION')
        .reduce((sum: number, p: any) => sum + p.amount, 0);
    } else if (component === 'TRANSPORT') {
      total = structure.transport_fee || 0;
      paid = studentPayments
        .filter((p: any) => p.fee_component === 'TRANSPORT')
        .reduce((sum: number, p: any) => sum + p.amount, 0);
    } else if (component === 'HOSTEL') {
      total = structure.hostel_fee || 0;
      paid = studentPayments
        .filter((p: any) => p.fee_component === 'HOSTEL')
        .reduce((sum: number, p: any) => sum + p.amount, 0);
    } else {
      // It's a custom fee ID - use custom_fee_assignments table
      const assignment = customAssignments.find(a => a.student_id === student.id);
      total = assignment?.assigned_amount || 0;
      paid = assignment?.paid_amount || 0;
    }

    const pending = total - paid;

    return {
      student,
      total,
      paid,
      pending,
      status: pending > 0 ? 'PENDING' : (total > 0 ? 'PAID' : 'N/A'),
    };
  });

  // 3. Filter by total > 0 AND status
  const filteredData = processedData.filter(d => {
    // Requirement: exclude records with a zero total for the selected component
    if (d.total <= 0) return false;

    // Further filter by status if provided
    if (status) {
      return d.status === status.toUpperCase();
    }
    return true;
  });

  const componentName = (component === 'TUITION' ? 'Tuition' :
                        component === 'TRANSPORT' ? 'Bus Fee' :
                        component === 'HOSTEL' ? 'Hostel' :
                        availableCustomFees.find(ft => ft.id === component)?.name || 'Custom') + ' Fee';

  const exportData = filteredData.map(d => {
    if (component === 'TUITION' || component === 'TRANSPORT' || component === 'HOSTEL') {
      return {
        'Register No': d.student.register_number,
        'Name': d.student.name,
        'Batch': d.student.batches?.name || 'N/A',
        'Section': d.student.section,
        'Component': componentName,
        'Total': d.total,
        'Paid': d.paid,
        'Pending': d.pending,
      };
    } else {
      return {
        'Register No': d.student.register_number,
        'Student Name': d.student.name,
        'Batch': d.student.batches?.name || 'N/A',
        'Section': d.student.section,
        'Gender': d.student.gender,
        'Fee Name': componentName,
        'Total Fee': d.total,
        'Paid': d.paid,
        'Pending': d.pending,
        'Payment Status': d.status,
      };
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d]">Fee Management</h1>
          <p className="text-gray-600">Monitor fee collection and identify pending dues.</p>
        </div>
      </div>

      <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-4">
          <DataFilterBar
            batches={batches}
            sections={['A', 'B']}
            currentBatch={batch}
            currentSection={section}
          />
          <Link
            href="/staff/custom-fees"
            className="px-4 py-2 bg-[#1a365d] text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
          >
            Custom Fees
          </Link>
        </div>
        <ExportExcelButton
          data={exportData}
          filename={`fees-${component.toLowerCase()}-${status?.toLowerCase() || 'all'}`}
        />
      </div>

        <FeeFilterBar
          currentComponent={component}
          currentStatus={status || ''}
          customFees={availableCustomFees}
          mode="regular"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 font-semibold">Register No</th>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Batch</th>
              <th className="px-6 py-4 font-semibold">Section</th>
              {component !== 'TUITION' && component !== 'TRANSPORT' && component !== 'HOSTEL' && (
                <th className="px-6 py-4 font-semibold">Gender</th>
              )}
              {component !== 'TUITION' && component !== 'TRANSPORT' && component !== 'HOSTEL' && (
                <th className="px-6 py-4 font-semibold">Fee Name</th>
              )}
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Paid</th>
              <th className="px-6 py-4 font-semibold">Pending</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length > 0 ? (
              filteredData.map((d) => (
                <tr key={d.student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono">{d.student.register_number}</td>
                  <td className="px-6 py-4 font-medium">{d.student.name}</td>
                  <td className="px-6 py-4">{d.student.batches?.name || 'N/A'}</td>
                  <td className="px-6 py-4">{d.student.section}</td>
                  {component !== 'TUITION' && component !== 'TRANSPORT' && component !== 'HOSTEL' && (
                    <td className="px-6 py-4">{d.student.gender}</td>
                  )}
                  {component !== 'TUITION' && component !== 'TRANSPORT' && component !== 'HOSTEL' && (
                    <td className="px-6 py-4">
                      {availableCustomFees.find(ft => ft.id === component)?.name || 'Custom Fee'}
                    </td>
                  )}
                  <td className="px-6 py-4">₹{d.total}</td>
                  <td className="px-6 py-4">₹{d.paid}</td>
                  <td className={`px-6 py-4 font-bold ${d.pending > 0 ? 'text-red-600 bg-red-50' : 'text-green-600'}`}>
                    ₹{d.pending}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      d.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-400 italic">No matching records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
