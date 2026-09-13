import React from 'react';
import Link from 'next/link';
import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'STAFF') {
    redirect('/login');
  }

  const navItems = [
    { name: 'Students', path: '/staff/students', icon: '👥' },
    { name: 'Academics', path: '/staff/academics', icon: '📚' },
    { name: 'Fees', path: '/staff/fees', icon: '💰' },
    { name: 'Payments', path: '/staff/payments', icon: '💳' },
    { name: 'Achievements', path: '/staff/achievements', icon: '🏆' },
    { name: 'Certifications', path: '/staff/certifications', icon: '📜' },
    { name: 'Activities', path: '/staff/activities', icon: '🌟' },
    { name: 'Reports', path: '/staff/reports', icon: '📊' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a365d] text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight">Staff Portal</h1>
          <p className="text-xs text-blue-300 mt-1">Departmental Management</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors group"
            >
              <span className="mr-3 text-lg group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-900">
          <div className="flex items-center p-2 space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
              ST
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium truncate">Admin User</p>
              <p className="text-[10px] text-blue-300 uppercase">STAFF</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
