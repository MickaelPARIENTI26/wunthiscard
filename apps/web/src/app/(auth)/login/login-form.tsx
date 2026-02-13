'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema, type LoginInput } from '@winthiscard/shared/validators';
import { checkLoginRateLimit, logLoginSuccess, logLoginFailure, verifyLoginCaptcha } from './actions';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

// Check if Google OAuth is enabled via public env variable
const isGoogleOAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const error = searchParams.get('error');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Check rate limit first
      const rateLimitCheck = await checkLoginRateLimit();
      if (!rateLimitCheck.allowed) {
        setServerError(rateLimitCheck.error || 'Too many login attempts. Please try again later.');
        return;
      }

      // Verify captcha (if site key is configured)
      if (TURNSTILE_SITE_KEY && turnstileToken) {
        const captchaResult = await verifyLoginCaptcha(turnstileToken);
        if (!captchaResult.success) {
          setServerError(captchaResult.error || 'Captcha verification failed. Please try again.');
          turnstileRef.current?.reset();
          setTurnstileToken(null);
          return;
        }
      }

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Log the failed attempt
        await logLoginFailure(data.email, result.error);

        // Reset captcha on failure
        turnstileRef.current?.reset();
        setTurnstileToken(null);

        // Map custom errors from auth.ts
        if (result.error.includes('AccountBanned')) {
          setServerError('Your account has been suspended. Please contact support.');
        } else if (result.error.includes('AccountLocked')) {
          setServerError('Your account has been temporarily locked. Please try again later.');
        } else if (result.error.includes('OAuthAccountOnly')) {
          setServerError('This account uses Google Sign-In. Please click "Sign in with Google" below.');
        } else if (result.error.includes('TooManyRequests')) {
          setServerError('Too many login attempts. Please try again later.');
        } else if (result.error === 'CredentialsSignin') {
          setServerError('Invalid email or password. Please try again.');
        } else {
          setServerError(result.error);
        }
        return;
      }

      // Log successful login
      await logLoginSuccess(data.email);

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setServerError('Failed to sign in with Google. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string | null): string | null => {
    if (!errorCode) return null;
    switch (errorCode) {
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another sign-in method.';
      case 'OAuthAccountOnly':
        return 'This account uses Google Sign-In. Please click "Sign in with Google" below.';
      case 'EmailNotVerified':
        return 'Please verify your email before signing in.';
      case 'AccountLocked':
        return 'Your account has been temporarily locked. Please try again later.';
      case 'AccountBanned':
        return 'Your account has been suspended. Please contact support.';
      case 'TooManyRequests':
        return 'Too many login attempts. Please try again later.';
      default:
        return 'An error occurred during sign in. Please try again.';
    }
  };

  const displayError = serverError || getErrorMessage(error);

  return (
    <div className="space-y-6">
      {displayError && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading || isGoogleLoading}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isLoading || isGoogleLoading}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Cloudflare Turnstile - invisible mode */}
        {TURNSTILE_SITE_KEY && (
          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
            options={{
              size: 'invisible',
              theme: 'auto',
            }}
          />
        )}

        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      {isGoogleOAuthEnabled && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href={callbackUrl !== '/' ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/register'}
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
