'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { z } from 'zod';
import { Loader2, Gift, ArrowRight, ChevronDown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPrice, calculateBonusTickets } from '@winucard/shared/utils';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

// Countries list (UK first, then alphabetical)
const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', phoneCode: '+44' },
  { code: 'IE', name: 'Ireland', phoneCode: '+353' },
  { code: 'FR', name: 'France', phoneCode: '+33' },
  { code: 'DE', name: 'Germany', phoneCode: '+49' },
  { code: 'ES', name: 'Spain', phoneCode: '+34' },
  { code: 'IT', name: 'Italy', phoneCode: '+39' },
  { code: 'NL', name: 'Netherlands', phoneCode: '+31' },
  { code: 'BE', name: 'Belgium', phoneCode: '+32' },
  { code: 'PT', name: 'Portugal', phoneCode: '+351' },
  { code: 'AT', name: 'Austria', phoneCode: '+43' },
  { code: 'CH', name: 'Switzerland', phoneCode: '+41' },
  { code: 'SE', name: 'Sweden', phoneCode: '+46' },
  { code: 'NO', name: 'Norway', phoneCode: '+47' },
  { code: 'DK', name: 'Denmark', phoneCode: '+45' },
  { code: 'FI', name: 'Finland', phoneCode: '+358' },
  { code: 'PL', name: 'Poland', phoneCode: '+48' },
  { code: 'US', name: 'United States', phoneCode: '+1' },
  { code: 'CA', name: 'Canada', phoneCode: '+1' },
  { code: 'AU', name: 'Australia', phoneCode: '+61' },
];

