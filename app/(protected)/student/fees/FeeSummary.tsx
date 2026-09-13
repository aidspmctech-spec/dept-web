'use client';

import React from 'react';

interface FeeStructure {
  tuition_fee: number;
  transport_fee: number;
  hostel_fee: number;
}

interface Payment {
  amount: number;
  fee_component: 'TUITION' | 'TRANSPORT' | 'HOSTEL';
}

interface FeeSummaryProps {
  feeStructure: FeeStructure | FeeStructure[] | null;
  payments: Payment[];
  hostelType?: string;
  transportType?: string;
}

export default function FeeSummary({ feeStructure, payments, hostelType, transportType }: FeeSummaryProps) {
  // 1. Guard against null, undefined, or empty array
  if (!feeStructure || (Array.isArray(feeStructure) && feeStructure.length === 0)) {
    return (
      <div className="p-8 bg-orange-50 text-orange-700 rounded-xl border border-orange-200 text-center">
        <p className="font-medium">No official fee structure found for the selected year.</p>
        <p className="text-sm">Please contact the department office to have your fees assigned.</p>
      </div>
    );
  }

  // 2. Normalize to a single object
  const actualFeeStructure = Array.isArray(feeStructure) ? feeStructure[0] : feeStructure;

  // 3. Guard against the extracted object being null or undefined
  if (!actualFeeStructure) {
    return (
      <div className="p-8 bg-orange-50 text-orange-700 rounded-xl border border-orange-200 text-center">
        <p className="font-medium">No official fee structure found for the selected year.</p>
        <p className="text-sm">Please contact the department office to have your fees assigned.</p>
      </div>
    );
  }

  const components = [
    { key: 'TUITION', label: 'Tuition', field: 'tuition_fee' },
    { key: 'HOSTEL', label: 'Hostel', field: 'hostel_fee', applicable: hostelType === 'Hosteller' },
    { key: 'TRANSPORT', label: 'Transport', field: 'transport_fee', applicable: transportType === 'COLLEGE_BUS' },
  ];

  const calculatePaid = (component: string) => {
    if (!payments || !Array.isArray(payments)) return 0;
    return payments
      .filter(p => p && p.fee_component === component)
      .reduce((sum, p) => sum + (p?.amount || 0), 0);
  };

  const rows = components.filter(c => c.applicable === undefined || c.applicable).map(c => {
    // Use optional chaining and explicit fallback to avoid crash
    const required = (actualFeeStructure as any)?.[c.field] ?? 0;
    const paid = calculatePaid(c.key);
    const pending = Math.max(required - paid, 0);

    return {
      label: c.label,
      required,
      paid,
      pending,
    };
  });

  const totalRequired = rows.reduce((sum, r) => sum + r.required, 0);
  const totalPaid = rows.reduce((sum, r) => sum + r.paid, 0);
  const totalPending = rows.reduce((sum, r) => sum + r.pending, 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      <h3 className="text-xl font-bold text-[#1a365d]">Fee Summary</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 uppercase border-b">
              <th className="py-3 px-2">Component</th>
              <th className="py-3 px-2 text-right">Required</th>
              <th className="py-3 px-2 text-right">Paid</th>
              <th className="py-3 px-2 text-right">Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(row => (
              <tr key={row.label} className="text-sm">
                <td className="py-4 px-2 font-medium text-gray-700">{row.label}</td>
                <td className="py-4 px-2 text-right">₹{row.required.toLocaleString()}</td>
                <td className="py-4 px-2 text-right text-green-600">₹{row.paid.toLocaleString()}</td>
                <td className="py-4 px-2 text-right font-bold text-red-600">₹{row.pending.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold text-[#1a365d]">
              <td className="py-4 px-2">Total</td>
              <td className="py-4 px-2 text-right">₹{totalRequired.toLocaleString()}</td>
              <td className="py-4 px-2 text-right">₹{totalPaid.toLocaleString()}</td>
              <td className="py-4 px-2 text-right text-red-600">₹{totalPending.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
