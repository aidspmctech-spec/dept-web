import { createClient } from '@/lib/supabase/server';
import { batchRepository } from '@/lib/repositories/batchRepository';
import { createFeeType, deleteFeeType } from './actions';
import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function FeeTypesPage() {
  const profile = await requireRole(['STAFF']);
  if (!profile) redirect('/dashboard');

  const supabase = await createClient();
  const batches = await batchRepository.getAll();

  const { data: feeTypes } = await supabase
    .from('fee_types')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">Custom Fee Definitions</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="font-bold text-[#1a365d] mb-6">Define New Fee</h3>
          <form action={createFeeType} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fee Name *</label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. Dress Fee"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Academic Year *</label>
              <select name="academicYear" required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="2023-2024">2023-2024</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Amount (₹) *</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Target Batch</label>
              <select name="targetBatchId" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Batches</option>
                {batches?.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Target Section</label>
              <select name="targetSection" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Target Gender</label>
              <select name="targetGender" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <button type="submit" className="w-full py-3 bg-[#1a365d] text-white rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-sm mt-4">
              Create Fee Type
            </button>
          </form>
        </div>

        {/* List of Fees */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 font-semibold">Fee Name</th>
                <th className="px-6 py-4 font-semibold">Year</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Targeting</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {feeTypes && feeTypes.length > 0 ? (
                feeTypes.map((ft) => (
                  <tr key={ft.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{ft.name}</td>
                    <td className="px-6 py-4 text-gray-600">{ft.academic_year}</td>
                    <td className="px-6 py-4 font-bold">₹{ft.amount}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {ft.target_batch_id ? `Batch: ${ft.target_batch_id}` : 'All Batches'}, {ft.target_section || 'All Sections'}, {ft.target_gender || 'All Genders'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={deleteFeeType}>
                        <input type="hidden" name="id" value={ft.id} />
                        <button type="submit" className="text-red-600 hover:underline">Delete</button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No custom fees defined yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
