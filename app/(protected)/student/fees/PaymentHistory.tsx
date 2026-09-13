'use client';

import React from 'react';

interface Payment {
  payment_date: string;
  academic_year: string;
  fee_component: 'TUITION' | 'TRANSPORT' | 'HOSTEL';
  amount: number;
  payment_mode: 'Cash' | 'Online' | 'DD' | 'CASH' | 'ONLINE';
  payment_status: string;
  transaction_reference: string | null;
}

interface PaymentHistoryProps {
  payments: Payment[];
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
        <h3 className="text-xl font-bold text-[#1a365d] mb-4">Payment History</h3>
        <p className="text-gray-500">No payment records found for the current year.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'PENDING_VERIFICATION':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      <h3 className="text-xl font-bold text-[#1a365d]">Payment History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr className="text-xs font-semibold text-gray-500 uppercase border-b">
              <th className="py-3 px-2">Date</th>
              <th className="py-3 px-2">Component</th>
              <th className="py-3 px-2 text-right">Amount</th>
              <th className="py-3 px-2">Mode</th>
              <th className="py-3 px-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((payment, idx) => (
              <tr key={idx} className="text-sm hover:bg-gray-50 transition-colors">
                <td className="py-3 px-2 text-gray-600">
                  {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 px-2 font-medium text-gray-700">
                  {payment.fee_component.charAt(0) + payment.fee_component.slice(1).toLowerCase()}
                </td>
                <td className="py-3 px-2 text-right font-bold text-gray-900">
                  ₹{payment.amount.toLocaleString()}
                </td>
                <td className="py-3 px-2">
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                    {payment.payment_mode}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(payment.payment_status)}`}>
                    {payment.payment_status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
