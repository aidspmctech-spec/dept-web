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
    </div>
  );
}
