import { Resend } from 'resend';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set - emails will not be sent');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@lucky-tcg.com';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}

export async function sendEmail({ to, subject, html, text, headers }: SendEmailOptions) {
  if (!resend) {
    if (IS_PRODUCTION) {
      // Never report success in prod — winner notifications would be recorded as
      // sent when they weren't. Fail loudly so the caller can surface it.
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
    competition_url: 'https://lucky-tcg.com/competitions/charizard-psa10',
    competition_category: 'Pokémon',

    // Order data
    order_id: 'LTC-20260301-0042',
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
    site_url: 'https://lucky-tcg.com',
    site_name: 'Lucky TCG',
    site_logo_url: 'https://lucky-tcg.com/logo-email.png',
    current_year: new Date().getFullYear().toString(),

    // Action URLs
    unsubscribe_url: 'https://lucky-tcg.com/unsubscribe?token=test',
    verification_url: 'https://lucky-tcg.com/verify?token=test',
    cart_url: 'https://lucky-tcg.com/cart?recover=test',
  };
}

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
        Lucky TCG Ltd. | Registered in England & Wales
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
  const winsUrl = `${BASE_URL}/my-wins`;

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
      If you have any questions, please contact us at contact@lucky-tcg.com
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
      Questions? Contact us at contact@lucky-tcg.com
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

// ============================================================================
// LIFECYCLE BLASTS (triggered from admin actions)
// ----------------------------------------------------------------------------
// - New competition: MARKETING → opted-in users only, requires unsubscribe.
// - Draw results:    TRANSACTIONAL → all participants, no unsubscribe needed.
// Both go out in Resend batches (<=100 per call) so a single draw/launch is a
// handful of HTTP calls rather than hundreds.
// ============================================================================

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface MarketingRecipient {
  email: string;
  firstName: string;
  unsubscribeToken: string;
}

function unsubscribeUrl(token: string): string {
  return `${BASE_URL}/unsubscribe?token=${encodeURIComponent(token)}`;
}

function listUnsubscribeHeaders(token: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${BASE_URL}/api/unsubscribe?token=${encodeURIComponent(token)}>, <mailto:contact@lucky-tcg.com?subject=unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

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

// Chunked batch send (Resend accepts up to 100 per batch). Never throws.
async function sendBatch(
  messages: { to: string; subject: string; html: string; headers?: Record<string, string> }[]
): Promise<{ sent: number; total: number }> {
  const total = messages.length;
  if (total === 0) return { sent: 0, total: 0 };

  if (!resend) {
    if (IS_PRODUCTION) {
      console.error(`Batch NOT sent — RESEND_API_KEY missing in production (${total} messages)`);
      return { sent: 0, total };
    }
    console.log(`Batch would send ${total} emails (dev, no RESEND_API_KEY)`);
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
        console.error('Batch chunk failed:', error);
      } else {
        sent += chunk.length;
      }
    } catch (err) {
      console.error('Batch chunk threw:', err);
    }
  }
  return { sent, total };
}

// --- New competition live (marketing) -------------------------------------
export interface CompetitionBlastData {
  title: string;
  slug: string;
  prizeValue: number;
  ticketPrice: number;
  isFree: boolean;
  mainImageUrl: string;
  drawDate: Date;
}

export async function sendNewCompetitionBlast(
  recipients: MarketingRecipient[],
  data: CompetitionBlastData
): Promise<{ sent: number; total: number }> {
  const compUrl = `${BASE_URL}/competitions/${data.slug}`;
  const prize = formatPrice(data.prizeValue);
  const priceLine = data.isFree ? 'Free entry' : `Tickets from ${formatPrice(data.ticketPrice)}`;
  const drawFormatted = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short' }).format(
    new Date(data.drawDate)
  );
  const card = `
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      ${data.mainImageUrl ? `<img src="${escapeHtml(data.mainImageUrl)}" alt="${escapeHtml(data.title)}" style="max-width: 100%; height: auto; border-radius: 6px; margin-bottom: 16px;">` : ''}
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 700; margin: 0 0 8px;">${escapeHtml(data.title)}</p>
      <p style="color: #16a34a; font-size: 16px; font-weight: 600; margin: 0 0 4px;">Prize value ${prize}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">${priceLine} · Draw ${drawFormatted}</p>
    </div>`;

  const messages = recipients.map((r) => ({
    to: r.email,
    subject: `🎴 New drop: ${data.title}`,
    html: marketingWrapper(
      `
    <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 16px;">🎴 New drop is live${r.firstName ? `, ${escapeHtml(r.firstName)}` : ''}!</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 8px;">
      A new competition just went live on Lucky TCG. Get your tickets before it's gone.
    </p>
    ${card}
    <div style="text-align: center; margin: 32px 0;">
      <a href="${compUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">Enter now</a>
    </div>`,
      r.unsubscribeToken
    ),
    headers: listUnsubscribeHeaders(r.unsubscribeToken),
  }));

  return sendBatch(messages);
}

// --- Draw results to participants (transactional) -------------------------
export interface DrawResultsRecipient {
  email: string;
  firstName: string;
}

export async function sendDrawResultsBlast(
  participants: DrawResultsRecipient[],
  data: DrawCompleteNotificationData
): Promise<{ sent: number; total: number }> {
  const competitionsUrl = `${BASE_URL}/competitions`;
  const title = escapeHtml(data.competitionTitle);
  const winner = escapeHtml(data.winnerName);

  const messages = participants.map((p) => ({
    to: p.email,
    subject: `Draw Complete: ${data.competitionTitle}`,
    html: emailWrapper(`
    <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Competition Complete</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
      Hi ${escapeHtml(p.firstName)}, the draw for <strong>${title}</strong> has been completed.
    </p>
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Winning Ticket</p>
      <p style="color: #1a1a1a; font-size: 32px; font-weight: bold; margin: 0 0 16px;">#${data.winningTicketNumber}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 4px;">Winner</p>
      <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0;">${winner}</p>
    </div>
    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
      Your ticket wasn't selected this time. Better luck next time!
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${competitionsUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">Browse More Competitions</a>
    </div>
    <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 24px 0 0;">Thank you for participating!</p>
  `),
  }));

  return sendBatch(messages);
}
