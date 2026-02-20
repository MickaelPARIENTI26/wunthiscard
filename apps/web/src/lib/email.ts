import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set - emails will not be sent');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@winucard.com';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  if (!resend) {
    console.log('Email would be sent to:', to, 'Subject:', subject);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `WinUCard <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Replace all {{variable}} placeholders in a template string with values from data object
 */
export function replaceVariables(
  template: string,
  data: Record<string, string | number | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Get test data for email template preview/testing
 */
export function getTestData(): Record<string, string> {
  return {
    // User data
    user_firstname: 'John',
    user_lastname: 'Smith',
    user_email: 'john@example.com',

    // Competition data
    competition_title: 'Charizard Base Set PSA 10',
    competition_card_name: 'Charizard Holo PSA 10',
    competition_card_image:
      'https://placehold.co/400x560/0a0a0f/FFD700?text=Charizard+PSA+10',
    competition_card_value: '£1,000',
    competition_ticket_price: '£30',
    competition_total_tickets: '134',
    competition_tickets_sold: '98',
    competition_tickets_remaining: '36',
    competition_end_date: 'March 15, 2026',
    competition_draw_date: 'March 16, 2026 at 8:00 PM GMT',
    competition_url: 'https://winucard.co.uk/competitions/charizard-psa10',
    competition_category: 'Pokémon',

    // Order data
    order_id: 'WUC-20260301-0042',
    order_total: '£90',
    order_tickets_count: '3',
    order_ticket_numbers: '#0042, #0043, #0044',
    order_date: 'March 1, 2026',

    // Draw data
    draw_winner_name: 'John Smith',
    draw_winning_ticket: '#0042',
    draw_video_url: 'https://youtube.com/live/example',
    draw_date: 'March 16, 2026',
    draw_time: '8:00 PM GMT',

    // Site data
    site_url: 'https://winucard.co.uk',
    site_name: 'WinUCard',
    site_logo_url: 'https://winucard.co.uk/logo-email.png',
    current_year: new Date().getFullYear().toString(),

    // Action URLs
    unsubscribe_url: 'https://winucard.co.uk/unsubscribe?token=test',
    verification_url: 'https://winucard.co.uk/verify?token=test',
    cart_url: 'https://winucard.co.uk/cart?recover=test',
  };
}

/**
 * Send email using a template from the database
 */
export async function sendTemplateEmail(
  templateSlug: string,
  to: string,
  data: Record<string, string | number | undefined>
): Promise<{ success: boolean; error?: unknown; data?: unknown; mock?: boolean }> {
  // Dynamic import to avoid circular dependencies
  const { prisma } = await import('@/lib/db');

  const template = await prisma.emailTemplate.findUnique({
    where: { slug: templateSlug },
  });

  if (!template) {
    return { success: false, error: `Template '${templateSlug}' not found` };
  }

  if (!template.isActive) {
    return { success: false, error: `Template '${templateSlug}' is disabled` };
  }

  const subject = replaceVariables(template.subject, data);
  const html = replaceVariables(template.htmlContent, data);

  return sendEmail({ to, subject, html });
}

// Email Templates

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WinUCard</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">WinUCard</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="background-color: #f3f4f6; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px;">
        WinUCard Ltd. | Registered in England & Wales
      </p>
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        <a href="${BASE_URL}/terms" style="color: #6b7280;">Terms</a> ·
        <a href="${BASE_URL}/privacy" style="color: #6b7280;">Privacy</a> ·
        <a href="${BASE_URL}/contact" style="color: #6b7280;">Contact</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
}

// Email Verification
export async function sendVerificationEmail(email: string, token: string, firstName: string) {
  const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;

  const html = emailWrapper(`
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Welcome, ${firstName}!</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Thanks for signing up for WinUCard. Please verify your email address to start entering competitions.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Verify Email Address
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0;">
      If you didn't create an account, you can safely ignore this email.
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0;">
      Or copy this link: ${verifyUrl}
    </p>
  `);

  return sendEmail({
    to: email,
    subject: 'Verify your WinUCard account',
    html,
  });
}

// Password Reset
export async function sendPasswordResetEmail(email: string, token: string, firstName: string) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  const html = emailWrapper(`
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Reset Your Password</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Hi ${firstName}, we received a request to reset your password. Click the button below to choose a new password.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Reset Password
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0;">
      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0;">
      Or copy this link: ${resetUrl}
    </p>
  `);

  return sendEmail({
    to: email,
    subject: 'Reset your WinUCard password',
    html,
  });
}

// Purchase Confirmation
interface PurchaseConfirmationData {
  orderNumber: string;
  competitionTitle: string;
  ticketNumbers: number[];
  bonusTicketNumbers: number[];
  totalAmount: number;
  drawDate: Date;
}

export async function sendPurchaseConfirmationEmail(
  email: string,
  firstName: string,
  data: PurchaseConfirmationData
) {
  const ordersUrl = `${BASE_URL}/profile/orders`;
  const ticketStr = data.ticketNumbers.map((n) => `#${n}`).join(', ');
  const bonusStr = data.bonusTicketNumbers.length > 0
    ? data.bonusTicketNumbers.map((n) => `#${n}`).join(', ')
    : null;

  const drawDateFormatted = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(data.drawDate));

  const totalFormatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(data.totalAmount);

  const html = emailWrapper(`
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Order Confirmed! 🎉</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Hi ${firstName}, your ticket purchase has been confirmed. Good luck!
    </p>

    <!-- Order Details -->
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Order</p>
      <p style="color: #1a1a1a; font-size: 14px; font-weight: 600; margin: 0 0 16px;">${data.orderNumber}</p>

      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Competition</p>
      <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 16px;">${data.competitionTitle}</p>

      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Your Tickets</p>
      <p style="color: #1a1a1a; font-size: 14px; margin: 0 0 8px;">${ticketStr}</p>
      ${bonusStr ? `
      <p style="color: #16a34a; font-size: 14px; margin: 0 0 16px;">
        <strong>+ ${data.bonusTicketNumbers.length} Bonus:</strong> ${bonusStr}
      </p>
      ` : ''}

      <p style="color: #6b7280; font-size: 12px; margin: 16px 0 4px; text-transform: uppercase;">Draw Date</p>
      <p style="color: #1a1a1a; font-size: 14px; margin: 0 0 16px;">${drawDateFormatted}</p>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Total Paid</p>
        <p style="color: #1a1a1a; font-size: 24px; font-weight: bold; margin: 0;">${totalFormatted}</p>
      </div>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${ordersUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        View My Tickets
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 24px 0 0;">
      We'll notify you when the draw takes place. Good luck! 🍀
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `Order Confirmed: ${data.competitionTitle}`,
    html,
  });
}

// Draw Complete Notification (for non-winners)
interface DrawCompleteNotificationData {
  competitionTitle: string;
  winnerName: string; // Anonymized: "J*** D***"
  winningTicketNumber: number;
}

export async function sendDrawCompleteNotificationEmail(
  email: string,
  firstName: string,
  data: DrawCompleteNotificationData
) {
  const competitionsUrl = `${BASE_URL}/competitions`;

  const html = emailWrapper(`
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Competition Complete</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Hi ${firstName}, the draw for <strong>${data.competitionTitle}</strong> has been completed.
    </p>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Winning Ticket</p>
      <p style="color: #1a1a1a; font-size: 32px; font-weight: bold; margin: 0 0 16px;">#${data.winningTicketNumber}</p>

      <p style="color: #6b7280; font-size: 14px; margin: 0 0 4px;">Winner</p>
      <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0;">${data.winnerName}</p>
    </div>

    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
      Unfortunately, your ticket wasn't selected this time. Better luck next time!
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${competitionsUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Browse More Competitions
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 24px 0 0;">
      Thank you for participating! 🍀
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `Draw Complete: ${data.competitionTitle}`,
    html,
  });
}

