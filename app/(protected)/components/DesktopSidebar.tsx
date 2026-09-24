'use client';

import NavLinks from './NavLinks';

interface DesktopSidebarProps {
  role: string;
}

export default function DesktopSidebar({ role }: DesktopSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-20 hidden h-screen w-[260px] flex-col bg-[#1a365d] p-8 text-white lg:flex">
      <NavLinks role={role} />
    </aside>
  );
}
