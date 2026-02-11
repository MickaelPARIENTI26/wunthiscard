'use client';

import { useActionState } from 'react';
import { useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { submitContactForm, type ContactFormState } from './actions';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

const subjects = [
  { value: 'general', label: 'General Enquiry' },
  { value: 'competition', label: 'Competition Question' },
  { value: 'payment', label: 'Payment Issue' },
  { value: 'delivery', label: 'Delivery & Shipping' },
  { value: 'account', label: 'Account Help' },
  { value: 'partnership', label: 'Partnership Enquiry' },
  { value: 'other', label: 'Other' },
];

const initialState: ContactFormState = {
  success: false,
  message: '',
};

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Reset form and captcha on successful submission
  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset();
      turnstileRef.current?.reset();
    }
  }, [state.success]);

  // Reset captcha on error
  useEffect(() => {
    if (!state.success && state.message) {
      turnstileRef.current?.reset();
    }
  }, [state.success, state.message]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {/* Success Message */}
      {state.success && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-800 dark:text-green-200">
            {state.message}
          </p>
        </div>
      )}

      {/* Error Message */}
      {!state.success && state.message && !state.errors && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-200">
            {state.message}
          </p>
        </div>
      )}

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Your full name"
          required
          disabled={isPending}
          aria-describedby={state.errors?.name ? 'name-error' : undefined}
          className={state.errors?.name ? 'border-red-500' : ''}
        />
        {state.errors?.name && (
          <p id="name-error" className="text-sm text-red-500">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          required
          disabled={isPending}
          aria-describedby={state.errors?.email ? 'email-error' : undefined}
          className={state.errors?.email ? 'border-red-500' : ''}
        />
        {state.errors?.email && (
          <p id="email-error" className="text-sm text-red-500">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      {/* Subject Field */}
      <div className="space-y-2">
        <Label htmlFor="subject">
          Subject <span className="text-red-500">*</span>
        </Label>
        <Select name="subject" required disabled={isPending}>
          <SelectTrigger
            id="subject"
            aria-describedby={state.errors?.subject ? 'subject-error' : undefined}
            className={state.errors?.subject ? 'border-red-500' : ''}
          >
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.value} value={subject.value}>
                {subject.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.errors?.subject && (
          <p id="subject-error" className="text-sm text-red-500">
            {state.errors.subject[0]}
          </p>
        )}
      </div>

      {/* Message Field */}
      <div className="space-y-2">
        <Label htmlFor="message">
          Message <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          placeholder="How can we help you?"
          rows={5}
          required
          disabled={isPending}
          aria-describedby={state.errors?.message ? 'message-error' : undefined}
          className={state.errors?.message ? 'border-red-500' : ''}
        />
        {state.errors?.message && (
          <p id="message-error" className="text-sm text-red-500">
            {state.errors.message[0]}
          </p>
        )}
      </div>

      {/* Cloudflare Turnstile - invisible mode */}
      {TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          options={{
            size: 'invisible',
            theme: 'auto',
          }}
        />
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
}