// Contact Form Confirmation
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  referenceNumber: string;
}

export async function sendContactFormConfirmationEmail(data: ContactFormData) {
  const contactUrl = `${BASE_URL}/contact`;

  const html = emailWrapper(`
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">We've Received Your Message</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Hi ${data.name}, thank you for contacting WinUCard. We've received your message and will get back to you as soon as possible.
    </p>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Reference Number</p>
      <p style="color: #1a1a1a; font-size: 14px; font-weight: 600; margin: 0 0 16px;">${data.referenceNumber}</p>

      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Subject</p>
      <p style="color: #1a1a1a; font-size: 14px; margin: 0 0 16px;">${data.subject}</p>

      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Your Message</p>
      <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0; white-space: pre-wrap;">${data.message}</p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0;">
      We typically respond within 24-48 hours during business days. If your inquiry is urgent, please include your reference number in any follow-up messages.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${contactUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Visit Our Help Centre
      </a>
    </div>
  `);

  return sendEmail({
    to: data.email,
    subject: `Message Received - Ref: ${data.referenceNumber}`,
    html,
  });
}

// Free Entry Confirmation
interface FreeEntryConfirmationData {
  competitionTitle: string;
  ticketNumber: number;
  drawDate: Date;
  entryMethod: 'postal' | 'email';
}

