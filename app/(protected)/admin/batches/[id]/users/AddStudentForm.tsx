'use client';

import { useState } from 'react';
import { registerStudentInBatch } from '../../actions';
import PasswordInput from '@/components/ui/PasswordInput';

export default function AddStudentForm({ batchId }: { batchId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(formData: FormData) {
    setStatus('loading');
    setErrorMessage('');

    // Add batchId to formData since it's not an input field
    formData.append('batchId', batchId);

    const result = await registerStudentInBatch(formData);

    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'An unexpected error occurred. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center">
        <p className="font-semibold">Student account created successfully!</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-2 text-sm underline hover:text-green-800"
        >
          Add another student
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-[#1a365d] mb-4">Add New Student</h3>
      <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Full Name *</label>
          <input
            name="fullName"
            type="text"
            required
            placeholder="Enter full name"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Register Number *</label>
          <input
            name="registerNumber"
            type="text"
            required
            placeholder="e.g. 21AI001"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Email *</label>
          <input
            name="email"
            type="email"
            required
            placeholder="email@college.edu"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <PasswordInput
            label="Password *"
            name="password"
            required
            placeholder="••••••••"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Section *</label>
          <select
            name="section"
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">-- Select Section --</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-[#1a365d] text-white py-2 rounded-md font-semibold hover:bg-[#2a466d] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Creating...' : 'Create Student Account'}
          </button>
        </div>
        {status === 'error' && (
          <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
      </form>
    </div>
  );
}
