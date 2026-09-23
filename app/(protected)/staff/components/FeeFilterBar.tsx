'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface CustomFee {
  id: string;
  name: string;
}

interface FeeFilterBarProps {
  currentComponent: string;
  currentStatus: string;
  customFees: CustomFee[];
  mode: 'regular' | 'custom';
}

export default function FeeFilterBar({
  currentComponent,
  currentStatus,
  customFees,
  mode,
}: FeeFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
      {mode === 'regular' ? (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Component:</label>
          <select
            value={currentComponent}
            onChange={(e) => updateFilter('component', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TUITION">Tuition Fee</option>
            <option value="TRANSPORT">Bus Fee</option>
            <option value="HOSTEL">Hostel Fee</option>
          </select>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Custom Fee:</label>
          <select
            value={currentComponent}
            onChange={(e) => updateFilter('component', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Custom Fees</option>
            {customFees.map(cf => (
              <option key={cf.id} value={cf.id}>{cf.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Status:</label>
        <select
          value={currentStatus}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="PAID">Fully Paid</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>
    </div>
  );
}
