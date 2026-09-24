'use client';

import React from 'react';
import { X } from 'lucide-react';
import NavLinks from './NavLinks';

interface MobileDrawerProps {
  role: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ role, isOpen, onClose }: MobileDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[280px] max-w-[85%] flex flex-col bg-[#1a365d] p-8 text-white transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="text-xl font-bold uppercase tracking-wider">Menu</div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          <NavLinks role={role} onLinkClick={onClose} />
        </div>
      </aside>
    </>
  );
}
