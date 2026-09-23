import { useState } from 'react';
import { registerStudent } from './actions';
import Link from 'next/link';
import PasswordInput from '@/components/ui/PasswordInput';

export default function RegistrationForm({ batches }: { batches: any[] }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(formData: FormData) {
    setStatus('loading');
    setErrorMessage('');

    const result = await registerStudent(formData);

    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'An unexpected error occurred. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
        <p className="text-gray-600 mb-6">
          A verification email has been sent to your address. Please verify your email before logging in.
        </p>
        <Link
          href="/login"
          className="btn btn-primary w-full justify-center py-3 rounded-lg font-semibold"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2 space-y-2">
        <label className="block text-sm font-medium text-gray-700">Full Name *</label>
        <input
          name="fullName"
          type="text"
          required
          placeholder="Enter your full name"
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Register Number *</label>
        <input
          name="registerNumber"
          type="text"
          required
          placeholder="e.g. 21AI001"
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">College Email *</label>
        <input
          name="email"
          type="email"
          required
          placeholder="email@college.edu"
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <PasswordInput
          label="Password *"
          name="password"
          required
          placeholder="••••••••"
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <PasswordInput
          label="Confirm Password *"
          name="confirmPassword"
          required
          placeholder="••••••••"
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Batch *</label>
        <select
          name="batchId"
          required
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="">-- Select Batch --</option>
          {batches?.map((batch: any) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Section *</label>
        <select
          name="section"
          required
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="">-- Select Section --</option>
          <option value="A">Section A</option>
          <option value="B">Section B</option>
        </select>
      </div>

      {status === 'error' && (
        <div className="md:col-span-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="md:col-span-2 btn btn-primary w-full justify-center py-3 rounded-lg font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}
