import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AddStudentForm from './AddStudentForm';

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

        {/* Add Student Form */}
        <div className="lg:col-span-1">
          <AddStudentForm batchId={batchId} />
        </div>
      </div>
    </div>
  );
}
