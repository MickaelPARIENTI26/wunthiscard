'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

import { loginSchema, type LoginInput } from '@winucard/shared/validators';
import { checkLoginRateLimit, logLoginSuccess, logLoginFailure, verifyLoginCaptcha } from './actions';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

// Check if Google OAuth is enabled via public env variable
const isGoogleOAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true';

// Input style
const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '14px',
  background: '#F5F5F7',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  color: '#1a1a2e',
  outline: 'none',
  transition: 'all 0.2s ease',
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const error = searchParams.get('error');
  const t = useTranslations('auth');

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
        setServerError(t('tooManyAttempts'));
        return;
      }

      // Verify captcha (if site key is configured)
      if (TURNSTILE_SITE_KEY && turnstileToken) {
        const captchaResult = await verifyLoginCaptcha(turnstileToken);
        if (!captchaResult.success) {
          setServerError(t('captchaFailed'));
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
          setServerError(t('accountBanned'));
        } else if (result.error.includes('AccountLocked')) {
          setServerError(t('accountLocked'));
        } else if (result.error.includes('OAuthAccountOnly')) {
          setServerError(t('oauthAccountOnly'));
        } else if (result.error.includes('TooManyRequests')) {
          setServerError(t('tooManyAttempts'));
        } else if (result.error === 'CredentialsSignin') {
          setServerError(t('invalidCredentials'));
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
      setServerError(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setServerError(t('googleSignInError'));
      setIsGoogleLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string | null): string | null => {
    if (!errorCode) return null;
    switch (errorCode) {
      case 'OAuthAccountNotLinked':
        return t('oauthAccountNotLinked');
      case 'OAuthAccountOnly':
        return t('oauthAccountOnly');
      case 'EmailNotVerified':
        return t('emailNotVerifiedMessage');
      case 'AccountLocked':
        return t('accountLocked');
      case 'AccountBanned':
        return t('accountBanned');
      case 'TooManyRequests':
        return t('tooManyAttempts');
      default:
        return t('signInError');
    }
  };

  const displayError = serverError || getErrorMessage(error);

  return (
    <div className="space-y-6">
      {displayError && (
        <div
          style={{
            padding: '12px 16px',
            fontSize: '14px',
            color: '#DC2626',
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: '12px',
          }}
        >
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}
          >
            {t('email')}
          </label>
          {(() => {
            const { onBlur: registerOnBlur, ...emailRegister } = register('email');
            return (
              <input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                autoComplete="email"
                disabled={isLoading || isGoogleLoading}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#F0B90B';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240, 185, 11, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                  registerOnBlur(e);
                }}
                {...emailRegister}
              />
            );
          })()}
          {errors.email && (
            <p style={{ fontSize: '13px', color: '#DC2626' }}>{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}
            >
              {t('password')}
            </label>
            <Link
              href="/forgot-password"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#F0B90B',
              }}
            >
              {t('forgotPassword')}
            </Link>
          </div>
          {(() => {
            const { onBlur: registerOnBlur, ...passwordRegister } = register('password');
            return (
              <input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                autoComplete="current-password"
                disabled={isLoading || isGoogleLoading}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#F0B90B';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240, 185, 11, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                  registerOnBlur(e);
                }}
                {...passwordRegister}
              />
            );
          })()}
          {errors.password && (
            <p style={{ fontSize: '13px', color: '#DC2626' }}>{errors.password.message}</p>
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

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="flex items-center justify-center gap-2 w-full transition-all duration-200"
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: '#1a1a2e',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 600,
            cursor: isLoading || isGoogleLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading || isGoogleLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('signingIn')}
            </>
          ) : (
            t('signIn')
          )}
        </button>
      </form>

      {isGoogleOAuthEnabled && (
        <>
          {/* Separator */}
          <div className="relative">
            <div
              className="absolute inset-0 flex items-center"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              <span style={{ width: '100%', height: '1px', background: '#e0e0e4' }} />
            </div>
            <div className="relative flex justify-center">
              <span
                style={{
                  background: '#ffffff',
                  padding: '0 12px',
                  fontSize: '12px',
                  color: '#6b7088',
                  textTransform: 'uppercase',
                }}
              >
                or
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="flex items-center justify-center gap-2 w-full transition-all duration-200"
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'transparent',
              border: '1.5px solid rgba(0, 0, 0, 0.12)',
              color: '#1a1a2e',
              fontSize: '15px',
              fontWeight: 500,
              cursor: isLoading || isGoogleLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading || isGoogleLoading ? 0.7 : 1,
            }}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('connecting')}
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                {t('signInWithGoogle')}
              </>
            )}
          </button>
        </>
      )}

      <p className="text-center" style={{ fontSize: '14px', color: '#6b7088' }}>
        {t('noAccount')}{' '}
        <Link
          href={callbackUrl !== '/' ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/register'}
          style={{ fontWeight: 500, color: '#F0B90B' }}
        >
          {t('register')}
        </Link>
      </p>
    </div>
  );
}
