'use client';

import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info';
  isLoading?: boolean;
  confirmationValue?: string;
  onConfirmationValueChange?: (value: string) => void;
  requiredValue?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
  confirmationValue,
  onConfirmationValueChange,
  requiredValue,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const isConfirmed = requiredValue
    ? (confirmationValue ?? '').trim().toLowerCase() === requiredValue.trim().toLowerCase()
    : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
          {requiredValue && (
            <div className="space-y-2 pt-4">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Type <span className="text-gray-900 font-bold">{requiredValue}</span> to confirm
              </label>
              <input
                type="text"
                value={confirmationValue}
                onChange={(e) => onConfirmationValueChange?.(e.target.value)}
                placeholder={`Type ${requiredValue} here...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || !isConfirmed}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