// Form validation schema
const guestCheckoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  country: z.string().min(1, 'Country is required'),
  postcode: z.string().min(1, 'Postcode is required').max(20).trim(),
  address: z.string().min(1, 'Address is required').max(200).trim(),
  city: z.string().min(1, 'Town/City is required').max(100).trim(),
  phone: z.string().min(6, 'Phone number is required').max(20).trim(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and confirm you are 18+' }),
  }),
  acceptMarketing: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
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
  competitionTitle,
  mainImageUrl,
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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState(initialTicketCount);
  const [qcmPassed, setQcmPassed] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Load ticket count and QCM status from sessionStorage
  useEffect(() => {
    const pendingQuantityStored = sessionStorage.getItem(`pending_quantity_${competitionId}`);
    const qcmPassedStored = sessionStorage.getItem(`qcm_passed_${competitionId}`);

    // Check if QCM was passed
    if (qcmPassedStored === 'true') {
      setQcmPassed(true);
    } else {
      // QCM not passed, redirect to question page
      router.push(`/competitions/${competitionSlug}/question`);
      return;
    }

    // Check for pending quantity
    if (pendingQuantityStored) {
      try {
        const pending = JSON.parse(pendingQuantityStored);
        if (pending.quantity && pending.quantity > 0) {
          setTicketCount(pending.quantity);
        }
      } catch {
        // Invalid data, use default
      }
    }

    setIsInitializing(false);
  }, [competitionId, competitionSlug, router]);

  const bonusTickets = calculateBonusTickets(ticketCount);
  const totalEntries = ticketCount + bonusTickets;
  const totalPrice = ticketCount * ticketPrice;

  const selectedCountryData = COUNTRIES.find(c => c.code === selectedCountry);

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
      acceptTerms: undefined,
      acceptMarketing: true,
    },
  });

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setValue('country', value);
  };

  const handleTermsChange = (checked: boolean) => {
    setAcceptTerms(checked);
    setValue('acceptTerms', checked ? true : (undefined as unknown as true), {
      shouldValidate: true,
    });
  };

  const handleMarketingChange = (checked: boolean) => {
    setAcceptMarketing(checked);
    setValue('acceptMarketing', checked);
  };

  const onSubmit = async (data: GuestCheckoutInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Step 1: Register the user
      const registerResponse = await fetch('/api/auth/register-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          turnstileToken,
          competitionId,
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        setServerError(registerData.error || 'Registration failed. Please try again.');
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setIsLoading(false);
        return;
      }

      // Step 2: Auto-login
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

      // Step 3: Reserve tickets (now that user is authenticated)
      const reserveResponse = await fetch('/api/tickets/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          quantity: ticketCount,
        }),
      });

      const reserveData = await reserveResponse.json();

      if (!reserveResponse.ok) {
        setServerError(reserveData.error || 'Failed to reserve tickets. Please try again.');
        setIsLoading(false);
        return;
      }

      // Store reservation in sessionStorage
      sessionStorage.setItem(`tickets_${competitionId}`, JSON.stringify(reserveData.ticketNumbers));
      sessionStorage.setItem(`reservation_${competitionId}`, JSON.stringify({
        ticketNumbers: reserveData.ticketNumbers,
        expiresAt: reserveData.expiresAt,
      }));

      // Step 4: Create checkout session
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
        setServerError(checkoutData.error || 'Failed to create checkout session');
        setIsLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
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

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show error if QCM not passed (should redirect, but fallback)
  if (!qcmPassed) {
    return (
      <Card className="border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Question Not Answered</CardTitle>
          <CardDescription>
            You need to answer the skill question before checkout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => router.push(`/competitions/${competitionSlug}/question`)}
          >
            Answer Question
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
      {/* Left Column - Billing Form */}
      <div className="w-full lg:flex-1">
        {/* Header with Login Link */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h1 className="text-xl font-bold tracking-tight">BILLING INFORMATION</h1>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/competitions/${competitionSlug}/checkout`)}`}
              className="font-medium text-primary hover:underline"
            >
              Connect now
            </Link>
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">FIRST NAME</Label>
              <Input
                id="firstName"
                placeholder=""
                autoComplete="given-name"
                disabled={isLoading}
                className={`h-11 ${errors.firstName ? 'border-destructive' : ''}`}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">LAST NAME</Label>
              <Input
                id="lastName"
                placeholder=""
                autoComplete="family-name"
                disabled={isLoading}
                className={`h-11 ${errors.lastName ? 'border-destructive' : ''}`}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Country & Postcode Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">COUNTRY/REGION</Label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger className={`h-11 ${errors.country ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-xs text-destructive">{errors.country.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="postcode">ZIP CODE</Label>
              <Input
                id="postcode"
                placeholder=""
                autoComplete="postal-code"
                disabled={isLoading}
                className={`h-11 ${errors.postcode ? 'border-destructive' : ''}`}
                {...register('postcode')}
              />
              {errors.postcode && (
                <p className="text-xs text-destructive">{errors.postcode.message}</p>
              )}
            </div>
          </div>

          {/* Address & City Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">ADDRESS</Label>
              <Input
                id="address"
                placeholder="house number & street name"
                autoComplete="street-address"
                disabled={isLoading}
                className={`h-11 ${errors.address ? 'border-destructive' : ''}`}
                {...register('address')}
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">TOWN/CITY</Label>
              <Input
                id="city"
                placeholder=""
                autoComplete="address-level2"
                disabled={isLoading}
                className={`h-11 ${errors.city ? 'border-destructive' : ''}`}
                {...register('city')}
              />
              {errors.city && (
                <p className="text-xs text-destructive">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* Phone & Email Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">PHONE*</Label>
              <div className="flex">
                <div className="flex items-center gap-2 px-3 h-11 border border-r-0 rounded-l-md bg-muted/50 text-sm">
                  <span className="text-lg">{selectedCountry === 'GB' ? '🇬🇧' : '🌍'}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{selectedCountryData?.phoneCode || '+44'}</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder=""
                  autoComplete="tel"
                  disabled={isLoading}
                  className={`h-11 rounded-l-none ${errors.phone ? 'border-destructive' : ''}`}
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">EMAIL</Label>
              <Input
                id="email"
                type="email"
                placeholder=""
                autoComplete="email"
                disabled={isLoading}
                className={`h-11 ${errors.email ? 'border-destructive' : ''}`}
                {...register('email')}
              />
              <p className="text-xs text-muted-foreground">
                A confirmation email will be sent after checkout.
              </p>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Password Row (for account creation) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">PASSWORD</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
                disabled={isLoading}
                className={`h-11 ${errors.password ? 'border-destructive' : ''}`}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">CONFIRM PASSWORD</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                autoComplete="new-password"
                disabled={isLoading}
                className={`h-11 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
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
        </form>
      </div>

      {/* Right Column - Order Summary */}
      <div className="w-full lg:w-[380px] lg:flex-shrink-0 lg:sticky lg:top-4 h-fit">
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h2 className="text-lg font-bold text-center">ORDER SUMMARY</h2>

          {/* Product Info */}
          <div className="flex gap-3">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={mainImageUrl}
                alt={competitionTitle}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2">{competitionTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {ticketCount} TICKETS
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-3 border-t">
            <span className="text-muted-foreground">total :</span>
            <span className="text-xl font-bold">{formatPrice(totalPrice)}</span>
          </div>

          {/* Bonus Tickets */}
          {bonusTickets > 0 && (
            <div className="flex items-center justify-center gap-2 text-green-500 text-sm font-medium">
              <Gift className="h-4 w-4" />
              +{bonusTickets} FREE bonus tickets ({totalEntries} total entries)
            </div>
          )}

          {/* Coupon Code */}
          <div className="flex gap-2">
            <Input placeholder="Have a coupon ?" className="flex-1" />
            <Button variant="secondary" className="px-6">
              ADD
            </Button>
          </div>

          {/* Age Disclaimer */}
          <p className="text-[11px] text-muted-foreground italic leading-snug">
            By entering this competition, you confirm you are 18 or older. Age verification may be required if you win.
          </p>

          {/* Terms Checkbox */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={acceptTerms}
                onCheckedChange={handleTermsChange}
                disabled={isLoading}
                className="mt-0.5"
              />
              <label
                htmlFor="acceptTerms"
                className="text-xs leading-snug cursor-pointer"
              >
                I confirm that I am at least 18 years old, and I have read and agree to the{' '}
                <Link href="/terms" className="underline hover:text-primary" target="_blank">
                  terms & conditions
                </Link>
                , including the non-refundable ticket policy.
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>
            )}

            {/* Marketing Checkbox */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptMarketing"
                checked={acceptMarketing}
                onCheckedChange={handleMarketingChange}
                disabled={isLoading}
                className="mt-0.5"
              />
              <label
                htmlFor="acceptMarketing"
                className="text-xs leading-snug cursor-pointer"
              >
                I agree to receive email updates & news.
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full text-base h-12 font-semibold"
            disabled={isLoading}
            onClick={handleSubmit(onSubmit)}
            style={{
              background: 'linear-gradient(135deg, oklch(0.35 0.15 160) 0%, oklch(0.25 0.12 160) 100%)',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Proceed to checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
