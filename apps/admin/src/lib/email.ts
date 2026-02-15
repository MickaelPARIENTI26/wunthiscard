import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set - emails will not be sent');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@winucard.com';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
  }).format(amount);
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

  const html = emailWrapper(`
    <div style="text-align: center;">
      <h2 style="color: #16a34a; font-size: 28px; margin: 0 0 16px;">CONGRATULATIONS!</h2>
      <p style="color: #4b5563; font-size: 20px; line-height: 28px; margin: 0 0 24px;">
        ${firstName}, you've WON!
      </p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Your winning ticket</p>
      <p style="color: #16a34a; font-size: 48px; font-weight: bold; margin: 0 0 16px;">#${data.ticketNumber}</p>

      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Prize</p>
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 8px;">${data.competitionTitle}</p>
      <p style="color: #16a34a; font-size: 24px; font-weight: bold; margin: 0;">Value: ${formatPrice(data.prizeValue)}</p>
    </div>

    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 16px; text-align: center;">
      Our team will be in touch shortly to arrange delivery of your prize!
    </p>

    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 0 0 24px;">
      <p style="color: #92400e; font-size: 14px; line-height: 20px; margin: 0; text-align: center;">
        <strong>Important:</strong> Please claim your prize within <strong>14 days</strong> of this notification.
        After this period, the prize may be forfeited.
      </p>
    </div>

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
    subject: `You've WON: ${data.competitionTitle}!`,
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
      Thank you for participating!
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `Draw Complete: ${data.competitionTitle}`,
    html,
  });
}

// Anonymize winner name: "John Doe" -> "J*** D***"
export function anonymizeWinnerName(firstName: string, lastName: string): string {
  const anonymizeWord = (word: string): string => {
    if (word.length <= 1) return word;
    return word[0] + '*'.repeat(word.length - 1);
  };
  return `${anonymizeWord(firstName)} ${anonymizeWord(lastName)}`;
}

// Competition Cancellation Notification
interface CancellationNotificationData {
  competitionTitle: string;
  refundAmount: number;
}

export async function sendCancellationNotificationEmail(
  email: string,
  firstName: string,
  data: CancellationNotificationData
) {
  const competitionsUrl = `${BASE_URL}/competitions`;

  const html = emailWrapper(`
    <h2 style="color: #dc2626; font-size: 20px; margin: 0 0 16px;">Competition Cancelled</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Hi ${firstName}, we're sorry to inform you that <strong>${data.competitionTitle}</strong> has been cancelled.
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #16a34a; font-size: 18px; font-weight: 600; margin: 0 0 8px;">
        Full Refund Issued
      </p>
      <p style="color: #4b5563; font-size: 14px; margin: 0;">
        Your payment of <strong>${formatPrice(data.refundAmount)}</strong> has been refunded to your original payment method.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">
        Please allow 5-10 business days for the refund to appear on your statement.
      </p>
    </div>

    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
      We apologize for any inconvenience. Check out our other competitions below!
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${competitionsUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Browse Competitions
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 24px 0 0;">
      Questions? Contact us at support@winucard.com
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `Competition Cancelled: ${data.competitionTitle} - Full Refund Issued`,
    html,
  });
}

// Win Voided Notification (for unclaimed prize re-draws)
interface WinVoidedData {
  to: string;
  firstName: string;
  competitionTitle: string;
}

export async function sendWinVoidedEmail({
  to,
  firstName,
  competitionTitle,
}: WinVoidedData) {
  const contactUrl = `${BASE_URL}/contact`;

  const html = emailWrapper(`
    <h2 style="color: #dc2626; font-size: 20px; margin: 0 0 16px;">Prize Claim Expired</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Hi ${firstName}, we regret to inform you that your prize claim for <strong>${competitionTitle}</strong> has expired.
    </p>

    <div style="background-color: #fef2f2; border: 1px solid #dc2626; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <p style="color: #dc2626; font-size: 16px; font-weight: 600; margin: 0 0 8px;">
        What happened?
      </p>
      <p style="color: #4b5563; font-size: 14px; line-height: 20px; margin: 0;">
        As per our terms and conditions, winners must claim their prize within 14 days of the draw.
        As we did not receive your claim within this period, your prize has been forfeited and
        a re-draw will be conducted to select a new winner.
      </p>
    </div>

    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
      If you believe this is an error, or if you experienced circumstances that prevented you from claiming,
      please contact us as soon as possible.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${contactUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Contact Support
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 24px 0 0;">
      We're sorry this happened and hope to see you in future competitions.
    </p>
  `);

  return sendEmail({
    to,
    subject: `Prize Claim Expired: ${competitionTitle}`,
    html,
  });
}
