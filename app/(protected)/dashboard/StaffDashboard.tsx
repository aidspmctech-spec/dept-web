import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

interface StaffDashboardProps {
  profile: {
    role: string;
    name?: string;
  };
}

export default async function StaffDashboard({ profile }: StaffDashboardProps) {
  const supabase = await createClient();

  // Aggregate counts for the landing page
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE');

  const { count: batchCount } = await supabase
    .from('batches')
    .select('*', { count: 'exact', head: true });

  const quickLinks = [
    { id: 'students', label: 'Student Directory', path: '/staff/students', description: 'Manage and view all students', icon: '👤' },
    { id: 'fees', label: 'Fee Management', path: '/staff/fees', description: 'Monitor fees & collections', icon: '💰' },
    { id: 'academics', label: 'Academic Records', path: '/staff/academics', description: 'Manage grade reports', icon: '🎓' },
    { id: 'payments', label: 'Payment Records', path: '/staff/payments', description: 'Audit all transactions', icon: '💳' },
    { id: 'achievements', label: 'Achievements', path: '/staff/achievements', description: 'Track student wins', icon: '🏆' },
    { id: 'certifications', label: 'Certifications', path: '/staff/certifications', description: 'Verify courses', icon: '📜' },
    { id: 'activities', label: 'Activities', path: '/staff/activities', description: ' Manage student events', icon: '🌟' },
  ];

  const adminLinks = profile.role === 'STAFF' ? [
    { id: 'batches', label: 'Batch Management', path: '/admin/batches', description: 'Create & delete batches', icon: '📦' },
    { id: 'logs', label: 'System Audit Logs', path: '/admin/logs', description: 'Monitor system activities', icon: '📑' },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d] mb-2">Staff Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile.name || 'Administrator'}. Here is the departmental overview.</p>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-semibold text-gray-500 uppercase mb-2">Active Students</div>
          <div className="text-3xl font-bold text-[#1a365d]">{studentCount || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-semibold text-gray-500 uppercase mb-2">Total Batches</div>
          <div className="text-3xl font-bold text-[#1a365d]">{batchCount || 0}</div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...quickLinks, ...adminLinks].map((module) => (
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
