import { createClient } from '@/lib/supabase/server';
import { batchRepository } from '@/lib/repositories/batchRepository';
import DataFilterBar from '../components/DataFilterBar';
import ExportExcelButton from '../components/ExportExcelButton';

export default async function StaffActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; section?: string }>;
}) {
  const { batch, section } = await searchParams;
  const supabase = await createClient();

  const batches = await batchRepository.getAll();

  let query = supabase
    .from('activities')
    .select('*, students!inner(name, register_number, batch_id, section, batches(name))')
    .order('date', { ascending: false });

  if (batch) {
    query = query.eq('students.batch_id', batch);
  }
  if (section) {
    query = query.eq('students.section', section);
  }

  const { data: activities, error } = await query;

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error loading activities: {error.message}
      </div>
    );
  }

  const exportData = activities.map(a => ({
    'Student Name': a.students?.name,
    'Register No': a.students?.register_number,
    'Activity': a.activity_name,
    'Role': a.role,
    'Date': a.date,
    'Batch': a.students?.batches?.name || 'N/A',
    'Section': a.students?.section,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">Student Activities</h1>
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
          filename="student-activities"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Activity</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activities && activities.length > 0 ? (
              activities.map((act: any) => (
                <tr key={act.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{act.students?.name}</div>
                    <div className="text-xs text-gray-500">{act.students?.register_number}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{act.activity_name}</td>
                  <td className="px-6 py-4">{act.role}</td>
                  <td className="px-6 py-4">{act.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No activities recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
