'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Loader2, Check, X } from 'lucide-react';
import { z } from 'zod';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

import { registerUser } from './actions';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

// Full register form schema (registerSchema has refinements so we can't use .extend())
const registerFormSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => {
  const today = new Date();
  const birthDate = new Date(data.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18;
}, {
  message: 'You must be at least 18 years old to register',
  path: ['dateOfBirth'],
});

type RegisterFormInput = z.infer<typeof registerFormSchema>;

interface PasswordRequirement {
  label: string;
  met: boolean;
}

function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /\d/.test(password) },
    { label: 'One special character (@$!%*?&)', met: /[@$!%*?&]/.test(password) },
  ];
}

function getPasswordStrength(requirements: PasswordRequirement[]): number {
  const met = requirements.filter((r) => r.met).length;
  return (met / requirements.length) * 100;
}

function getPasswordStrengthLabel(strength: number): string {
  if (strength === 0) return '';
  if (strength < 40) return 'Weak';
  if (strength < 60) return 'Fair';
  if (strength < 80) return 'Good';
  if (strength < 100) return 'Strong';
  return 'Excellent';
}

function getPasswordStrengthColor(strength: number): string {
  if (strength < 40) return '#DC2626';
  if (strength < 60) return '#F97316';
  if (strength < 80) return '#EAB308';
  return '#22C55E';
}

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

// Focus/blur handlers for input styling
const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#F0B90B';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240, 185, 11, 0.1)';
};

const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
  e.currentTarget.style.boxShadow = 'none';
};

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      acceptTerms: undefined,
    },
  });

  const password = watch('password', '');
  const passwordRequirements = useMemo(() => getPasswordRequirements(password), [password]);
  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordRequirements),
    [passwordRequirements]
  );

  const onSubmit = async (data: RegisterFormInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        dateOfBirth: new Date(data.dateOfBirth),
        turnstileToken: turnstileToken ?? undefined,
      });

      if (!result.success) {
        setServerError(result.error || 'Registration failed. Please try again.');
        // Reset captcha on failure
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }

      // Auto-login after successful registration
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // If auto-login fails, redirect to login page
        router.push('/login?registered=true&callbackUrl=' + encodeURIComponent(callbackUrl));
        return;
      }

      // Redirect to callback URL or home
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

  const handleTermsChange = (checked: boolean) => {
    setAcceptTerms(checked);
    setValue('acceptTerms', checked ? true : (undefined as unknown as true), {
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-5">
      {serverError && (
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
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="firstName"
              style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}
            >
              First name
            </label>
            {(() => {
              const { onBlur: registerOnBlur, ...rest } = register('firstName');
              return (
                <input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  autoComplete="given-name"
                  disabled={isLoading || isGoogleLoading}
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={(e) => { handleInputBlur(e); registerOnBlur(e); }}
                  {...rest}
                />
              );
            })()}
            {errors.firstName && (
              <p style={{ fontSize: '12px', color: '#DC2626' }}>{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="lastName"
              style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}
            >
              Last name
            </label>
            {(() => {
              const { onBlur: registerOnBlur, ...rest } = register('lastName');
              return (
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  autoComplete="family-name"
                  disabled={isLoading || isGoogleLoading}
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={(e) => { handleInputBlur(e); registerOnBlur(e); }}
                  {...rest}
                />
              );
            })()}
            {errors.lastName && (
              <p style={{ fontSize: '12px', color: '#DC2626' }}>{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}
          >
            Email
          </label>
          {(() => {
            const { onBlur: registerOnBlur, ...rest } = register('email');
            return (
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isLoading || isGoogleLoading}
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={(e) => { handleInputBlur(e); registerOnBlur(e); }}
                {...rest}
              />
            );
          })()}
          {errors.email && (
            <p style={{ fontSize: '12px', color: '#DC2626' }}>{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}
          >
            Password
          </label>
          {(() => {
            const { onBlur: registerOnBlur, ...rest } = register('password');
            return (
              <input
                id="password"
                type="password"
                placeholder="Create a secure password"
                autoComplete="new-password"
                disabled={isLoading || isGoogleLoading}
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={(e) => { handleInputBlur(e); registerOnBlur(e); }}
                {...rest}
              />
            );
          })()}

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between" style={{ fontSize: '12px' }}>
                <span style={{ color: '#6b7088' }}>Password strength</span>
                <span style={{ color: getPasswordStrengthColor(passwordStrength), fontWeight: 500 }}>
                  {getPasswordStrengthLabel(passwordStrength)}
                </span>
              </div>
              <div
                style={{
                  height: '4px',
                  borderRadius: '2px',
                  background: '#e8e8ec',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${passwordStrength}%`,
                    background: getPasswordStrengthColor(passwordStrength),
                    transition: 'all 0.3s ease',
                  }}
                />
              </div>

              {/* Requirements Checklist */}
              <ul className="space-y-1" style={{ fontSize: '12px' }}>
                {passwordRequirements.map((req) => (
                  <li
                    key={req.label}
                    className="flex items-center gap-1.5"
                    style={{ color: req.met ? '#22C55E' : '#6b7088' }}
                  >
                    {req.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {req.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {errors.password && (
            <p style={{ fontSize: '12px', color: '#DC2626' }}>{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}
          >
            Confirm Password
          </label>
          {(() => {
            const { onBlur: registerOnBlur, ...rest } = register('confirmPassword');
            return (
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={isLoading || isGoogleLoading}
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={(e) => { handleInputBlur(e); registerOnBlur(e); }}
                {...rest}
              />
            );
          })()}
          {errors.confirmPassword && (
            <p style={{ fontSize: '12px', color: '#DC2626' }}>{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="dateOfBirth"
            style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}
          >
            Date of Birth
          </label>
          {(() => {
            const { onBlur: registerOnBlur, ...rest } = register('dateOfBirth');
            return (
              <input
                id="dateOfBirth"
                type="date"
                autoComplete="bday"
                disabled={isLoading || isGoogleLoading}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={(e) => { handleInputBlur(e); registerOnBlur(e); }}
                {...rest}
              />
            );
          })()}
          <p style={{ fontSize: '12px', color: '#6b7088' }}>You must be at least 18 years old</p>
          {errors.dateOfBirth && (
            <p style={{ fontSize: '12px', color: '#DC2626' }}>{errors.dateOfBirth.message}</p>
          )}
        </div>

        {/* Terms Acceptance */}
        <div className="space-y-1.5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => handleTermsChange(e.target.checked)}
              disabled={isLoading || isGoogleLoading}
              style={{
                width: '18px',
                height: '18px',
                marginTop: '2px',
                accentColor: '#F0B90B',
              }}
            />
            <span style={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
              I agree to the{' '}
              <Link
                href="/terms"
                style={{ color: '#F0B90B', fontWeight: 500 }}
                target="_blank"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                style={{ color: '#F0B90B', fontWeight: 500 }}
                target="_blank"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p style={{ fontSize: '12px', color: '#DC2626' }}>{errors.acceptTerms.message}</p>
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
              Creating account...
            </>
          ) : (
            'Create account'
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
                Connecting...
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
                Sign up with Google
              </>
            )}
          </button>
        </>
      )}

      <p className="text-center" style={{ fontSize: '14px', color: '#6b7088' }}>
        Already have an account?{' '}
        <Link
          href={callbackUrl !== '/' ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login'}
          style={{ fontWeight: 500, color: '#F0B90B' }}
        >
          Login
        </Link>
      </p>
    </div>
  );
}
