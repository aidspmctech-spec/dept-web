import { getUserRole } from '@/lib/auth';
import Sidebar from './components/Sidebar';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();

  return (
    <div className="flex h-screen overflow-hidden">
      {role && <Sidebar role={role} />}
      <main className="flex-1 bg-[#f7fafc] p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
