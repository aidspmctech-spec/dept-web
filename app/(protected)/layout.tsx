import { getUserRole } from '@/lib/auth';
import ProtectedLayoutClient from './layout-client';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();

  if (!role) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <ProtectedLayoutClient role={role}>
      {children}
    </ProtectedLayoutClient>
  );
}
