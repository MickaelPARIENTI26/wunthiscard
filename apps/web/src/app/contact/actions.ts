'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { rateLimits } from '@/lib/redis';
import { verifyTurnstileRequired } from '@/lib/turnstile';
import { sendEmail } from '@/lib/email';
import { getClientIp } from '@/lib/get-client-ip';

// Where contact-form notifications are delivered (override via env if needed).
const CONTACT_INBOX = process.env.CONTACT_EMAIL ?? 'support@winucards.com';

const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.enum(
    [
      'general',
      'competition',
      'payment',
      'delivery',
      'account',
      'partnership',
      'other',
    ],
    {
      errorMap: () => ({ message: 'Please select a subject' }),
    }
  ),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters'),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export type ContactFormState = {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    subject?: string[];
    message?: string[];
  };
};

const subjectLabels: Record<string, string> = {
  general: 'General Enquiry',
  competition: 'Competition Question',
  payment: 'Payment Issue',
  delivery: 'Delivery & Shipping',
  account: 'Account Help',
  partnership: 'Partnership Enquiry',
  other: 'Other',
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Everything is wrapped so NOTHING can throw uncaught — the user must always
  // get a clear message back (never a silent "scroll to top, no feedback").
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);

    // Rate limiting — but degrade gracefully if the limiter itself errors
    // (e.g. transient Redis issue), rather than crashing the whole submission.
    try {
      const { success: rateLimitSuccess } = await rateLimits.contact.limit(ip);
      if (!rateLimitSuccess) {
        return {
          success: false,
          message: 'Too many messages sent. Please try again later.',
        };
      }
    } catch (rateErr) {
      console.error('Contact rate-limit check failed (allowing request):', rateErr);
    }

    // Verify Turnstile captcha — REQUIRED whenever Turnstile is configured (fails
    // closed in production). The form now renders a widget, so a missing token means
    // a scripted/bot submission and is rejected; in dev (no secret) this is a no-op.
    const turnstileToken = formData.get('cf-turnstile-response');
    const captchaResult = await verifyTurnstileRequired(
      typeof turnstileToken === 'string' ? turnstileToken : null,
      ip === 'unknown' ? undefined : ip
    );
    if (!captchaResult.success) {
      return {
        success: false,
        message: captchaResult.error ?? 'Captcha verification failed. Please try again.',
      };
    }

    const rawData = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    const validatedFields = contactFormSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Please fix the errors below.',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, email, subject, message } = validatedFields.data;
    const subjectLabel = subjectLabels[subject] ?? subject;

    // Save to database (always — this is the source of truth, visible in admin)
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject: subjectLabel,
        message,
      },
    });

    // Notify the support inbox by email. Non-blocking: if the send fails, the
    // message is still saved in the DB, so we don't fail the submission.
    try {
      // Escape every user-controlled value before interpolating into the email HTML.
      const esc = (s: string) =>
        s
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      const safeName = esc(name);
      const safeEmail = esc(email);
      const safeMessage = esc(message);
      await sendEmail({
        to: CONTACT_INBOX,
        replyTo: email,
        subject: `[Contact] ${subjectLabel} — ${name}`,
        html: `
          <h2 style="font-family: sans-serif;">New contact message</h2>
          <p style="font-family: sans-serif;"><b>From:</b> ${safeName} &lt;${safeEmail}&gt;</p>
          <p style="font-family: sans-serif;"><b>Subject:</b> ${subjectLabel}</p>
          <p style="font-family: sans-serif;"><b>Message:</b></p>
          <p style="font-family: sans-serif; white-space: pre-wrap; border-left: 3px solid #00c76a; padding-left: 12px;">${safeMessage}</p>
          <hr/>
          <p style="font-family: sans-serif; font-size: 12px; color: #888;">Reply directly to ${safeEmail} to respond to this person.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send contact notification email:', emailError);
    }

    return {
      success: true,
      message:
        'Thank you for your message! We will get back to you as soon as possible.',
    };
  } catch (error) {
    console.error('Failed to save contact message:', error);
    return {
      success: false,
      message:
        'Something went wrong. Please try again later or email us directly.',
    };
  }
}
