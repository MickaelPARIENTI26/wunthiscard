import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your WinUCard account to enter competitions and win prizes.',
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold font-[family-name:var(--font-outfit)] text-gradient-gold">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-12 bg-muted rounded" />
        <div className="h-9 w-full bg-muted rounded-md" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 bg-muted rounded" />
        <div className="h-9 w-full bg-muted rounded-md" />
      </div>
      <div className="h-9 w-full bg-muted rounded-md" />
    </div>
  );
}
