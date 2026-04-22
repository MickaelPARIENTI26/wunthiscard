import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your WinUCard account to enter competitions and win prizes.',
};

export default function LoginPage() {
  return (
    <div>
      <div className="text-center mb-7">
        <h1 style={{ fontFamily: 'var(--display)', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
          Welcome Back
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '14px' }}>
          Sign in to your account to continue
        </p>
      </div>

      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-12 rounded" style={{ background: 'var(--bg-2)' }} />
        <div className="h-11 w-full rounded-[10px]" style={{ background: 'var(--bg-2)' }} />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 rounded" style={{ background: 'var(--bg-2)' }} />
        <div className="h-11 w-full rounded-[10px]" style={{ background: 'var(--bg-2)' }} />
      </div>
      <div className="h-12 w-full rounded-[10px]" style={{ background: 'var(--bg-2)' }} />
    </div>
  );
}
