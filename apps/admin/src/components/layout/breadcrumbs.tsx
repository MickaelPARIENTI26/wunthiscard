'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  competitions: 'Competitions',
  users: 'Users',
  orders: 'Orders',
  pages: 'Pages',
  faq: 'FAQ',
  settings: 'Settings',
  new: 'New',
  edit: 'Edit',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) {
    return null;
  }

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = routeLabels[segment] || segment;
    const isLast = index === segments.length - 1;

    return {
      href,
      label,
      isLast,
    };
  });

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground"
      >
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((crumb) => (
        <div key={crumb.href} className="flex items-center">
          <ChevronRight className="h-4 w-4" />
          {crumb.isLast ? (
            <span className="ml-1 font-medium text-foreground">
              {crumb.label}
            </span>
          ) : (
            <Link href={crumb.href} className="ml-1 hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
