'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

import { forgotPasswordSchema, type ForgotPasswordInput } from '@winucard/shared/validators';
import { requestPasswordReset } from './actions';

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

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await requestPasswordReset(data);

      if (!result.success) {
        setServerError(result.error || 'Failed to send reset email. Please try again.');
        return;
      }

      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div>
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="mx-auto mb-4 flex items-center justify-center"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(34, 197, 94, 0.1)',
            }}
          >
            <CheckCircle style={{ width: '28px', height: '28px', color: '#22C55E' }} />
          </div>
          <h1
            className="font-[family-name:var(--font-outfit)] mb-2"
            style={{
              fontSize: '29px',
              fontWeight: 700,
              color: '#1a1a2e',
            }}
          >
            Check your email
          </h1>
          <p style={{ color: '#6b7088', fontSize: '14px' }}>
            We&apos;ve sent a password reset link to{' '}
            <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{submittedEmail}</span>
          </p>
        </div>

        {/* Info Box */}
        <div
          className="flex items-start gap-3"
          style={{
            padding: '16px',
            background: '#F7F7FA',
            borderRadius: '12px',
            marginBottom: '24px',
          }}
        >
          <Mail style={{ width: '20px', height: '20px', color: '#6b7088', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14px', color: '#555' }}>
            <p>The link will expire in 1 hour.</p>
            <p style={{ marginTop: '4px' }}>
              If you don&apos;t see the email, check your spam folder.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setIsSuccess(false);
              setSubmittedEmail('');
            }}
            className="w-full transition-all duration-200"
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'transparent',
              border: '1.5px solid rgba(0, 0, 0, 0.12)',
              color: '#1a1a2e',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try a different email
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full transition-all duration-200"
            style={{
              padding: '14px',
              borderRadius: '12px',
              color: '#6b7088',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <h1
          className="font-[family-name:var(--font-outfit)] mb-2"
          style={{
            fontSize: '29px',
            fontWeight: 700,
            color: '#1a1a2e',
          }}
        >
          Reset your password
        </h1>
        <p style={{ color: '#6b7088', fontSize: '14px' }}>
          Enter your email address and we&apos;ll send you a link to reset your password
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
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
          <div className="space-y-2">
            <label
              htmlFor="email"
              style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}
            >
              Email
            </label>
            {(() => {
              const { onBlur: registerOnBlur, ...emailRegister } = register('email');
              return (
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLoading}
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

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full transition-all duration-200"
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: '#1a1a2e',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full transition-all duration-200"
          style={{
            padding: '14px',
            borderRadius: '12px',
            color: '#6b7088',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
