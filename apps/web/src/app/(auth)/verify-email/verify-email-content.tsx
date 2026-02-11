'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyEmail, resendVerificationEmail } from './actions';

type VerificationState = 'loading' | 'success' | 'error' | 'expired' | 'already_verified';

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerificationState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setState('error');
        setErrorMessage('No verification token provided.');
        return;
      }

      try {
        const result = await verifyEmail(token);

        if (result.success) {
          setState('success');
        } else if (result.code === 'ALREADY_VERIFIED') {
          setState('already_verified');
        } else if (result.code === 'EXPIRED') {
          setState('expired');
          if (result.email) {
            setEmail(result.email);
          }
        } else {
          setState('error');
          setErrorMessage(result.error || 'Verification failed.');
        }
      } catch {
        setState('error');
        setErrorMessage('An unexpected error occurred.');
      }
    }

    verify();
  }, [token]);

  const handleResendVerification = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        setResendSuccess(true);
      } else {
        setErrorMessage(result.error || 'Failed to resend verification email.');
      }
    } catch {
      setErrorMessage('Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  // Loading state
  if (state === 'loading') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Verifying your email...</p>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (state === 'success') {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Email verified</CardTitle>
          <CardDescription>
            Your email has been successfully verified. You can now sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="block">
            <Button className="w-full">Sign in</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Already verified state
  if (state === 'already_verified') {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <CheckCircle className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Already verified</CardTitle>
          <CardDescription>
            Your email has already been verified. You can sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="block">
            <Button className="w-full">Sign in</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Expired state with resend option
  if (state === 'expired') {
    if (resendSuccess) {
      return (
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Email sent</CardTitle>
            <CardDescription>
              A new verification email has been sent to <span className="font-medium">{email}</span>
              . Please check your inbox.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p>The link will expire in 24 hours.</p>
              <p className="mt-1">If you don&apos;t see the email, check your spam folder.</p>
            </div>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full">
                Back to login
              </Button>
            </Link>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <XCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Link expired</CardTitle>
          <CardDescription>
            This verification link has expired. Please request a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email ? (
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
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Please register again or contact support.
            </p>
          )}
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Back to login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Error state
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-2xl font-bold">Verification failed</CardTitle>
        <CardDescription>
          {errorMessage || 'We were unable to verify your email. The link may be invalid.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href="/register" className="block">
          <Button className="w-full">Create new account</Button>
        </Link>
        <Link href="/login" className="block">
          <Button variant="outline" className="w-full">
            Back to login
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
