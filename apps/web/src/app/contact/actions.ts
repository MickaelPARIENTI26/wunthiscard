'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { rateLimits } from '@/lib/redis';
import { verifyTurnstileToken } from '@/lib/turnstile';

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
  // Rate limiting
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             headersList.get('x-real-ip') ||
             'unknown';
  const { success: rateLimitSuccess } = await rateLimits.contact.limit(ip);
  if (!rateLimitSuccess) {
    return {
      success: false,
      message: 'Too many messages sent. Please try again later.',
    };
  }

  // Verify Turnstile captcha
  const turnstileToken = formData.get('cf-turnstile-response') as string;
  if (turnstileToken) {
    const captchaResult = await verifyTurnstileToken(turnstileToken, ip);
    if (!captchaResult.success) {
      return {
        success: false,
        message: captchaResult.error || 'Captcha verification failed. Please try again.',
      };
    }
  }

  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  };

  // Validate the form data
  const validatedFields = contactFormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Please fix the errors below.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, subject, message } = validatedFields.data;

  try {
    // Save to database
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject: subjectLabels[subject] || subject,
        message,
      },
    });

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
