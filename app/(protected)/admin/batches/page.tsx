import { requireRole } from '@/lib/auth';
import { batchRepository } from '@/lib/repositories/batchRepository';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DeleteBatchButton from './DeleteBatchButton';
import CreateBatchForm from './CreateBatchForm';

export default async function BatchesPage() {
  const profile = await requireRole(['STAFF']);
  if (!profile) return redirect('/dashboard');

  const rawBatches = await batchRepository.getAll();
  const batches = rawBatches?.filter(b => b && b.id && b.name) || [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">Batch Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Create Batch Form */}
        <CreateBatchForm />

        {/* Batches List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-sm font-semibold text-gray-600">
                <th className="p-4">Batch Name</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {batches?.length === 0 ? (
                <tr><td colSpan={2} className="p-8 text-center text-gray-500">No batches found.</td></tr>
              ) : (
                batches?.map((batch: any) => (
                  <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium">{batch.name}</td>
                    <td className="p-4 flex gap-3">
                      <Link
                        href={`/admin/batches/${batch.id}/users`}
                        className="text-blue-600 hover:underline"
                      >
                        Manage Students
                      </Link>
                      <DeleteBatchButton batchId={batch.id} batchName={batch.name} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
