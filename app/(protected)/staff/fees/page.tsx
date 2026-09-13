import { createClient } from '@/lib/supabase/server';
import { batchRepository } from '@/lib/repositories/batchRepository';
import DataFilterBar from '../components/DataFilterBar';
import FeeFilterBar from '../components/FeeFilterBar';
import ExportExcelButton from '../components/ExportExcelButton';

export default async function FeesManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; section?: string; component?: string; status?: string }>;
}) {
  const { batch, section, component = 'TUITION', status } = await searchParams;
  const supabase = await createClient();

  const batches = await batchRepository.getAll();

  // Fetch custom fee types for the filter bar and calculations
  const { data: feeTypes } = await supabase
    .from('fee_types')
    .select('id, name, amount');

  // 1. Fetch filtered students with their fee structures and payments
  let query = supabase
    .from('students')
    .select('*, fee_structures(*), payments(*)')
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

  // 2. Compute Paid/Pending status in the Server Component
  const processedData = students.map(student => {
    const structure = student.fee_structures?.find((s: any) => s.academic_year === '2024-2025') || {}; // Default year for now
    const studentPayments = student.payments || [];

    let total = 0;
    if (component === 'TUITION') total = structure.tuition_fee || 0;
    else if (component === 'TRANSPORT') total = structure.transport_fee || 0;
    else if (component === 'HOSTEL') total = structure.hostel_fee || 0;
    else {
      // It's a custom fee ID
      const customFee = feeTypes?.find(ft => ft.id === component);
      total = customFee?.amount || 0;
    }

    const paid = studentPayments
      .filter((p: any) => p.fee_component === component)
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    // For custom fees, we must filter by fee_type_id
    const actualPaid = (component !== 'TUITION' && component !== 'TRANSPORT' && component !== 'HOSTEL')
      ? studentPayments
          .filter((p: any) => p.fee_type_id === component)
          .reduce((sum: number, p: any) => sum + p.amount, 0)
      : paid;

    const pending = total - actualPaid;

    return {
      student,
      total,
      paid: actualPaid,
      pending,
      status: pending > 0 ? 'PENDING' : (total > 0 ? 'PAID' : 'N/A'),
    };
  });

  // 3. Filter by status
  const filteredData = status
    ? processedData.filter(d => d.status === status.toUpperCase())
    : processedData;

  const componentName = (component === 'TUITION' ? 'Tuition' :
                        component === 'TRANSPORT' ? 'Transport' :
                        component === 'HOSTEL' ? 'Hostel' :
                        feeTypes?.find(ft => ft.id === component)?.name || 'Custom') + ' Fee';

  const exportData = filteredData.map(d => ({
    'Register No': d.student.register_number,
    'Name': d.student.name,
    'Batch': d.student.batches?.name || 'N/A',
    'Section': d.student.section,
    'Component': componentName,
    'Total': d.total,
    'Paid': d.paid,
    'Pending': d.pending,
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d]">Fee Management</h1>
          <p className="text-gray-600">Monitor fee collection and identify pending dues.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <DataFilterBar
            batches={batches}
            sections={['A', 'B']}
            currentBatch={batch}
            currentSection={section}
          />
          <ExportExcelButton
            data={exportData}
            filename={`fees-${component.toLowerCase()}-${status?.toLowerCase() || 'all'}`}
          />
        </div>

        <FeeFilterBar
          currentComponent={component}
          currentStatus={status || ''}
          customFees={feeTypes || []}
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
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Paid</th>
              <th className="px-6 py-4 font-semibold">Pending</th>
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
                  <td className="px-6 py-4">₹{d.total}</td>
                  <td className="px-6 py-4">₹{d.paid}</td>
                  <td className={`px-6 py-4 font-bold ${d.pending > 0 ? 'text-red-600 bg-red-50' : 'text-green-600'}`}>
                    ₹{d.pending}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">No matching records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
