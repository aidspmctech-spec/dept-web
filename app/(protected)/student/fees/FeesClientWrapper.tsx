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
  initialCustomFees?: any[];
}

export default function FeesClientWrapper({
  initialFeeStructure,
  initialPayments,
  initialHostelType,
  initialTransportType,
  initialCustomFees = [],
}: FeesClientWrapperProps) {
  const [feeStructure, setFeeStructure] = useState(initialFeeStructure);
  const [payments, setPayments] = useState(initialPayments);
  const [customFees, setCustomFees] = useState(initialCustomFees);
  const [selectedComponent, setSelectedComponent] = useState<'TUITION' | 'HOSTEL' | 'TRANSPORT' | string>('TUITION');

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

  const handleSelectComponent = (componentKey: string) => {
    setSelectedComponent(componentKey);
    // Optionally scroll to the form if it's off-screen
    document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <FeeSummary
          feeStructure={[liveFeeStructure]}
          payments={payments}
          hostelType={initialHostelType}
          transportType={initialTransportType}
          customFees={customFees}
          onSelectComponent={handleSelectComponent}
        />
        <PaymentHistory payments={payments} />
      </div >
      <div className="lg:col-span-1">
        <FeeForm
          id="payment-form"
          initialData={{
            student_type: initialHostelType ?? null,
            transport_type: initialTransportType ?? null,
            tuition_total: draftTotals.tuition_fee,
            tuition_paid: 0,
            hostel_total: draftTotals.hostel_fee,
            hostel_paid: 0,
            bus_total: draftTotals.transport_fee,
            bus_paid: 0,
            customFees: customFees,
          }}
          selectedComponent={selectedComponent}
          customFeeDefinitions={customFees.map(cf => cf.custom_fee_definitions)}
          onTotalChange={(newTotals) => setDraftTotals(newTotals)}
          onPaymentSuccess={() => {
            // In a real app, we might fetch updated payments here
            // For now, we rely on server revalidation via the action
          }}
        />
      </div >
    </div >
  );
}
