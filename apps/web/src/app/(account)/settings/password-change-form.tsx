'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Loader2, Check, X } from 'lucide-react';
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

function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: 'Enter a password', checks: undefined };

    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    const score =
      (checks.length ? 1 : 0) +
      (checks.lowercase ? 1 : 0) +
      (checks.uppercase ? 1 : 0) +
      (checks.number ? 1 : 0) +
      (checks.special ? 1 : 0);

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

  const color = (score: number): string => {
    if (score <= 1) return 'var(--hot)';
    if (score <= 2) return '#ff8a3d';
    if (score <= 3) return 'var(--warn)';
    return 'var(--accent)';
  };

  const requirements = [
    { key: 'length' as const, label: 'At least 8 characters' },
    { key: 'lowercase' as const, label: 'One lowercase letter' },
    { key: 'uppercase' as const, label: 'One uppercase letter' },
    { key: 'number' as const, label: 'One number' },
    { key: 'special' as const, label: 'One special character (@$!%*?&)' },
  ];

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            style={{
              height: '6px',
              flex: 1,
              borderRadius: '3px',
              border: '1px solid var(--ink)',
              background: level <= strength.score ? color(strength.score) : 'var(--bg-2)',
              transition: 'background 0.15s',
            }}
          />
        ))}
      </div>
      <p
        style={{
          marginTop: '6px',
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          fontWeight: 700,
        }}
      >
        {strength.label}
      </p>

      {password && strength.checks && (
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          {requirements.map((r) => {
            const met = strength.checks?.[r.key];
            return (
              <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {met ? (
                  <Check className="h-3 w-3" style={{ color: 'var(--accent-2)' }} />
                ) : (
                  <X className="h-3 w-3" style={{ color: 'var(--ink-faint)' }} />
                )}
                <span style={{ color: met ? 'var(--accent-2)' : 'var(--ink-faint)' }}>
                  {r.label}
                </span>
              </div>
            );
          })}
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
    <div
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--ink)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        padding: '28px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          paddingBottom: '20px',
          marginBottom: '24px',
          borderBottom: '1.5px dashed var(--line-2)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '1.5px solid var(--ink)',
            borderRadius: '12px',
            background: 'var(--accent)',
            boxShadow: '3px 3px 0 var(--ink)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Lock className="h-5 w-5" style={{ color: 'var(--ink)' }} />
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Security
          </div>
          <h2
            style={{
              fontFamily: 'var(--display)',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}
          >
            Change password
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-dim)' }}>
            {hasExistingPassword
              ? 'Update your password to keep your account secure.'
              : 'Set a password for your account (currently Google sign-in only).'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '14px',
          }}
        >
          {hasExistingPassword && (
            <div className="field">
              <label className="field-label" htmlFor="currentPassword">
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                className={`input ${errors.currentPassword ? 'input-error' : ''}`}
                {...register('currentPassword')}
              />
              {errors.currentPassword && (
                <span className="field-error">{errors.currentPassword.message}</span>
              )}
            </div>
          )}

          <div className="field">
            <label className="field-label" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              className={`input ${errors.newPassword ? 'input-error' : ''}`}
              {...register('newPassword')}
            />
            {errors.newPassword && <span className="field-error">{errors.newPassword.message}</span>}
            <PasswordStrengthIndicator password={newPassword} />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword.message}</span>
            )}
          </div>
        </div>

        {message && (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 14px',
              background: message.type === 'success' ? 'var(--accent)' : 'var(--hot)',
              color: message.type === 'success' ? 'var(--ink)' : '#fff',
              border: '1.5px solid var(--ink)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {message.text}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '20px',
            paddingTop: '18px',
            borderTop: '1px dashed var(--line-2)',
          }}
        >
          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn ${isSubmitting ? 'btn-mute' : 'btn-primary'} btn-xl`}
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="h-4 w-4 animate-spin"
                  style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}
                />
                Saving...
              </>
            ) : (
              <>Change password →</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
