'use client';

import React from 'react';
import { makeImmediatePayment } from '../actions';

interface FeeStructure {
  tuition_fee: number;
  transport_fee: number;
  hostel_fee: number;
}

interface Payment {
  amount: number;
  fee_component: string;
  payment_status: string;
}

interface CustomFeeAssignment {
  id: string;
  assigned_amount: number;
  paid_amount: number;
  custom_fee_definitions: {
    fee_name: string;
  };
}

interface FeeSummaryProps {
  feeStructure: FeeStructure | FeeStructure[] | null;
  payments: Payment[];
  hostelType?: string;
  transportType?: string;
  customFees?: CustomFeeAssignment[];
}

export default function FeeSummary({ feeStructure, payments, hostelType, transportType, customFees = [] }: FeeSummaryProps) {
  if (!feeStructure || (Array.isArray(feeStructure) && feeStructure.length === 0)) {
    return (
      <div className="p-8 bg-orange-50 text-orange-700 rounded-xl border border-orange-200 text-center">
        <p className="font-medium">No fee totals entered yet.</p>
        <p className="text-sm">Please enter your required fee totals in the form to the right.</p>
      </div>
    );
  }

  const actualFeeStructure = Array.isArray(feeStructure) ? feeStructure[0] : feeStructure;

  if (!actualFeeStructure) {
    return (
      <div className="p-8 bg-orange-50 text-orange-700 rounded-xl border border-orange-200 text-center">
        <p className="font-medium">No fee totals entered yet.</p>
        <p className="text-sm">Please enter your required fee totals in the form to the right.</p>
      </div>
    );
  }

  const components = [
    { key: 'TUITION', label: 'Tuition', field: 'tuition_fee' },
    { key: 'HOSTEL', label: 'Hostel', field: 'hostel_fee', applicable: hostelType === 'Hosteller' },
    { key: 'TRANSPORT', label: 'Bus Fee', field: 'transport_fee', applicable: transportType === 'COLLEGE_BUS' },
  ];

  const calculatePaid = (component: string) => {
    if (!payments || !Array.isArray(payments)) return 0;
    return payments
      .filter(p => p && p.fee_component === component)
      .reduce((sum, p) => sum + (p?.amount || 0), 0);
  };

  const rows = components.filter(c => c.applicable === undefined || c.applicable).map(c => {
    const required = (actualFeeStructure as any)?.[c.field] ?? 0;
    const paid = calculatePaid(c.key);
    const balance = Math.max(required - paid, 0);

    return {
      label: c.label,
      required,
      paid,
      balance,
      componentKey: c.key,
    };
  });

  // Add Custom Fees to the rows
  const customRows = customFees.map(cf => {
    const def = Array.isArray(cf.custom_fee_definitions)
      ? cf.custom_fee_definitions[0]
      : cf.custom_fee_definitions;

    return {
      label: def?.fee_name || 'Custom Fee',
      required: cf.assigned_amount,
      paid: cf.paid_amount,
      balance: Math.max(cf.assigned_amount - cf.paid_amount, 0),
      componentKey: `custom:${cf.id}`,
    };
  });

  const allRows = [...rows, ...customRows];

  const totalRequired = allRows.reduce((sum, r) => sum + r.required, 0);
  const totalPaid = allRows.reduce((sum, r) => sum + r.paid, 0);
  const totalBalance = allRows.reduce((sum, r) => sum + r.balance, 0);

  const handlePayment = async (componentKey: string) => {
    try {
      const result = await makeImmediatePayment({ component: componentKey });
      if (result.success) {
        alert('Payment successful!');
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || 'Payment failed');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      <h3 className="text-xl font-bold text-[#1a365d]">Fee Summary</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr className="text-xs font-semibold text-gray-500 uppercase border-b">
              <th className="py-3 px-2">Component</th>
              <th className="py-3 px-2 text-right">Required</th>
              <th className="py-3 px-2 text-right">Paid</th>
              <th className="py-3 px-2 text-right">Balance</th>
              <th className="py-3 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allRows.map((row, idx) => (
              <tr key={idx} className="text-sm">
                <td className="py-4 px-2 font-medium text-gray-700">{row.label}</td>
                <td className="py-4 px-2 text-right">₹{row.required.toLocaleString()}</td>
                <td className="py-4 px-2 text-right text-green-600">₹{row.paid.toLocaleString()}</td>
                <td className="py-4 px-2 text-right font-bold text-red-600">₹{row.balance.toLocaleString()}</td>
                <td className="py-4 px-2 text-center">
                  {row.balance > 0 && (
                    <button
                      onClick={() => handlePayment(row.componentKey)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Make Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold text-[#1a365d]">
              <td className="py-4 px-2">Total</td>
              <td className="py-4 px-2 text-right">₹{totalRequired.toLocaleString()}</td>
              <td className="py-4 px-2 text-right">₹{totalPaid.toLocaleString()}</td>
              <td className="py-4 px-2 text-right text-red-600">₹{totalBalance.toLocaleString()}</td>
              <td className="py-4 px-2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
