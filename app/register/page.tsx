import { batchRepository } from '@/lib/repositories/batchRepository';
import Link from 'next/link';
import RegistrationForm from './RegistrationForm';

export default async function RegisterPage() {
  const batches = await batchRepository.getAll();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7fafc] p-4">
      <div className="max-w-2xl w-full p-8 bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1a365d] mb-2">Create Student Account</h1>
          <p className="text-gray-600">Register your account to access the IIDS Portal</p>
        </div>

        <RegistrationForm batches={batches} />

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