export async function sendFreeEntryConfirmationEmail(
  email: string,
  firstName: string,
  data: FreeEntryConfirmationData
) {
  const competitionUrl = `${BASE_URL}/competitions`;

  const drawDateFormatted = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(data.drawDate));

  const html = emailWrapper(`
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Free Entry Confirmed</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Hi ${firstName}, your free entry has been confirmed. Good luck!
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <div style="text-align: center; margin-bottom: 16px;">
        <span style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">
          Free Entry
        </span>
      </div>

      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; text-align: center;">Competition</p>
      <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 16px; text-align: center;">${data.competitionTitle}</p>

      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; text-align: center;">Your Ticket Number</p>
      <p style="color: #16a34a; font-size: 32px; font-weight: bold; margin: 0 0 16px; text-align: center;">#${data.ticketNumber}</p>

      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; text-align: center;">Draw Date</p>
      <p style="color: #1a1a1a; font-size: 14px; margin: 0; text-align: center;">${drawDateFormatted}</p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px; text-align: center;">
      Entry method: ${data.entryMethod === 'postal' ? 'Postal Entry' : 'Email Entry'}
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${competitionUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Browse More Competitions
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 24px 0 0;">
      We'll notify you when the draw takes place. Good luck! 🍀
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `Free Entry Confirmed: ${data.competitionTitle}`,
    html,
  });
}

// Winner Notification
interface WinnerNotificationData {
  competitionTitle: string;
  ticketNumber: number;
  prizeValue: number;
}

export async function sendWinnerNotificationEmail(
  email: string,
  firstName: string,
  data: WinnerNotificationData
) {
  const winsUrl = `${BASE_URL}/profile/wins`;

  const prizeFormatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
  }).format(data.prizeValue);

  const html = emailWrapper(`
    <div style="text-align: center;">
      <h2 style="color: #16a34a; font-size: 28px; margin: 0 0 16px;">🎉 CONGRATULATIONS! 🎉</h2>
      <p style="color: #4b5563; font-size: 20px; line-height: 28px; margin: 0 0 24px;">
        ${firstName}, you've WON!
      </p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Your winning ticket</p>
      <p style="color: #16a34a; font-size: 48px; font-weight: bold; margin: 0 0 16px;">#${data.ticketNumber}</p>

      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Prize</p>
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 8px;">${data.competitionTitle}</p>
      <p style="color: #16a34a; font-size: 24px; font-weight: bold; margin: 0;">Value: ${prizeFormatted}</p>
    </div>

    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
      Our team will be in touch shortly to arrange delivery of your prize!
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${winsUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        View My Wins
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 24px 0 0;">
      If you have any questions, please contact us at support@winucard.com
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `🎉 You've WON: ${data.competitionTitle}!`,
    html,
  });
}
