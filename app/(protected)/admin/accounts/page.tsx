import { requireRole } from '@/lib/auth';
import { batchRepository } from '@/lib/repositories/batchRepository';
import { createAccount } from './actions';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AdminAccountsPage() {
  const profile = await requireRole(['STAFF']);
  if (!profile) return redirect('/dashboard');

  const batches = await batchRepository.getAll();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-[#1a365d]">Create User Account</h1>
      <form
        action={async (formData) => {
          'use server';
          const result = await createAccount(formData);
          if (!result.success) console.error(result.error);
        }}
        className="grid gap-4 max-w-lg">
        <label className="block">
          <span className="text-gray-700">Account Type *</span>
          <select name="role" className="mt-1 block w-full" required defaultValue="STAFF">
            <option value="STAFF">Staff</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-700">Full Name *</span>
          <input name="name" type="text" className="mt-1 block w-full" required />
        </label>
        <label className="block">
          <span className="text-gray-700">College Email *</span>
          <input name="email" type="email" className="mt-1 block w-full" required />
        </label>
        {/* Staff/Admin optional fields */}
        <label className="block">
          <span className="text-gray-700">Phone (Staff/Admin optional)</span>
          <input name="phone" type="text" className="mt-1 block w-full" />
        </label>
        <label className="block">
          <span className="text-gray-700">Job Title / Role (Staff/Admin optional)</span>
          <input name="jobTitle" type="text" className="mt-1 block w-full" />
        </label>
        <button type="submit" className="btn btn-primary w-full justify-center mt-4">
          Create Account
        </button>
      </form>
      <div className="text-sm text-gray-600">
        <Link href="/admin/batches" className="text-blue-600 hover:underline">
          Manage Batches
        </Link>
      </div>
    </div>
  );
}
