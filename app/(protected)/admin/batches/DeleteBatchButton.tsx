'use client';

import React, { useState } from 'react';
import { deleteBatch } from './actions';

interface DeleteBatchButtonProps {
  batchId: string;
  batchName: string;
}

export default function DeleteBatchButton({ batchId, batchName }: DeleteBatchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (typedName !== batchName) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('id', batchId);

    try {
      const result = await deleteBatch(formData);
      if (result.success) {
        setIsOpen(false);
        setTypedName('');
      } else {
        setError(result.error || 'Failed to delete batch');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-red-600 hover:underline text-sm font-medium"
      >
        Delete
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Delete Batch</h3>
              <p className="text-sm text-gray-600">
                This will permanently delete the batch <span className="font-bold text-gray-900">&quot;{batchName}&quot;</span> and remove its association from every student in it. This cannot be undone. Type <span className="font-bold text-gray-900">{batchName}</span> to confirm.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type batch name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              />
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setTypedName('');
                  setError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={typedName !== batchName || isSubmitting}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Batch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
