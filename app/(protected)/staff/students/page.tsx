import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { batchRepository } from '@/lib/repositories/batchRepository';
import { studentRepository } from '@/lib/repositories/studentRepository';
import DataFilterBar from '../components/DataFilterBar';
import ExportExcelButton from '../components/ExportExcelButton';
import DeleteStudentButton from './DeleteStudentButton';

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; batch?: string; section?: string }>;
}) {
  const { q, batch, section } = await searchParams;
  const supabase = await createClient();

  // Fetch batches for the filter bar
  const batches = await batchRepository.getAll();

  // Use repository for filtered student list
  const students = await studentRepository.getAll({
    batch,
    section,
    search: q,
  });

  // Prepare data for Excel export
  const exportData = students.map(s => ({
    'Register No': s.register_number,
    'Name': s.name,
    'Email': s.email,
    'Status': s.status,
    'Batch': s.batches?.name || 'N/A',
    'Section': s.section,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d]">Student Directory</h1>
          <p className="text-gray-600">Manage and view all departmental students.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4">
          <form className="flex-1 flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by register number or name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-[#1a365d] text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              Search
            </button>
          </form>
          {q && (
            <Link
              href="/staff/students"
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
              Clear
            </Link>
          )}
        </div>

        {/* Universal Filters & Export */}
        <div className="flex justify-between items-center gap-4">
          <DataFilterBar
            batches={batches}
            sections={['A', 'B']} // Assuming standard sections
            currentBatch={batch}
            currentSection={section}
          />
          <ExportExcelButton
            data={exportData}
            filename="students-directory"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-6 py-4 font-semibold">Register No</th>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students && students.length > 0 ? (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-gray-700">
                    {student.register_number}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 text-gray-600">{student.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-4">
                    <Link
                      href={`/staff/students/${student.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Profile
                    </Link>
                    <DeleteStudentButton studentId={student.id} studentName={student.name} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No students found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
