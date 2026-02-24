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
      {/* Header */}
      <div className="text-center mb-6">
        <h1
          className="font-[family-name:var(--font-outfit)] mb-2"
          style={{
            fontSize: '29px',
            fontWeight: 700,
            color: '#1a1a2e',
          }}
        >
          Welcome back
        </h1>
        <p style={{ color: '#6b7088', fontSize: '14px' }}>
          Sign in to your account to continue
        </p>
      </div>

      {/* Form */}
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
        <div className="h-4 w-12 rounded" style={{ background: '#F5F5F7' }} />
        <div className="h-11 w-full rounded-xl" style={{ background: '#F5F5F7' }} />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 rounded" style={{ background: '#F5F5F7' }} />
        <div className="h-11 w-full rounded-xl" style={{ background: '#F5F5F7' }} />
      </div>
      <div className="h-12 w-full rounded-xl" style={{ background: '#F5F5F7' }} />
    </div>
  );
}
