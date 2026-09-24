'use client';

import React, { useState, useEffect } from 'react';
import { getUserRole } from '@/lib/auth';
import DesktopSidebar from './components/DesktopSidebar';
import MobileHeader from './components/MobileHeader';
import MobileDrawer from './components/MobileDrawer';

export default function ProtectedLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchRole() {
      const userRole = await getUserRole();
      setRole(userRole);
    }
    fetchRole();
  }, []);

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

  if (!role) return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;

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
