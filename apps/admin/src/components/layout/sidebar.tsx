'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  Users,
  ShoppingCart,
  FileText,
  HelpCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Gift,
  Award,
  Shield,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Competitions', href: '/dashboard/competitions', icon: Trophy },
  { name: 'Winners', href: '/dashboard/wins', icon: Award },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Free Entries', href: '/dashboard/free-entries', icon: Gift },
  { name: 'Pages', href: '/dashboard/pages', icon: FileText },
  { name: 'FAQ', href: '/dashboard/faq', icon: HelpCircle },
  { name: 'Email Templates', href: '/dashboard/email-templates', icon: Mail },
  { name: 'Audit Log', href: '/dashboard/audit', icon: Shield },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
      style={{
        background: 'var(--bg-deep)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="flex h-16 items-center justify-between px-4"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span
              className="text-xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #F0B90B 0%, #E8A000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              WinUCard
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
          style={{ color: 'var(--text-muted)' }}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300'
              )}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, #F0B90B 0%, #E8A000 100%)'
                  : 'transparent',
                color: isActive ? '#0c0f17' : 'var(--text-muted)',
                boxShadow: isActive ? '0 2px 8px rgba(240, 185, 11, 0.25)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: '1px solid var(--border-subtle)' }} className="p-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300"
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = '#EF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
