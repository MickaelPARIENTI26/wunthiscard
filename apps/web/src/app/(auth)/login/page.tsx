import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your WinUCard account to enter competitions and win prizes.',
};

export default async function LoginPage() {
  const t = await getTranslations('auth');

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <h1
          className="font-[family-name:var(--font-outfit)] mb-2"
          style={{
            fontSize: '29px',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {t('loginTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {t('loginSubtitle')}
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
