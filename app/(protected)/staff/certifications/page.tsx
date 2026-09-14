import { createClient } from '@/lib/supabase/server';
import { batchRepository } from '@/lib/repositories/batchRepository';
import DataFilterBar from '../components/DataFilterBar';
import ExportExcelButton from '../components/ExportExcelButton';

export default async function StaffCertificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; section?: string }>;
}) {
  const { batch, section } = await searchParams;
  const supabase = await createClient();

  const batches = await batchRepository.getAll();

  let query = supabase
    .from('certifications')
    .select('*, students!inner(name, register_number, batch_id, section, batches(name))')
    .order('completion_date', { ascending: false });

  if (batch) {
    query = query.eq('students.batch_id', batch);
  }
  if (section) {
    query = query.eq('students.section', section);
  }

  const { data: certifications, error } = await query;

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error loading certifications: {error.message}
      </div>
    );
  }

  const exportData = certifications.map(c => ({
    'Student Name': c.students?.name,
    'Register No': c.students?.register_number,
    'Course': c.course_name,
    'Platform': c.platform,
    'Date': c.completion_date,
    'Batch': c.students?.batches?.name || 'N/A',
    'Section': c.students?.section,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">Student Certifications</h1>
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
          filename="student-certifications"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Course</th>
              <th className="px-6 py-4 font-semibold">Platform</th>
              <th className="px-6 py-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {certifications && certifications.length > 0 ? (
              certifications.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{c.students?.name}</div>
                    <div className="text-xs text-gray-500">{c.students?.register_number}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{c.course_name}</td>
                  <td className="px-6 py-4">{c.platform}</td>
                  <td className="px-6 py-4">{c.completion_date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No certifications recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
