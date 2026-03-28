'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: '⌂' },
  { label: 'Browse', href: '/browse', icon: '⊞' },
  { label: 'Bookings', href: '/bookings', icon: '📋' },
  { label: 'Chat', href: '/chat', icon: '✉' },
  { label: 'Profile', href: '/provider/dashboard', icon: '◉' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom"
    >
      <ul className="flex items-stretch h-16" role="list">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex flex-col items-center justify-center w-full h-full gap-0.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-800',
                ].join(' ')}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
