import { createClient } from '@/lib/supabase/server';
import { batchRepository } from '@/lib/repositories/batchRepository';
import DataFilterBar from '../components/DataFilterBar';
import ExportExcelButton from '../components/ExportExcelButton';

export default async function StaffAcademicsPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; section?: string }>;
}) {
  const { batch, section } = await searchParams;
  const supabase = await createClient();

  // Fetch batches for the filter bar
  const batches = await batchRepository.getAll();

  let query = supabase
    .from('academic_records')
    .select('*, students!inner(name, register_number, batch_id, section, batches(name))')
    .order('student_id');

  if (batch) {
    query = query.eq('students.batch_id', batch);
  }
  if (section) {
    query = query.eq('students.section', section);
  }

  const { data: records, error } = await query;

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error loading academic records: {error.message}
      </div>
    );
  }

  // Prepare data for Excel export
  const exportData = records.map(rec => ({
    'Student Name': rec.students?.name,
    'Register No': rec.students?.register_number,
    'Batch': rec.students?.batches?.name || 'N/A',
    'Section': rec.students?.section,
    'Year': rec.academic_year,
    'Semester': rec.semester,
    'SGPA': rec.sgpa || '-',
    'CGPA': rec.cgpa || '-',
    'Status': rec.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">Academic Records Management</h1>
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
          filename="academic-records"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Year</th>
              <th className="px-6 py-4 font-semibold">Sem</th>
              <th className="px-6 py-4 font-semibold">SGPA</th>
              <th className="px-6 py-4 font-semibold">CGPA</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records && records.length > 0 ? (
              records.map((rec: any) => (
                <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{rec.students?.name}</div>
                    <div className="text-xs text-gray-500">{rec.students?.register_number}</div>
                  </td>
                  <td className="px-6 py-4">{rec.academic_year}</td>
                  <td className="px-6 py-4">{rec.semester}</td>
                  <td className="px-6 py-4">{rec.sgpa || '-'}</td>
                  <td className="px-6 py-4">{rec.cgpa || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      rec.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {rec.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No academic records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
