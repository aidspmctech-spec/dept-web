import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import StaffDashboard from './StaffDashboard';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Profile Not Found</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          Your account is authenticated, but your student profile could not be found.
          Please contact support if this problem continues.
        </p>
        <Link href="/login" className="text-blue-600 hover:underline">Return to Login</Link>
      </div>
    );
  }

  if (profile.role === 'STAFF') {
    return <StaffDashboard profile={profile} />;
  }

  const studentId = profile.student_id;
  if (!studentId) return <div className="p-8 text-center">Error: Student ID not found</div>;

  // 1. Profile Completion
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  const requiredFields = ['phone', 'gender', 'father_name', 'address', 'batch_id', 'semester'];
  const filledFields = requiredFields.filter(field => student && student[field]);
  const completionPercentage = Math.round((filledFields.length / requiredFields.length) * 100);

  // 2. Academic Summary
  const { data: academicRecord } = await supabase
    .from('academic_records')
    .select('*')
    .eq('student_id', studentId)
    .order('semester', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Fees Summary (Current Academic Year)
  const { data: feeStructure } = await supabase
    .from('fee_structures')
    .select('*')
    .eq('student_id', studentId)
    .order('academic_year', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: hostel } = await supabase
    .from('hostel_details')
    .select('accommodation_type')
    .eq('student_id', studentId)
    .maybeSingle();

  const { data: transport } = await supabase
    .from('transport_details')
    .select('transport_type')
    .eq('student_id', studentId)
    .maybeSingle();

  let totalRequired = 0;
  let totalPaid = 0;
  const currentYear = feeStructure?.academic_year;

  if (feeStructure) {
    // Determine applicable components based on profile
    const applicable = ['tuition_fee'];
    if (hostel?.accommodation_type === 'Hosteller') applicable.push('hostel_fee');
    if (transport?.transport_type === 'COLLEGE_BUS') applicable.push('transport_fee');

    totalRequired = applicable.reduce((sum, field) => sum + (feeStructure[field as keyof typeof feeStructure] as number || 0), 0);

    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('student_id', studentId)
      .eq('academic_year', currentYear);

    totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  }

  // 4. record counts
  const { count: achCount } = await supabase.from('achievements').select('*', { count: 'exact', head: true }).eq('student_id', studentId);
  const { count: certCount } = await supabase.from('certifications').select('*', { count: 'exact', head: true }).eq('student_id', studentId);
  const { count: actCount } = await supabase.from('activities').select('*', { count: 'exact', head: true }).eq('student_id', studentId);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d] mb-2">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here is your current departmental summary.</p>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-semibold text-gray-500 uppercase mb-2">Profile Completion</div>
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold text-[#1a365d]">{completionPercentage}%</div>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${completionPercentage}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-semibold text-gray-500 uppercase mb-2">Academics</div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-3xl font-bold text-[#1a365d]">{academicRecord?.cgpa || 'N/A'}</div>
              <div className="text-xs text-gray-500">Current CGPA</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">{academicRecord?.backlogs || 0}</div>
              <div className="text-xs text-gray-500">Backlogs</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-semibold text-gray-500 uppercase mb-2">Fees ({currentYear || 'N/A'})</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Total:</span>
              <span>₹{totalRequired.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-green-600">
              <span>Paid:</span>
              <span>₹{totalPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t">
              <span>Pending:</span>
              <span className={Math.max(totalRequired - totalPaid, 0) > 0 ? 'text-red-600' : 'text-green-600'}>
                ₹{Math.max(totalRequired - totalPaid, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase mt-2 pt-2 border-t border-gray-100">
              <span>Status:</span>
              <span className={
                totalPaid === 0 && totalRequired > 0 ? 'text-red-500' :
                totalPaid < totalRequired ? 'text-orange-500' : 'text-green-600'
              }>
                {totalPaid === 0 && totalRequired > 0 ? 'Fully Pending' :
                 totalPaid < totalRequired ? 'Partially Paid' : 'Fully Paid'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-semibold text-gray-500 uppercase mb-2">Submissions</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xl font-bold text-[#1a365d]">{achCount || 0}</div>
              <div className="text-[10px] text-gray-500 uppercase">Achieve</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#1a365d]">{certCount || 0}</div>
              <div className="text-[10px] text-gray-500 uppercase">Certs</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#1a365d]">{actCount || 0}</div>
              <div className="text-[10px] text-gray-500 uppercase">Activ.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 'profile', label: 'My Profile', path: '/student/profile', description: 'Personal & Academic Identity', icon: '👤' },
          { id: 'academics', label: 'Academics', path: '/student/academics', description: 'Official Grade Records', icon: '🎓' },
          { id: 'fees', label: 'Fees & Payments', path: '/student/fees', description: 'Fee Structure & History', icon: '💰' },
          { id: 'achievements', label: 'Achievements', path: '/student/achievements', description: 'Awards & Wins', icon: '🏆' },
          { id: 'certifications', label: 'Certifications', path: '/student/certifications', description: 'Courses & Certs', icon: '📜' },
          { id: 'activities', label: 'Activities', path: '/student/activities', description: 'Clubs & Events', icon: '🌟' },
        ].map((module) => (
          <Link
            key={module.id}
            href={module.path}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{module.icon}</div>
              <div>
                <h3 className="font-bold text-[#1a365d] group-hover:text-blue-700 transition-colors">{module.label}</h3>
                <p className="text-sm text-gray-500">{module.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
