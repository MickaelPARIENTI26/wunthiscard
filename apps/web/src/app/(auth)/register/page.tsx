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
        <div className="h-11 rounded-xl" style={{ background: '#F5F5F7' }} />
        <div className="h-11 rounded-xl" style={{ background: '#F5F5F7' }} />
      </div>
      <div className="h-11 w-full rounded-xl" style={{ background: '#F5F5F7' }} />
      <div className="h-11 w-full rounded-xl" style={{ background: '#F5F5F7' }} />
      <div className="h-11 w-full rounded-xl" style={{ background: '#F5F5F7' }} />
      <div className="h-12 w-full rounded-xl" style={{ background: '#F5F5F7' }} />
    </div>
  );
}

export default function RegisterPage() {
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
          Create your account
        </h1>
        <p style={{ color: '#6b7088', fontSize: '14px' }}>
          Enter your details to get started
        </p>
      </div>

      {/* Form */}
      <Suspense fallback={<RegisterFormSkeleton />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
