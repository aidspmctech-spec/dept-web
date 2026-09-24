'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface NavLinksProps {
  role: string;
  onLinkClick?: () => void;
}

export default function NavLinks({ role, onLinkClick }: NavLinksProps) {
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

  const links = role === 'STUDENT' ? studentLinks : (role === 'STAFF' ? staffLinks : []);

  return (
    <>
      <div className="text-xl font-bold mb-8 uppercase tracking-wider">AIDS Portal</div>
      <nav className="flex-grow">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.path}>
              <Link
                href={link.path}
                onClick={onLinkClick}
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
      <div className="mt-auto border-t border-white/20 pt-4">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg border border-red-300/60 px-4 py-3 text-left text-red-100 transition-colors hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </form>
      </div>
    </>
  );
}
