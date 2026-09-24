'use client';

import React, { useState, useEffect } from 'react';
import { Menu, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface MobileHeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

export default function MobileHeader({ onMenuClick, userName }: MobileHeaderProps) {
  const pathname = usePathname();

  // Simple mapping for page titles
  const getPageTitle = (path: string) => {
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/student/profile')) return 'My Profile';
    if (path.includes('/student/academics')) return 'Academics';
    if (path.includes('/student/fees')) return 'Fees & Payments';
    if (path.includes('/student/achievements')) return 'Achievements';
    if (path.includes('/student/certifications')) return 'Certifications';
    if (path.includes('/student/activities')) return 'Activities';
    if (path.includes('/staff/students')) return 'Student Directory';
    if (path.includes('/staff/fees')) return 'Fee Management';
    if (path.includes('/staff/academics')) return 'Academic Records';
    if (path.includes('/staff/payments')) return 'Payment Records';
    if (path.includes('/staff/achievements')) return 'Achievements';
    if (path.includes('/staff/certifications')) return 'Certifications';
    if (path.includes('/staff/activities')) return 'Activities';
    if (path.includes('/admin/batches')) return 'Batch Management';
    return 'Portal';
  };

  return (
    <header className="sticky top-0 z-30 flex h-[60px] w-full items-center justify-between bg-white px-4 shadow-sm lg:hidden border-b">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <h1 className="text-md font-bold text-[#1a365d] truncate px-2">
        {getPageTitle(pathname)}
      </h1>

      <div className="flex items-center justify-center rounded-full bg-gray-100 p-1 cursor-pointer hover:bg-gray-200 transition-colors">
        <User className="h-6 w-6 text-gray-600" />
      </div>
    </header>
  );
}
