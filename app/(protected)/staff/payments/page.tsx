import { createClient } from '@/lib/supabase/server';
import { batchRepository } from '@/lib/repositories/batchRepository';
import DataFilterBar from '../components/DataFilterBar';
import ExportExcelButton from '../components/ExportExcelButton';

export default async function StaffPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; section?: string }>;
}) {
  const { batch, section } = await searchParams;
  const supabase = await createClient();

  const batches = await batchRepository.getAll();

  let query = supabase
    .from('payments')
    .select('*, students!inner(name, register_number, batch_id, section, batches(name))')
    .order('created_at', { ascending: false });

  if (batch) {
    query = query.eq('students.batch_id', batch);
  }
  if (section) {
    query = query.eq('students.section', section);
  }

  const { data: payments, error } = await query;

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error loading payments: {error.message}
      </div>
    );
  }

  const exportData = payments.map(p => ({
    'Student Name': p.students?.name,
    'Register No': p.students?.register_number,
    'Date': p.payment_date,
    'Component': p.fee_component,
    'Amount': p.amount,
    'Reference': p.transaction_reference,
    'Batch': p.students?.batches?.name || 'N/A',
    'Section': p.students?.section,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">Payment Records</h1>
      </div>

      <div className="flex justify-between items-center gap-4">
        <DataFilterBar
          batches={batches}
          sections={['A', 'B']}
          currentBatch={batch}
          currentSection={section}
        />
        <ExportExcelButton
          data={exportData}
          filename="payment-records"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Component</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments && payments.length > 0 ? (
              payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{p.students?.name}</div>
                    <div className="text-xs text-gray-500">{p.students?.register_number}</div>
                  </td>
                  <td className="px-6 py-4">{p.payment_date}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {p.fee_component}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">₹{p.amount}</td>
                  <td className="px-6 py-4 font-mono text-xs">{p.transaction_reference}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No payment records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
