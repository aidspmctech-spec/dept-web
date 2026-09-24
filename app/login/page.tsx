import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PasswordInput from '@/components/ui/PasswordInput';

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string }>;
}) {
  const searchParams = await props.searchParams;

  // We need to convert this to a Client Component if we want to use the stateful PasswordInput,
  // OR we can just keep the form as is and wrap the specific input.
  // Since PasswordInput is 'use client', it can be used inside this server component as long as the
  // surrounding form is handled by the server (which it is via /api/auth/login).

  // Use only authentication check to redirect already logged-in users.
  // Do NOT call getUserRole() or getCurrentProfile() here.
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
      <div className="login-card text-center">
        <div className="login-header mb-8">
          <h1 className="text-2xl font-bold text-[#1a365d] mb-2">AIDS Student Portal</h1>
          <p className="text-gray-500 text-sm">Please enter your credentials to continue</p>
        </div>

        {searchParams.message && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded text-sm">
            {searchParams.message}
          </div>
        )}

        <form action="/api/auth/login" method="POST" className="text-left">
          <div className="form-group mb-4">
            <label className="form-label">College Email</label>
            <input
              name="email"
              type="email"
              className="form-input"
              placeholder="Enter your college email"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group mb-6">
            <label className="form-label">Password</label>
            <PasswordInput
              name="password"
              className="form-input"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center">
            Login to Portal
          </button>
        </form>
      </div>
    </div>
  );
}
