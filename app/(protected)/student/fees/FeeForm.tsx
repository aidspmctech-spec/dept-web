'use client';

import React, { useState } from 'react';
import { updateFeeTotals, submitPayment } from '../actions';

interface FeeFormProps {
  initialData?: {
    student_type: string;
    transport_type: string | null;
    tuition_total: number;
    tuition_paid: number;
    hostel_total: number;
    hostel_paid: number;
    bus_total: number;
    bus_paid: number;
    customFees: any[];
  };
  onTotalChange?: (totals: { tuition_fee: number; hostel_fee: number; transport_fee: number }) => void;
  onPaymentSuccess?: () => void;
  customFeeDefinitions: any[];
}

export default function FeeForm({ initialData, onTotalChange, onPaymentSuccess }: FeeFormProps) {
  const isHosteller = initialData?.student_type === 'Hosteller' || initialData?.student_type === 'HOSTELLER';
  const isBusUser = initialData?.transport_type === 'COLLEGE_BUS';

  const [totals, setTotals] = useState({
    tuitionTotal: initialData?.tuition_total || 0,
    hostelTotal: initialData?.hostel_total || 0,
    busTotal: initialData?.bus_total || 0,
  });

  const handleTotalChange = (field: string, value: number) => {
    const newTotals = { ...totals, [field]: value };
    setTotals(newTotals);
    if (onTotalChange) {
      onTotalChange({
        tuition_fee: newTotals.tuitionTotal,
        hostel_fee: newTotals.hostelTotal,
        transport_fee: newTotals.busTotal,
      });
    }
  };

  const [payment, setPayment] = useState({
    amount: '',
    mode: 'ONLINE',
    component: 'TUITION',
    date: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTotalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('tuitionTotal', totals.tuitionTotal.toString());
    formData.append('hostelTotal', totals.hostelTotal.toString());
    formData.append('busTotal', totals.busTotal.toString());

    try {
      await updateFeeTotals(formData);
      setMessage({ type: 'success', text: 'Fee totals updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while updating totals.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('amount', payment.amount);
    formData.append('mode', payment.mode);
    formData.append('component', payment.component);
    formData.append('date', payment.date);

    try {
      await submitPayment(formData);
      setMessage({ type: 'success', text: 'Payment submitted successfully!' });
      setPayment({ ...payment, amount: '', date: '' });
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while submitting payment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Total Fee Management */}
      <form onSubmit={handleTotalSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <h3 className="text-lg font-bold text-[#1a365d]">Fee Totals</h3>
        <p className="text-xs text-gray-500">Enter the total amount you are required to pay for this year.</p>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Tuition Fee</label>
            <input
              type="number"
              value={totals.tuitionTotal}
              onChange={(e) => handleTotalChange('tuitionTotal', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>

          {isHosteller && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Hostel Fee</label>
              <input
                type="number"
                value={totals.hostelTotal}
                onChange={(e) => handleTotalChange('hostelTotal', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          )}

          {isBusUser && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Bus Fee</label>
              <input
                type="number"
                value={totals.busTotal}
                onChange={(e) => handleTotalChange('busTotal', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 bg-gray-100 text-[#1a365d] rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-300 disabled:bg-gray-200"
        >
          {isSubmitting ? 'Saving...' : 'Update Totals'}
        </button>
      </form>

      {/* Section 2: New Payment Form */}
      <form onSubmit={handlePaymentSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <h3 className="text-lg font-bold text-[#1a365d]">Make a Payment</h3>
        <p className="text-xs text-gray-500">Submit a new payment installment.</p>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Amount Paid</label>
            <input
              type="number"
              value={payment.amount}
              onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Date of Fee Payment</label>
            <input
              type="date"
              value={payment.date}
              onChange={(e) => setPayment({ ...payment, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Mode of Payment</label>
            <select
              value={payment.mode}
              onChange={(e) => setPayment({ ...payment, mode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="ONLINE">Online</option>
              <option value="CASH">Cash</option>
              <option value="DD">DD</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Payment For</label>
            <select
              value={payment.component}
              onChange={(e) => setPayment({ ...payment, component: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="TUITION">Tuition Fee</option>
              {isHosteller && <option value="HOSTEL">Hostel Fee</option>}
              {isBusUser && <option value="TRANSPORT">Bus Fee</option>}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[#1a365d] text-white rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-sm disabled:bg-gray-400"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Payment'}
        </button>
      </form>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
