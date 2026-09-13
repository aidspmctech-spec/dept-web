import { requireRole } from '@/lib/auth';
import { batchRepository } from '@/lib/repositories/batchRepository';
import { createBatch, deleteBatch } from './actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function BatchesPage() {
  const profile = await requireRole(['STAFF']);
  if (!profile) return redirect('/dashboard');

  const batches = await batchRepository.getAll();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">Batch Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Batch Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Create New Batch</h2>
          <form action={async (formData) => {
            'use server';
            const result = await createBatch(formData);
            if (!result.success) {
              // In a real app, we'd use a toast or state for this
              console.error(result.error);
            }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Batch Name *</label>
              <input
                name="name"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 2021-2025"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center">
              Create Batch
            </button>
          </form>
        </div>

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
                      <form action={async () => {
                        'use server';
                        await deleteBatch(batch.id);
                      }}>
                        <button type="submit" className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </form>
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
