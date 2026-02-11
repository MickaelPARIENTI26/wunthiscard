'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Mail, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function EmailNotVerifiedContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResendVerification = async () => {
    if (!session?.user?.email) return;

    setIsResending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
      } else {
        setError(data.error || 'Failed to send verification email');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (resendSuccess) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center px-4 py-8">
        <Card className="w-full">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Check your inbox</CardTitle>
            <CardDescription>
              We&apos;ve sent a verification email to{' '}
              <span className="font-medium">{session?.user?.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p>Click the link in the email to verify your account.</p>
              <p className="mt-1">The link will expire in 24 hours.</p>
              <p className="mt-1">If you don&apos;t see the email, check your spam folder.</p>
            </div>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center px-4 py-8">
      <Card className="w-full">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
          <CardDescription>
            You need to verify your email address before you can purchase tickets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p>
              We sent a verification email to{' '}
              <span className="font-medium">{session?.user?.email}</span> when you registered.
            </p>
            <p className="mt-2">
              Click the link in that email to verify your account. If you can&apos;t find it, you can request a new one below.
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleResendVerification}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend verification email'
            )}
          </Button>

          <Link href={callbackUrl} className="block">
            <Button variant="outline" className="w-full">
              Go back
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
