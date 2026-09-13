'use client';

import React, { useState, useMemo } from 'react';
import FeeSummary from './FeeSummary';
import PaymentHistory from './PaymentHistory';
import FeeForm from './FeeForm';

interface FeesClientWrapperProps {
  initialFeeStructure: any;
  initialPayments: any[];
  initialHostelType?: string;
  initialTransportType?: string;
}

export default function FeesClientWrapper({
  initialFeeStructure,
  initialPayments,
  initialHostelType,
  initialTransportType
}: FeesClientWrapperProps) {
  const [feeStructure, setFeeStructure] = useState(initialFeeStructure);
  const [payments, setPayments] = useState(initialPayments);

  // We use a simple state to track "draft" changes in the form for live updates
  const [draftTotals, setDraftTotals] = useState({
    tuition_fee: initialFeeStructure?.tuition_fee || 0,
    hostel_fee: initialFeeStructure?.hostel_fee || 0,
    transport_fee: initialFeeStructure?.transport_fee || 0,
  });

  // Compute the current live summary based on verified payments and draft totals
  const liveFeeStructure = {
    ...feeStructure,
    tuition_fee: draftTotals.tuition_fee,
    hostel_fee: draftTotals.hostel_fee,
    transport_fee: draftTotals.transport_fee,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <FeeSummary
          feeStructure={[liveFeeStructure]}
          payments={payments}
          hostelType={initialHostelType}
          transportType={initialTransportType}
        />
        <PaymentHistory payments={payments} />
      </div >
      <div className="lg:col-span-1">
        <FeeForm
          initialData={{
            student_type: initialHostelType,
            transport_type: initialTransportType,
            tuition_total: draftTotals.tuition_fee,
            hostel_total: draftTotals.hostel_fee,
            bus_total: draftTotals.transport_fee,
          }}
          onTotalChange={(newTotals) => setDraftTotals(newTotals)}
          onPaymentSuccess={() => {
            // In a real app, we might fetch updated payments here
            // For now, we rely on server revalidation via the action
          }}
        />
      </div >
    </div>
  );
}
