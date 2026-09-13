'use client';

import React, { useState } from 'react';
import { submitPayment } from '../actions';

interface AddPaymentFormProps {
  academicYear: string;
  hostelType?: string;
  transportType?: string;
}

export default function AddPaymentForm({ academicYear, hostelType, transportType }: AddPaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    feeComponent: 'TUITION',
    amount: '',
    paymentDate: '',
    paymentMode: 'ONLINE',
    transactionReference: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const data = new FormData();
    data.append('academicYear', academicYear);
    data.append('component', formData.feeComponent);
    data.append('amount', formData.amount);
    data.append('date', formData.paymentDate);
    data.append('mode', formData.paymentMode);
    data.append('transactionReference', formData.transactionReference);

    try {
      await submitPayment(data);
      setMessage({ type: 'success', text: 'Payment submitted successfully!' });
      setFormData(prev => ({
        ...prev,
        amount: '',
        paymentDate: '',
        transactionReference: '',
      }));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while submitting payment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Applicability logic for fee components
  const applicableComponents = [
    { value: 'TUITION', label: 'Tuition Fee' },
    ...(hostelType === 'Hosteller' ? [{ value: 'HOSTEL', label: 'Hostel Fee' }] : []),
    ...(transportType === 'COLLEGE_BUS' ? [{ value: 'TRANSPORT', label: 'Transport Fee' }] : []),
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      <h3 className="text-xl font-bold text-[#1a365d]">Add Payment</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Academic Year</label>
          <input
            type="text"
            value={academicYear}
            readOnly
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Fee Component</label>
          <select
            value={formData.feeComponent}
            onChange={(e) => handleInputChange('feeComponent', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            {applicableComponents.map(comp => (
              <option key={comp.value} value={comp.value}>{comp.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Amount (₹)</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Payment Date</label>
          <input
            type="date"
            value={formData.paymentDate}
            onChange={(e) => handleInputChange('paymentDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Payment Mode</label>
          <select
            value={formData.paymentMode}
            onChange={(e) => handleInputChange('paymentMode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="ONLINE">Online</option>
            <option value="CASH">Cash</option>
            <option value="DD">Demand Draft (DD)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">
            Transaction Reference {formData.paymentMode !== 'CASH' && '(Required)'}
          </label>
          <input
            type="text"
            value={formData.transactionReference}
            onChange={(e) => handleInputChange('transactionReference', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter TXN ID or DD Number"
            required={formData.paymentMode !== 'CASH'}
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-xs font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[#1a365d] text-white rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-sm disabled:bg-gray-400"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Payment'}
        </button>
      </form>
    </div>
  );
}
