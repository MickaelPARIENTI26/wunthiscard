'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Check, X } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { passwordSchema } from '@winucard/shared/validators';
import { resetPassword, validateResetToken } from './actions';

const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;

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
  if (strength < 40) return 'bg-destructive';
  if (strength < 60) return 'bg-orange-500';
  if (strength < 80) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password', '');
  const passwordRequirements = useMemo(() => getPasswordRequirements(password), [password]);
  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordRequirements),
    [passwordRequirements]
  );

  // Validate token on mount
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setIsValidating(false);
        setIsTokenValid(false);
        return;
      }

      try {
        const result = await validateResetToken(token);
        setIsTokenValid(result.valid);
      } catch {
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    }

    checkToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormInput) => {
    if (!token) return;

    setIsLoading(true);
    setServerError(null);

    try {
      const result = await resetPassword({
        token,
        password: data.password,
      });

      if (!result.success) {
        setServerError(result.error || 'Failed to reset password. Please try again.');
        return;
      }

      setIsSuccess(true);
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Invalid or missing token
  if (!token || !isTokenValid) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Invalid or expired link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired. Please request a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="block">
            <Button className="w-full">Request new reset link</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Password reset successful</CardTitle>
          <CardDescription>
            Your password has been reset. You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {serverError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a secure password"
                autoComplete="new-password"
                disabled={isLoading}
                {...register('password')}
              />

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength</span>
                    <span
                      className={
                        passwordStrength < 60
                          ? 'text-destructive'
                          : passwordStrength < 100
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }
                    >
                      {getPasswordStrengthLabel(passwordStrength)}
                    </span>
                  </div>
                  <Progress
                    value={passwordStrength}
                    className="h-1.5"
                    indicatorClassName={getPasswordStrengthColor(passwordStrength)}
                  />

                  {/* Requirements Checklist */}
                  <ul className="space-y-1 text-xs">
                    {passwordRequirements.map((req) => (
                      <li
                        key={req.label}
                        className={`flex items-center gap-1.5 ${
                          req.met ? 'text-green-600' : 'text-muted-foreground'
                        }`}
                      >
                        {req.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {req.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                autoComplete="new-password"
                disabled={isLoading}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset password'
              )}
            </Button>
          </form>

          <Link href="/login" className="block">
            <Button type="button" variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
