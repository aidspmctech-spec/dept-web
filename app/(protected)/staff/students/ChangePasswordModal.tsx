'use client';

import React, { useState } from 'react';
import { changeStudentPassword } from './actions';
import PasswordInput from '@/components/ui/PasswordInput';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    name: string;
    register_number: string;
    id: string;
  };
}

export default function ChangePasswordModal({ isOpen, onClose, student }: ChangePasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await changeStudentPassword(student.id, password);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setPassword('');
          setConfirmPassword('');
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">Change Student Password</h3>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Target Student</p>
            <p className="text-sm font-medium text-blue-900">{student.name}</p>
            <p className="text-xs text-blue-700">{student.register_number}</p>
          </div>
        </div>

        {success ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 text-center font-medium">
            Student password changed successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
              required
            />

            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
              required
            />

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
