'use client';

import { useState } from 'react';
import { createBatch } from './actions';

export default function CreateBatchForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(formData: FormData) {
    setStatus('loading');
    setErrorMessage('');

    const result = await createBatch(formData);

    if (result.success) {
      setStatus('success');
      // We can't easily trigger a server-side revalidatePath from here,
      // but Next.js typically handles it if the action calls revalidatePath.
      // The user can manually refresh or we can use useRouter().refresh().
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'An unexpected error occurred. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center">
        <p className="font-semibold">Batch created successfully!</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-2 text-sm underline hover:text-green-800"
        >
          Create another batch
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Create New Batch</h3>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Batch Name *</label>
          <input
            name="name"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. 2021-2025"
            required
          />
        </div>
        <button type="submit" disabled={status === 'loading'} className="btn btn-primary w-full justify-center disabled:opacity-70 disabled:cursor-not-allowed">
          {status === 'loading' ? 'Creating...' : 'Create Batch'}
        </button>
        {status === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
      </form>
    </div>
  );
}
