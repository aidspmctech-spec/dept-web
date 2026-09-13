'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const studentLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Profile', path: '/student/profile' },
    { label: 'Academics', path: '/student/academics' },
    { label: 'Fees & Payments', path: '/student/fees' },
    { label: 'Achievements', path: '/student/achievements' },
    { label: 'Certifications', path: '/student/certifications' },
    { label: 'Activities', path: '/student/activities' },
  ];

  const staffLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Student Directory', path: '/staff/students' },
    { label: 'Fee Management', path: '/staff/fees' },
    { label: 'Academic Records', path: '/staff/academics' },
    { label: 'Payment Records', path: '/staff/payments' },
    { label: 'Achievements', path: '/staff/achievements' },
    { label: 'Certifications', path: '/staff/certifications' },
    { label: 'Activities', path: '/staff/activities' },
    { label: 'Batch Management', path: '/admin/batches' },
  ];

  const adminLinks = [
    { label: 'Audit Logs', path: '/admin/logs' },
  ];

  const links = role === 'STUDENT' ? studentLinks : (role === 'STAFF' ? [...staffLinks, ...adminLinks] : []);

  return (
    <aside className="w-64 bg-[#1a365d] text-white p-8 flex flex-col flex-shrink-0">
      <div className="text-xl font-bold mb-8 uppercase tracking-wider">IIDS Portal</div>
      <nav className="flex-grow">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.path}>
              <Link
                href={link.path}
                className={`block p-2 rounded transition-colors ${
                  isActive(link.path) ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <form action="/api/auth/logout" method="POST">
          <button className="w-full text-left p-2 rounded hover:bg-white/10">Logout</button>
        </form>
      </div>
    </aside>
  );
}
