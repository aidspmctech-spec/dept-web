'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { deleteCustomFee } from '../fees/actions';
import DataFilterBar from '../components/DataFilterBar';
import FeeFilterBar from '../components/FeeFilterBar';
import ExportExcelButton from '../components/ExportExcelButton';
import CreateFeeModal from '../fees/CreateFeeModal';
import { Trash2 } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

interface CustomFee {
  id: string;
  fee_name: string;
  amount: number;
  batch: string | null;
  section: string | null;
  gender: string | null;
  created_at: string;
  assigned_count: number;
  paid_count: number;
  pending_count: number;
  status: string;
}

export default function CustomFeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const batch = searchParams.get('batch') || 'all';
  const section = searchParams.get('section') || 'all';
  const gender = searchParams.get('gender') || 'all';
  const component = searchParams.get('component') || 'all';
  const status = searchParams.get('status') || 'all';

  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [customFees, setCustomFees] = useState<CustomFee[]>([]);
  const [availableCustomFeeNames, setAvailableCustomFeeNames] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Deletion State
  const [feeToDelete, setFeeToDelete] = useState<CustomFee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const resBatches = await fetch('/api/batches');
        const dataBatches = await resBatches.json();
        setBatches(dataBatches);

        const resFees = await fetch(`/api/staff/custom-fees?batch=${batch}&section=${section}&gender=${gender}&component=${component}&status=${status}`);
        const dataFees = await resFees.json();
        setCustomFees(dataFees.fees || []);
      } catch (error) {
        console.error('Error fetching custom fees:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [batch, section, gender, component, status]);

  useEffect(() => {
    async function fetchAvailableFees() {
      try {
        const res = await fetch(`/api/staff/custom-fees?batch=${batch}&section=${section}&gender=all&component=all&status=all`);
        const data = await res.json();
        const fees = data.fees || [];

        const uniqueFees = new Map();
        fees.forEach((f: any) => {
          uniqueFees.set(f.id, f.fee_name);
        });

        setAvailableCustomFeeNames(Array.from(uniqueFees.entries()).map(([id, name]) => ({ id, name })));
      } catch (error) {
        console.error('Error fetching available custom fees:', error);
      }
    }
    fetchAvailableFees();
  }, [batch, section]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };

  const filteredFees = customFees;

  const exportData = filteredFees.map(fee => {
    return {
      'Fee Name': fee.fee_name,
      'Batch': fee.batch || 'All',
      'Section': fee.section || 'All',
      'Gender': fee.gender || 'All',
      'Amount': fee.amount,
      'Assigned Students': fee.assigned_count,
      'Paid Students': fee.paid_count,
      'Pending Students': fee.pending_count,
      'Status': fee.status,
      'Created Date': new Date(fee.created_at || Date.now()).toLocaleDateString(),
    };
  });

  const handleDelete = (fee: CustomFee) => {
    setFeeToDelete(fee);
  };

  const confirmDelete = async () => {
    if (!feeToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteCustomFee(feeToDelete.id);
      if (result.success) {
        setFeeToDelete(null);
        // Refresh data
        const resFees = await fetch(`/api/staff/custom-fees?batch=${batch}&section=${section}&gender=${gender}&component=${component}&status=${status}`);
        const dataFees = await resFees.json();
        setCustomFees(dataFees.fees || []);
      } else {
        setDeleteError(result.error || 'Failed to delete custom fee');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d]">Custom Fees Management</h1>
          <p className="text-gray-600">Define and assign custom fees to specific student groups.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-4">
            <DataFilterBar
              batches={batches}
              sections={['A', 'B']}
              currentBatch={batch}
              currentSection={section}
            />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Gender:</label>
              <select
                value={gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="relative group">
              <CreateFeeModal batches={batches} disabled={batch === 'all'} />
              {batch === 'all' && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Select a batch to create a custom fee.
                </div>
              )}
            </div>
          </div>
          <ExportExcelButton
            fetchUrl={`/api/staff/custom-fees/export?batch=${batch}&section=${section}&gender=${gender}&status=${status}&component=${component}`}
            filename={`custom-fees-detailed-${batch}-${section}`}
            sheetName="Student Details"
            disabled={filteredFees.length === 0}
          />
        </div>

        <FeeFilterBar
          currentComponent={component}
          currentStatus={status || ''}
          customFees={availableCustomFeeNames}
          mode="custom"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 font-semibold">Fee Name</th>
              <th className="px-6 py-4 font-semibold">Batch</th>
              <th className="px-6 py-4 font-semibold">Section</th>
              <th className="px-6 py-4 font-semibold">Gender</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Assigned</th>
              <th className="px-6 py-4 font-semibold">Paid</th>
              <th className="px-6 py-4 font-semibold">Pending</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-400 italic">Loading custom fees...</td>
              </tr>
            ) : filteredFees.length > 0 ? (
              filteredFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{fee.fee_name}</td>
                  <td className="px-6 py-4">{fee.batch || 'All'}</td>
                  <td className="px-6 py-4">{fee.section || 'All'}</td>
                  <td className="px-6 py-4">{fee.gender || 'All'}</td>
                  <td className="px-6 py-4">₹{fee.amount}</td>
                  <td className="px-6 py-4">{fee.assigned_count}</td>
                  <td className="px-6 py-4">{fee.paid_count}</td>
                  <td className="px-6 py-4">{fee.pending_count}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      fee.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      fee.status === 'NOT ASSIGNED' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                    }`}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(fee)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-400 italic">No custom fees found for the selected scope.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={!!feeToDelete}
        onClose={() => {
          setFeeToDelete(null);
          setDeleteError(null);
          setConfirmationText('');
        }}
        onConfirm={confirmDelete}
        title="Delete Custom Fee?"
        message={`Are you sure you want to delete ${feeToDelete?.fee_name}? This action cannot be undone and will remove assignments for all assigned students.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
        requiredValue={feeToDelete?.fee_name}
        confirmationValue={confirmationText}
        onConfirmationValueChange={setConfirmationText}
      />
    </div>
  );
}
