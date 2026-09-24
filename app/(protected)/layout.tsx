import ProtectedLayoutClient from './layout-client';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayoutClient>
      {children}
    </ProtectedLayoutClient>
  );
}
