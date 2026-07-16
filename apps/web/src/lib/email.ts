import { Resend } from 'resend';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// IMPORTANT: never throw at module load. This file is imported by many actions
// (register, contact, checkout webhook, etc.) — a top-level throw would crash
// ALL of them, not just email. Missing config is handled inside sendEmail()
// instead: it fails loudly (logs + returns failure) rather than silently
// "succeeding", but it never crashes the caller.
if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set - emails will not be sent.');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@lucky-tcg.com';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  // Optional Reply-To address (e.g. a contact-form submitter) so replies go to
  // the right person rather than the noreply FROM_EMAIL sender.
  replyTo?: string;
  // Extra SMTP headers (e.g. List-Unsubscribe on marketing emails).
  headers?: Record<string, string>;
}

export async function sendEmail({ to, subject, html, text, replyTo, headers }: SendEmailOptions) {
  if (!resend) {
    if (IS_PRODUCTION) {
      // Don't silently pretend it worked in prod — log loudly and report failure
      // (callers wrap this in try/catch and degrade gracefully).
      console.error('Email NOT sent — RESEND_API_KEY missing in production:', { to, subject });
      return { success: false, error: 'Email service not configured' };
    }
    console.log('Email would be sent to:', to, 'Subject:', subject);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Lucky TCG <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html),
      ...(replyTo ? { replyTo } : {}),
      ...(headers ? { headers } : {}),
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

// Escape user-controlled values before interpolating them into email HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Email Templates

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lucky TCG</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Lucky TCG</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="background-color: #f3f4f6; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px;">
        YD PARTNERS LTD (trading as Lucky TCG). | Registered in England & Wales · Company No. 16766570
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
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Welcome, ${escapeHtml(firstName)}!</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Thanks for signing up for Lucky TCG. Please verify your email address to start entering competitions.
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
    subject: 'Verify your Lucky TCG account',
    html,
  });
}

// Password Reset
export async function sendPasswordResetEmail(email: string, token: string, firstName: string) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  const html = emailWrapper(`
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Reset Your Password</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Hi ${escapeHtml(firstName)}, we received a request to reset your password. Click the button below to choose a new password.
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
    subject: 'Reset your Lucky TCG password',
    html,
  });
}

// Referral Reward — sent to the referrer when one of their friends makes their
// first purchase and earns them a free ticket.
export async function sendReferralRewardEmail(
  email: string,
  firstName: string,
  freeTicketsAvailable: number
) {
  const referralsUrl = `${BASE_URL}/referrals`;
  const competitionsUrl = `${BASE_URL}/competitions`;

  const html = emailWrapper(`
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">🎁 You've earned a free ticket!</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Great news${firstName ? `, ${escapeHtml(firstName)}` : ''} — a friend you invited just made their first purchase on Lucky TCG, so we've added <strong>1 free ticket</strong> to your account.
    </p>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Free tickets available</p>
      <p style="color: #16a34a; font-size: 32px; font-weight: 800; margin: 0;">${freeTicketsAvailable}</p>
    </div>

    <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0 0 24px;">
      Use it at checkout on any competition when you buy 2 or more tickets — one ticket will be on us.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${competitionsUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Browse Competitions
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0;">
      Keep sharing your link to earn more — every friend who makes their first purchase gets you another free ticket.
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0;">
      View your referrals: ${referralsUrl}
    </p>
  `);

  return sendEmail({
    to: email,
    subject: '🎁 You earned a free ticket on Lucky TCG',
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
  // Ticket numbers are not surfaced to users — we only show how many they hold.
  const paidCount = data.ticketNumbers.length;
  const bonusCount = data.bonusTicketNumbers.length;

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
      Hi ${escapeHtml(firstName)}, your ticket purchase has been confirmed. Good luck!
    </p>

    <!-- Order Details -->
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Order</p>
      <p style="color: #1a1a1a; font-size: 14px; font-weight: 600; margin: 0 0 16px;">${data.orderNumber}</p>

      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Competition</p>
      <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 16px;">${escapeHtml(data.competitionTitle)}</p>

      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Your Tickets</p>
      <p style="color: #1a1a1a; font-size: 24px; font-weight: bold; margin: 0 0 8px;">${paidCount} ${paidCount === 1 ? 'ticket' : 'tickets'}</p>
      ${bonusCount > 0 ? `
      <p style="color: #16a34a; font-size: 14px; margin: 0 0 16px;">
        <strong>+ ${bonusCount} bonus ${bonusCount === 1 ? 'ticket' : 'tickets'}</strong>
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
      Hi ${escapeHtml(firstName)}, the draw for <strong>${escapeHtml(data.competitionTitle)}</strong> has been completed.
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
      Hi ${escapeHtml(firstName)}, your free entry has been confirmed. Good luck!
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <div style="text-align: center; margin-bottom: 16px;">
        <span style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">
          Free Entry
        </span>
      </div>

      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; text-align: center;">Competition</p>
      <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 16px; text-align: center;">${escapeHtml(data.competitionTitle)}</p>

      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; text-align: center;">Your Entry</p>
      <p style="color: #16a34a; font-size: 32px; font-weight: bold; margin: 0 0 16px; text-align: center;">1 free ticket</p>

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
  const winsUrl = `${BASE_URL}/my-wins`;

  const prizeFormatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
  }).format(data.prizeValue);

  const html = emailWrapper(`
    <div style="text-align: center;">
      <h2 style="color: #16a34a; font-size: 28px; margin: 0 0 16px;">🎉 CONGRATULATIONS! 🎉</h2>
      <p style="color: #4b5563; font-size: 20px; line-height: 28px; margin: 0 0 24px;">
        ${escapeHtml(firstName)}, you've WON!
      </p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Your winning ticket</p>
      <p style="color: #16a34a; font-size: 48px; font-weight: bold; margin: 0 0 16px;">#${data.ticketNumber}</p>

      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Prize</p>
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 8px;">${escapeHtml(data.competitionTitle)}</p>
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
      If you have any questions, please contact us at contact@lucky-tcg.com
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `🎉 You've WON: ${data.competitionTitle}!`,
    html,
  });
}

