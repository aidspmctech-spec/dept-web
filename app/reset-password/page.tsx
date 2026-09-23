import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PasswordInput from '@/components/ui/PasswordInput';

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ message?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;

  const getMessageStyles = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'info':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'error':
      default:
        return 'bg-red-100 text-red-600 border-red-200';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
      <div className="login-card text-center">
        <div className="login-header mb-8">
          <h1 className="text-2xl font-bold text-[#1a365d] mb-2">Set New Password</h1>
          <p className="text-gray-500 text-sm">Please enter your new password below</p>
        </div>

        {searchParams.message && (
          <div className={`mb-4 p-3 rounded text-sm text-left border ${getMessageStyles(searchParams.status)}`}>
            {searchParams.message}
          </div>
        )}

        <form action="/api/auth/update-password" method="POST" className="text-left">
          <div className="form-group mb-4">
            <PasswordInput
              label="New Password *"
              name="password"
              className="form-input"
              placeholder="Enter your new password"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group mb-6">
            <PasswordInput
              label="Confirm New Password *"
              name="confirmPassword"
              className="form-input"
              placeholder="Re-enter your new password"
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
