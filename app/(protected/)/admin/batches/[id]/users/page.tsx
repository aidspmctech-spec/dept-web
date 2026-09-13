import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function BatchUsersPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: batchId } = await props.params;
  const profile = await requireRole(['STAFF']);
  if (!profile) return redirect('/dashboard');

  const supabase = await createClient();

  // Fetch batch details
  const { data: batch } = await supabase
    .from('batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (!batch) {
    return <div className="p-8 text-center">Batch not found.</div>;
  }

  // Fetch students in this batch
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('batch_id', batchId)
    .order('name', { ascending: true });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/batches" className="text-blue-600 hover:underline">
          &larr; Back to Batches
        </Link>
        <h1 className="text-3xl font-bold text-[#1a365d]">
          Students: {batch.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Student Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Add Student to Batch</h2>
          <form action={async (formData) => {
            'use server';
            const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/register`, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(errorData.error);
            }
          }} className="space-y-4">
            <input type="hidden" name="batchId" value={batchId} />
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Register Number *</label>
              <input
                name="registerNumber"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 21AI001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Full Name *</label>
              <input
                name="name"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email Address *</label>
              <input
                name="email"
                type="email"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="college email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Temporary Password *</label>
              <input
                name="password"
                type="password"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="At least 8 chars, Upper, Lower, Num"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center">
              Create Student Account
            </button>
          </form>
        </div>

        {/* Students List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-sm font-semibold text-gray-600">
                <th className="p-4">Reg No</th>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {students?.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No students added to this batch yet.</td></tr>
              ) : (
                students?.map((student: any) => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium">{student.register_number}</td>
                    <td className="p-4">{student.name}</td>
                    <td className="p-4">{student.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {student.status}
                      </span>
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