// ============================================================================
// MARKETING / LIFECYCLE BLASTS
// ----------------------------------------------------------------------------
// Promotional emails (new competition, closing soon) are only ever sent to users
// who opted in (User.emailMarketing = true) and MUST carry a working one-click
// unsubscribe (PECR/GDPR + deliverability). Every marketing email therefore uses
// marketingWrapper() (visible unsubscribe link) and a List-Unsubscribe header.
// ============================================================================

export interface MarketingRecipient {
  email: string;
  firstName: string;
  unsubscribeToken: string;
}

function unsubscribeUrl(token: string): string {
  return `${BASE_URL}/unsubscribe?token=${encodeURIComponent(token)}`;
}

// One-click unsubscribe headers (RFC 8058) — lets Gmail/Outlook show a native
// "Unsubscribe" button that POSTs to our endpoint.
function listUnsubscribeHeaders(token: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${BASE_URL}/api/unsubscribe?token=${encodeURIComponent(token)}>, <mailto:contact@lucky-tcg.com?subject=unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

// Marketing wrapper = branded shell + a mandatory unsubscribe footer.
function marketingWrapper(content: string, token: string): string {
  const url = unsubscribeUrl(token);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lucky TCG</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Lucky TCG</h1>
    </div>
    <div style="padding: 32px;">
      ${content}
    </div>
    <div style="background-color: #f3f4f6; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px;">
        YD PARTNERS LTD (trading as Lucky TCG) · 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ · Company No. 16766570
      </p>
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px;">
        You're receiving this because you opted in to competition updates from Lucky TCG.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        <a href="${url}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> ·
        <a href="${BASE_URL}/settings" style="color: #6b7280;">Email preferences</a> ·
        <a href="${BASE_URL}/privacy" style="color: #6b7280;">Privacy</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
}

const gbp0 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 });
const gbp2 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

// Chunked batch send (Resend accepts up to 100 messages per batch call). Returns
// the number successfully accepted. Never throws — logs and continues per chunk.
async function sendMarketingBatch(
  messages: { to: string; subject: string; html: string; headers?: Record<string, string> }[]
): Promise<{ sent: number; total: number }> {
  const total = messages.length;
  if (total === 0) return { sent: 0, total: 0 };

  if (!resend) {
    if (IS_PRODUCTION) {
      console.error(`Marketing batch NOT sent — RESEND_API_KEY missing in production (${total} messages)`);
      return { sent: 0, total };
    }
    console.log(`Marketing batch would send ${total} emails (dev, no RESEND_API_KEY)`);
    return { sent: total, total };
  }

  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const { error } = await resend.batch.send(
        chunk.map((m) => ({
          from: `Lucky TCG <${FROM_EMAIL}>`,
          to: m.to,
          subject: m.subject,
          html: m.html,
          text: stripHtml(m.html),
          ...(m.headers ? { headers: m.headers } : {}),
        }))
      );
      if (error) {
        console.error('Marketing batch chunk failed:', error);
      } else {
        sent += chunk.length;
      }
    } catch (err) {
      console.error('Marketing batch chunk threw:', err);
    }
  }
  return { sent, total };
}

// --- New competition live -------------------------------------------------
export interface CompetitionBlastData {
  title: string;
  slug: string;
  prizeValue: number;
  ticketPrice: number;
  isFree: boolean;
  mainImageUrl: string;
  drawDate: Date;
}

