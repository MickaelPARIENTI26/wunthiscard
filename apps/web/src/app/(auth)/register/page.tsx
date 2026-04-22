import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterForm } from './register-form';

export const metadata: Metadata = {
  title: 'Register',
  description:
    'Create a WinUCard account to enter competitions and win rare collectible cards and memorabilia.',
};

function RegisterFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div className="h-11 rounded-[10px]" style={{ background: 'var(--bg-2)' }} />
        <div className="h-11 rounded-[10px]" style={{ background: 'var(--bg-2)' }} />
      </div>
      <div className="h-11 w-full rounded-[10px]" style={{ background: 'var(--bg-2)' }} />
      <div className="h-11 w-full rounded-[10px]" style={{ background: 'var(--bg-2)' }} />
      <div className="h-11 w-full rounded-[10px]" style={{ background: 'var(--bg-2)' }} />
      <div className="h-12 w-full rounded-[10px]" style={{ background: 'var(--bg-2)' }} />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div>
      <div className="text-center mb-7">
        <h1 style={{ fontFamily: 'var(--display)', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
          Create Account
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '14px' }}>
          Join thousands of winners — takes 60 seconds
        </p>
      </div>

      <Suspense fallback={<RegisterFormSkeleton />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
