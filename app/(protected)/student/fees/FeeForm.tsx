'use client';

import React, { useState } from 'react';
import { updateFeeDetails } from '../actions';

interface CustomFee {
  id: string;
  name: string;
  amount: number;
}

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
    customFees: {
      id: string;
      name: string;
      total: number;
      paid: number;
    }[];
  };
  academicYear: string;
  customFeeDefinitions: CustomFee[];
}

export default function FeeForm({ initialData, academicYear, customFeeDefinitions }: FeeFormProps) {
  const [isHosteller, setIsHosteller] = useState<boolean>(initialData?.student_type === 'HOSTELLER');
  const [transportType, setTransportType] = useState<string>(initialData?.transport_type || 'OUTBUS');

  const [fees, setFees] = useState({
    tuitionTotal: initialData?.tuition_total || 0,
    tuitionPaid: initialData?.tuition_paid || 0,
    hostelTotal: initialData?.hostel_total || 0,
    hostelPaid: initialData?.hostel_paid || 0,
    busTotal: initialData?.bus_total || 0,
    busPaid: initialData?.bus_paid || 0,
    customPaid: (initialData?.customFees || []).reduce((acc, cf) => {
      acc[cf.id] = cf.paid;
      return acc;
    }, {} as Record<string, number>),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFeeChange = (field: keyof typeof fees, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFees((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleTotalFeeChange = (field: keyof typeof fees, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFees((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleCustomFeeChange = (feeId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFees((prev) => ({
      ...prev,
      customPaid: { ...prev.customPaid, [feeId]: numValue },
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('academicYear', academicYear);
    formData.append('studentType', isHosteller ? 'HOSTELLER' : 'DAY_SCHOLAR');
    formData.append('transportType', isHosteller ? '' : transportType);
    formData.append('tuitionTotal', fees.tuitionTotal.toString());
    formData.append('tuitionPaid', fees.tuitionPaid.toString());
    formData.append('hostelTotal', fees.hostelTotal.toString());
    formData.append('hostelPaid', fees.hostelPaid.toString());
    formData.append('busTotal', fees.busTotal.toString());
    formData.append('busPaid', fees.busPaid.toString());

    // Add custom fees as a JSON string or separate fields.
    // Since server actions handle FormData, we'll use a JSON string for simplicity.
    formData.append('customFees', JSON.stringify(fees.customPaid));

    try {
      await updateFeeDetails(formData);
      setMessage({ type: 'success', text: 'Fee details updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while updating fees.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const FeeInput = ({ label, total, paidField, totalField, value, onTotalChange, onChange }: {
    label: string;
    total: number;
    paidField: string;
    totalField?: keyof typeof fees;
    value: number;
    onTotalChange?: (val: string) => void;
    onChange: (val: string) => void;
  }) => {
    const pending = total - value;

    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
        <h4 className="font-bold text-gray-700 uppercase text-xs tracking-wider">{label}</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Total Fee</label>
            <input
              type="number"
              value={total}
              onChange={(e) => onTotalChange?.(e.target.value)}
              readOnly={!onTotalChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md outline-none ${!onTotalChange ? 'bg-gray-100 text-gray-600' : 'focus:ring-2 focus:ring-blue-500'}`}
              min="0"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Fee Paid</label>
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              min="0"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Pending Fee</label>
            <div className={`px-3 py-2 rounded-md font-bold ${pending > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
              ₹{pending.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[#1a365d]">Report Your Fee Details</h3>

        <div className="flex items-center gap-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <span className="text-sm font-medium text-blue-900">Are you a Hosteller?</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isHosteller"
                checked={isHosteller}
                onChange={() => setIsHosteller(true)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isHosteller"
                checked={!isHosteller}
                onChange={() => setIsHosteller(false)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
        </div>

        {!isHosteller && (
          <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Transport Type:</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="transportType"
                  checked={transportType === 'OUTBUS'}
                  onChange={() => setTransportType('OUTBUS')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">Outbus</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="transportType"
                  checked={transportType === 'COLLEGE_BUS'}
                  onChange={() => setTransportType('COLLEGE_BUS')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">College Bus</span>
              </label>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <FeeInput
            label="Tuition Fee"
            total={fees.tuitionTotal}
            totalField="tuitionTotal"
            paidField="tuitionPaid"
            value={fees.tuitionPaid}
            onTotalChange={(val) => handleTotalFeeChange('tuitionTotal', val)}
            onChange={(val) => handleFeeChange('tuitionPaid', val)}
          />

          {isHosteller && (
            <FeeInput
              label="Hostel Fee"
              total={fees.hostelTotal}
              totalField="hostelTotal"
              paidField="hostelPaid"
              value={fees.hostelPaid}
              onTotalChange={(val) => handleTotalFeeChange('hostelTotal', val)}
              onChange={(val) => handleFeeChange('hostelPaid', val)}
            />
          )}

          {!isHosteller && transportType === 'COLLEGE_BUS' && (
            <FeeInput
              label="Bus Fee"
              total={fees.busTotal}
              totalField="busTotal"
              paidField="busPaid"
              value={fees.busPaid}
              onTotalChange={(val) => handleTotalFeeChange('busTotal', val)}
              onChange={(val) => handleFeeChange('busPaid', val)}
            />
          )}

          {customFeeDefinitions.map(cf => (
            <FeeInput
              key={cf.id}
              label={cf.name}
              total={cf.amount}
              paidField={`custom_${cf.id}`}
              value={fees.customPaid[cf.id] || 0}
              onChange={(val) => handleCustomFeeChange(cf.id, val)}
            />
          ))}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-[#1a365d] text-white rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-sm disabled:bg-gray-400"
      >
        {isSubmitting ? 'Updating...' : 'Submit Fee Details'}
      </button>
    </form>
  );
}