function competitionCard(data: CompetitionBlastData): string {
  const prize = gbp0.format(data.prizeValue);
  const priceLine = data.isFree
    ? 'Free entry'
    : `Tickets from ${gbp2.format(data.ticketPrice)}`;
  const drawFormatted = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short' }).format(
    new Date(data.drawDate)
  );
  return `
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      ${
        data.mainImageUrl
          ? `<img src="${escapeHtml(data.mainImageUrl)}" alt="${escapeHtml(data.title)}" style="max-width: 100%; height: auto; border-radius: 6px; margin-bottom: 16px;">`
          : ''
      }
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 700; margin: 0 0 8px;">${escapeHtml(data.title)}</p>
      <p style="color: #16a34a; font-size: 16px; font-weight: 600; margin: 0 0 4px;">Prize value ${prize}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">${priceLine} · Draw ${drawFormatted}</p>
    </div>`;
}

export async function sendNewCompetitionBlast(
  recipients: MarketingRecipient[],
  data: CompetitionBlastData
): Promise<{ sent: number; total: number }> {
  const compUrl = `${BASE_URL}/competitions/${data.slug}`;
  const messages = recipients.map((r) => {
    const html = marketingWrapper(
      `
    <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 16px;">🎴 New drop is live${r.firstName ? `, ${escapeHtml(r.firstName)}` : ''}!</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 8px;">
      A new competition just went live on Lucky TCG. Get your tickets before it's gone.
    </p>
    ${competitionCard(data)}
    <div style="text-align: center; margin: 32px 0;">
      <a href="${compUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Enter now
      </a>
    </div>`,
      r.unsubscribeToken
    );
    return {
      to: r.email,
      subject: `🎴 New drop: ${data.title}`,
      html,
      headers: listUnsubscribeHeaders(r.unsubscribeToken),
    };
  });
  return sendMarketingBatch(messages);
}

// --- Closing soon ---------------------------------------------------------
export async function sendClosingSoonBlast(
  recipients: MarketingRecipient[],
  data: CompetitionBlastData
): Promise<{ sent: number; total: number }> {
  const compUrl = `${BASE_URL}/competitions/${data.slug}`;
  const drawFormatted = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short' }).format(
    new Date(data.drawDate)
  );
  const messages = recipients.map((r) => {
    const html = marketingWrapper(
      `
    <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 16px;">⏳ Last chance${r.firstName ? `, ${escapeHtml(r.firstName)}` : ''}</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 8px;">
      The draw for <strong>${escapeHtml(data.title)}</strong> is coming up on ${drawFormatted}. Grab your tickets before entries close.
    </p>
    ${competitionCard(data)}
    <div style="text-align: center; margin: 32px 0;">
      <a href="${compUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Enter before it closes
      </a>
    </div>`,
      r.unsubscribeToken
    );
    return {
      to: r.email,
      subject: `⏳ Closing soon: ${data.title}`,
      html,
      headers: listUnsubscribeHeaders(r.unsubscribeToken),
    };
  });
  return sendMarketingBatch(messages);
}

// --- Abandoned cart recovery ----------------------------------------------
// Sent to a user who started a checkout (created a PENDING order) but never paid.
// Marketing under PECR (a nudge to complete a purchase) → opted-in only, with
// unsubscribe. Links back to the competition page (the original Stripe session
// has usually expired) so the user re-enters cleanly.
export interface CartRecoveryItem extends MarketingRecipient {
  title: string;
  slug: string;
  prizeValue: number;
  ticketPrice: number;
  isFree: boolean;
  mainImageUrl: string;
  drawDate: Date;
  ticketCount: number;
}

export async function sendCartRecoveryEmails(
  items: CartRecoveryItem[]
): Promise<{ sent: number; total: number }> {
  const messages = items.map((item) => {
    const compUrl = `${BASE_URL}/competitions/${item.slug}`;
    const count = item.ticketCount;
    const ticketWord = count === 1 ? 'ticket' : 'tickets';
    const html = marketingWrapper(
      `
    <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 16px;">You left ${count} ${ticketWord} behind${item.firstName ? `, ${escapeHtml(item.firstName)}` : ''}</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 8px;">
      Your checkout for <strong>${escapeHtml(item.title)}</strong> wasn't completed, so your ${ticketWord} ${count === 1 ? 'is' : 'are'} not entered yet. The competition is still live — pick up where you left off before the draw.
    </p>
    ${competitionCard({
      title: item.title,
      slug: item.slug,
      prizeValue: item.prizeValue,
      ticketPrice: item.ticketPrice,
      isFree: item.isFree,
      mainImageUrl: item.mainImageUrl,
      drawDate: item.drawDate,
    })}
    <div style="text-align: center; margin: 32px 0;">
      <a href="${compUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Complete my entry
      </a>
    </div>
    <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 24px 0 0;">
      Tickets are limited and sell on a first-come basis — entering again takes less than a minute.
    </p>`,
      item.unsubscribeToken
    );
    return {
      to: item.email,
      subject: `You left ${count} ${ticketWord} behind — ${item.title}`,
      html,
      headers: listUnsubscribeHeaders(item.unsubscribeToken),
    };
  });
  return sendMarketingBatch(messages);
}
