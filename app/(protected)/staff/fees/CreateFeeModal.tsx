'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomFee, getMatchingStudentsCount } from './actions';

interface CreateFeeModalProps {
  batches: { id: string; name: string }[];
  disabled?: boolean;
}

export default function CreateFeeModal({ batches, disabled }: CreateFeeModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    batchId: 'all',
    section: 'all',
    gender: 'all',
    description: '',
    dueDate: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setShowConfirmation(false);
    setStudentCount(null);
  };

  const checkMatchingStudents = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const data = new FormData();
      data.append('batchId', formData.batchId);
      data.append('section', formData.section);
      data.append('gender', formData.gender);

      const result = await getMatchingStudentsCount(data);
      setStudentCount(result.count);
      if (result.count === 0) {
        setError('No students match the selected batch, section, and gender.');
        setShowConfirmation(false);
      } else {
        setShowConfirmation(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));

      const result = await createCustomFee(data);
      if (result.success) {
        setSuccessMessage('Custom fee created successfully');
        setShowConfirmation(false);
        router.refresh();

        // Close the modal after a short delay to let the user see the success message
        setTimeout(() => {
          setIsOpen(false);
          setSuccessMessage(null);
        }, 2000);
      } else {
        setError(result.error || 'Failed to create fee');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="px-4 py-2 bg-[#1a365d] text-white rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Create Fee
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Create Custom Fee</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {!showConfirmation ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Book Fees"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee (₹) *</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
                    <select
                      name="batchId"
                      value={formData.batchId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Batches</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="md:col-span-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={checkMatchingStudents}
                    disabled={!formData.name || !formData.amount || isSubmitting}
                    className="px-6 py-2 bg-[#1a365d] text-white rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:bg-gray-300"
                  >
                    {isSubmitting ? 'Checking...' : 'Continue'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="text-lg font-bold text-blue-900 mb-2">Confirm Fee Creation</h4>
                  <p className="text-blue-800">
                    Create <span className="font-bold">{formData.name}</span> of <span className="font-bold">₹{formData.amount}</span> for <span className="font-bold">{studentCount} students</span> in {formData.batchId === 'all' ? 'All Batches' : batches.find(b => b.id === formData.batchId)?.name}, {formData.section === 'all' ? 'All Sections' : `Section ${formData.section}`}, {formData.gender === 'all' ? 'All Genders' : formData.gender}?
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300"
                  >
                    {isSubmitting ? 'Creating...' : 'Confirm & Create'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-md text-sm text-center">
                {successMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
