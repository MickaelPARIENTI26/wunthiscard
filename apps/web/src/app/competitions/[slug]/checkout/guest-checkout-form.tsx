'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { calculateBonusTickets } from '@winucard/shared/utils';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', phoneCode: '+44', flag: '🇬🇧' },
  { code: 'IE', name: 'Ireland', phoneCode: '+353', flag: '🇮🇪' },
  { code: 'FR', name: 'France', phoneCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', phoneCode: '+49', flag: '🇩🇪' },
  { code: 'ES', name: 'Spain', phoneCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', phoneCode: '+39', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', phoneCode: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', phoneCode: '+32', flag: '🇧🇪' },
  { code: 'PT', name: 'Portugal', phoneCode: '+351', flag: '🇵🇹' },
  { code: 'AT', name: 'Austria', phoneCode: '+43', flag: '🇦🇹' },
  { code: 'CH', name: 'Switzerland', phoneCode: '+41', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', phoneCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', phoneCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', phoneCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', phoneCode: '+358', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', phoneCode: '+48', flag: '🇵🇱' },
  { code: 'US', name: 'United States', phoneCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', phoneCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', phoneCode: '+61', flag: '🇦🇺' },
];

const guestCheckoutSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50).trim(),
    lastName: z.string().min(1, 'Last name is required').max(50).trim(),
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    country: z.string().min(1, 'Country is required'),
    postcode: z.string().min(1, 'Postcode is required').max(20).trim(),
    address: z.string().min(1, 'Address is required').max(200).trim(),
    city: z.string().min(1, 'Town/City is required').max(100).trim(),
    phone: z.string().min(6, 'Phone number is required').max(20).trim(),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: 'You must accept the terms and confirm you are 18+',
    }),
    acceptMarketing: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type GuestCheckoutInput = z.infer<typeof guestCheckoutSchema>;

interface GuestCheckoutFormProps {
  competitionId: string;
  competitionSlug: string;
  competitionTitle: string;
  mainImageUrl: string;
  ticketPrice: number;
  ticketCount: number;
}

