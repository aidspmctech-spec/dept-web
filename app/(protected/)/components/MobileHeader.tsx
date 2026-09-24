'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, User } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function MobileHeader({ title, onMenuClick }: MobileHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between bg-white px-4 shadow-sm lg:hidden">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <h1 className="text-lg font-bold text-[#1a365d] truncate px-2">
        {title}
      </h1>

      <div className="flex items-center justify-center rounded-full bg-gray-100 p-1">
        <User className="h-6 w-6 text-gray-600" />
      </div>
    </header>
  );
}
