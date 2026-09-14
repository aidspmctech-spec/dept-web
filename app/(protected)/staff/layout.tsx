import React from 'react';
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

  return (
    <div className="flex-1">
      {children}
    </div>
  );
}