export function GuestCheckoutForm({
  competitionId,
  competitionSlug,
  ticketPrice,
  ticketCount: initialTicketCount,
}: GuestCheckoutFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('GB');
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState('GB');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState(initialTicketCount);
  const [qcmPassed, setQcmPassed] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  useEffect(() => {
    const pendingQuantityStored = sessionStorage.getItem(`pending_quantity_${competitionId}`);
    const qcmPassedStored = sessionStorage.getItem(`qcm_passed_${competitionId}`);

    if (qcmPassedStored === 'true') {
      setQcmPassed(true);
    } else {
      router.push(`/competitions/${competitionSlug}/question`);
      return;
    }

    if (pendingQuantityStored) {
      try {
        const pending = JSON.parse(pendingQuantityStored);
        if (pending.quantity && pending.quantity > 0) {
          setTicketCount(pending.quantity);
        }
      } catch {
        /* ignore */
      }
    }

    setIsInitializing(false);
  }, [competitionId, competitionSlug, router]);

  const bonusTickets = calculateBonusTickets(ticketCount);
  const totalEntries = ticketCount + bonusTickets;
  const totalPrice = ticketCount * ticketPrice;
  const totalPriceLabel = (totalPrice / 100).toFixed(2);

  const selectedPhoneCountryData = COUNTRIES.find((c) => c.code === selectedPhoneCountry);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GuestCheckoutInput>({
    resolver: zodResolver(guestCheckoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      country: 'GB',
      postcode: '',
      address: '',
      city: '',
      phone: '',
      acceptTerms: false,
      acceptMarketing: true,
    },
  });

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setValue('country', value);
  };

  const handleTermsChange = (checked: boolean) => {
    setAcceptTerms(checked);
    setValue('acceptTerms', checked, { shouldValidate: true });
  };

  const handleMarketingChange = (checked: boolean) => {
    setAcceptMarketing(checked);
    setValue('acceptMarketing', checked);
  };

  const onSubmit = async (data: GuestCheckoutInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const registerResponse = await fetch('/api/auth/register-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, turnstileToken, competitionId }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        setServerError(registerData.error ?? 'Registration failed. Please try again.');
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setIsLoading(false);
        return;
      }

      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setServerError('Login failed after registration. Please try logging in manually.');
        setIsLoading(false);
        return;
      }

      const reserveResponse = await fetch('/api/tickets/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId, quantity: ticketCount }),
      });

      const reserveData = await reserveResponse.json();

      if (!reserveResponse.ok) {
        setServerError(reserveData.error ?? 'Failed to reserve tickets. Please try again.');
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem(
        `tickets_${competitionId}`,
        JSON.stringify(reserveData.ticketNumbers),
      );
      sessionStorage.setItem(
        `reservation_${competitionId}`,
        JSON.stringify({
          ticketNumbers: reserveData.ticketNumbers,
          expiresAt: reserveData.expiresAt,
        }),
      );

      const checkoutResponse = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          ticketNumbers: reserveData.ticketNumbers,
        }),
      });

      const checkoutData = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        setServerError(checkoutData.error ?? 'Failed to create checkout session');
        setIsLoading(false);
        return;
      }

      if (checkoutData.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl;
      } else {
        setServerError('Failed to get checkout URL');
        setIsLoading(false);
      }
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!qcmPassed) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', background: 'var(--surface)', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ fontFamily: 'var(--display)', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
          Question Not Answered
        </h3>
        <p style={{ color: 'var(--ink-dim)', fontSize: '14px', marginBottom: '20px' }}>
          You need to answer the skill question before checkout.
        </p>
        <button
          onClick={() => router.push(`/competitions/${competitionSlug}/question`)}
          className="btn btn-primary btn-xl"
        >
          Answer Question →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Login hint */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            fontWeight: 700,
          }}
        >
          Create account · pay · win
        </span>
        <span style={{ fontSize: '13px', color: 'var(--ink-dim)' }}>
          Already have an account?{' '}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/competitions/${competitionSlug}/checkout`)}`}
            style={{ fontWeight: 700, color: 'var(--ink)', textDecoration: 'underline' }}
          >
            Log in
          </Link>
        </span>
      </div>

      {serverError && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '18px',
            background: 'var(--hot)',
            color: '#fff',
            border: '1.5px solid var(--ink)',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {serverError}
        </div>
      )}

      {/* Billing grid */}
      <div className="billing-grid">
        <div className="field">
          <label className="field-label" htmlFor="firstName">First name</label>
          <input
            id="firstName"
            className={`input ${errors.firstName ? 'input-error' : ''}`}
            autoComplete="given-name"
            disabled={isLoading}
            {...register('firstName')}
          />
          {errors.firstName && <span className="field-error">{errors.firstName.message}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="lastName">Last name</label>
          <input
            id="lastName"
            className={`input ${errors.lastName ? 'input-error' : ''}`}
            autoComplete="family-name"
            disabled={isLoading}
            {...register('lastName')}
          />
          {errors.lastName && <span className="field-error">{errors.lastName.message}</span>}
        </div>

        <div className="field billing-full">
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="you@domain.com"
            autoComplete="email"
            disabled={isLoading}
            {...register('email')}
          />
          <span className="field-hint">A confirmation email will be sent after checkout.</span>
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="phone">Phone</label>
          <div className="phone-row">
            <select
              aria-label="Phone country code"
              className="phone-cc phone-cc-select"
              value={selectedPhoneCountry}
              onChange={(e) => setSelectedPhoneCountry(e.target.value)}
              disabled={isLoading}
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.phoneCode}
                </option>
              ))}
            </select>
            <input
              id="phone"
              type="tel"
              className={`input ${errors.phone ? 'input-error' : ''}`}
              autoComplete="tel"
              disabled={isLoading}
              placeholder={selectedPhoneCountryData?.phoneCode ?? ''}
              {...register('phone')}
            />
          </div>
          {errors.phone && <span className="field-error">{errors.phone.message}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="country">Country</label>
          <select
            id="country"
            className="select"
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={isLoading}
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.country && <span className="field-error">{errors.country.message}</span>}
        </div>

        <div className="field billing-full">
          <label className="field-label" htmlFor="address">Address</label>
          <input
            id="address"
            className={`input ${errors.address ? 'input-error' : ''}`}
            placeholder="Flat / house · street"
            autoComplete="street-address"
            disabled={isLoading}
            {...register('address')}
          />
          {errors.address && <span className="field-error">{errors.address.message}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="city">City</label>
          <input
            id="city"
            className={`input ${errors.city ? 'input-error' : ''}`}
            autoComplete="address-level2"
            disabled={isLoading}
            {...register('city')}
          />
          {errors.city && <span className="field-error">{errors.city.message}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="postcode">Postcode</label>
          <input
            id="postcode"
            className={`input ${errors.postcode ? 'input-error' : ''}`}
            autoComplete="postal-code"
            disabled={isLoading}
            {...register('postcode')}
          />
          {errors.postcode && <span className="field-error">{errors.postcode.message}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className={`input ${errors.password ? 'input-error' : ''}`}
            placeholder="Create a password"
            autoComplete="new-password"
            disabled={isLoading}
            {...register('password')}
          />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
            placeholder="Confirm password"
            autoComplete="new-password"
            disabled={isLoading}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <span className="field-error">{errors.confirmPassword.message}</span>
          )}
        </div>
      </div>

      {/* Checkboxes */}
      <div className="billing-checks">
        <label className="check-row">
          <input
            type="checkbox"
            className="checkbox"
            checked={acceptTerms}
            onChange={(e) => handleTermsChange(e.target.checked)}
            disabled={isLoading}
          />
          <span>
            I confirm I am at least <b>18 years old</b> and agree to the{' '}
            <Link href="/terms" target="_blank">terms</Link> and{' '}
            <Link href="/competition-rules" target="_blank">competition rules</Link>, including the
            non-refundable ticket policy.
          </span>
        </label>
        {errors.acceptTerms && <span className="field-error">{errors.acceptTerms.message}</span>}

        <label className="check-row">
          <input
            type="checkbox"
            className="checkbox"
            checked={acceptMarketing}
            onChange={(e) => handleMarketingChange(e.target.checked)}
            disabled={isLoading}
          />
          <span>Email me draw updates and new drops.</span>
        </label>
      </div>

      {/* Bonus banner above pay panel */}
      {bonusTickets > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            marginTop: '18px',
            background: 'var(--accent)',
            border: '1.5px solid var(--ink)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-sm)',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            fontWeight: 700,
          }}
        >
          🎁 +{bonusTickets} bonus tickets · {totalEntries} total entries
        </div>
      )}

      {/* Pay panel */}
      <div className="enter-pay-panel">
        <div className="enter-pay-total">
          <span>Total</span>
          <b>£{totalPriceLabel}</b>
        </div>
        <div className="enter-pay-chips">
          <span>🔒 Pay with</span>
          <span className="pay-chip">Card</span>
        </div>
      </div>

      {TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={setTurnstileToken}
          onError={() => setTurnstileToken(null)}
          onExpire={() => setTurnstileToken(null)}
          options={{ size: 'invisible', theme: 'auto' }}
        />
      )}

      {/* Foot */}
      <div className="enter-step-foot">
        <span className="skill-hint">You&apos;ll receive confirmation by email immediately.</span>
        <button
          type="submit"
          disabled={isLoading}
          className={`btn ${isLoading ? 'btn-mute' : 'btn-hot'} btn-xl`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }} />
              Processing...
            </>
          ) : (
            <>Complete entry · £{totalPriceLabel} →</>
          )}
        </button>
      </div>
    </form>
  );
}
