'use client';

import React, { useState, useEffect } from 'react';
import DesktopSidebar from './components/DesktopSidebar';
import MobileHeader from './components/MobileHeader';
import MobileDrawer from './components/MobileDrawer';

interface ProtectedLayoutClientProps {
  role: string;
  children: React.ReactNode;
}

export default function ProtectedLayoutClient({
  role,
  children,
}: ProtectedLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden">
      <DesktopSidebar role={role} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />

        <main className={`flex-1 bg-[#f7fafc] overflow-y-auto transition-all duration-300 ${
          'lg:ml-[260px] p-4 md:p-6 lg:p-8'
        }`}>
          {children}
        </main>

        <MobileDrawer
          role={role}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
