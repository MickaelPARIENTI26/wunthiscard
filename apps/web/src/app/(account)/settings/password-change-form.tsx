'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { changePassword } from './actions';

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

interface PasswordStrengthProps {
  password: string;
}

function PasswordStrengthIndicator({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: 'Enter a password' };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    if (checks.length) score++;
    if (checks.lowercase) score++;
    if (checks.uppercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    const labels: Record<number, string> = {
      0: 'Very weak',
      1: 'Weak',
      2: 'Fair',
      3: 'Good',
      4: 'Strong',
      5: 'Very strong',
    };

    return { score, label: labels[score], checks };
  }, [password]);

  const getColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-green-500';
    return 'bg-green-600';
  };

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              level <= strength.score ? getColor(strength.score) : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{strength.label}</p>

      {/* Requirements checklist */}
      {password && (
        <div className="mt-3 space-y-1 text-xs">
          <div className="flex items-center gap-2">
            {strength.checks?.length ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={strength.checks?.length ? 'text-green-600' : 'text-muted-foreground'}>
              At least 8 characters
            </span>
          </div>
          <div className="flex items-center gap-2">
            {strength.checks?.lowercase ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={strength.checks?.lowercase ? 'text-green-600' : 'text-muted-foreground'}>
              One lowercase letter
            </span>
          </div>
          <div className="flex items-center gap-2">
            {strength.checks?.uppercase ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={strength.checks?.uppercase ? 'text-green-600' : 'text-muted-foreground'}>
              One uppercase letter
            </span>
          </div>
          <div className="flex items-center gap-2">
            {strength.checks?.number ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={strength.checks?.number ? 'text-green-600' : 'text-muted-foreground'}>
              One number
            </span>
          </div>
          <div className="flex items-center gap-2">
            {strength.checks?.special ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={strength.checks?.special ? 'text-green-600' : 'text-muted-foreground'}>
              One special character (@$!%*?&)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface PasswordChangeFormProps {
  hasExistingPassword: boolean;
}

export function PasswordChangeForm({ hasExistingPassword }: PasswordChangeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (data: PasswordChangeFormData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        reset();
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Failed to change password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Change Password</CardTitle>
        </div>
        <CardDescription>
          {hasExistingPassword
            ? 'Update your password to keep your account secure'
            : 'Set a password for your account (currently using Google sign-in only)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Password */}
          {hasExistingPassword && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...register('currentPassword')}
                aria-invalid={!!errors.currentPassword}
              />
              {errors.currentPassword && (
                <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
              )}
            </div>
          )}

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              {...register('newPassword')}
              aria-invalid={!!errors.newPassword}
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
            <PasswordStrengthIndicator password={newPassword} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
