/**
 * Cloudflare Turnstile verification utility
 * Server-side token verification for captcha
 */

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

interface VerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Verify a Turnstile token with Cloudflare's API
 * @param token The turnstile token from the client
 * @param ip Optional IP address of the user (recommended for security)
 * @returns Verification result
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string
): Promise<VerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY not configured - skipping captcha verification');
    // Allow in development if not configured
    return { success: true };
  }

  if (!token) {
    return {
      success: false,
      error: 'Captcha verification required',
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    if (!response.ok) {
      console.error('Turnstile API error:', response.status, response.statusText);
      return {
        success: false,
        error: 'Captcha verification failed. Please try again.',
      };
    }

    const data: TurnstileVerifyResponse = await response.json();

    if (data.success) {
      return { success: true };
    }

    // Log error codes for debugging
    console.error('Turnstile verification failed:', data['error-codes']);

    return {
      success: false,
      error: 'Captcha verification failed. Please try again.',
    };
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return {
      success: false,
      error: 'Captcha verification failed. Please try again.',
    };
  }
}

/**
 * Enforce captcha verification.
 *
 * Unlike calling `verifyTurnstileToken` only when a token is present, this
 * REQUIRES a valid token whenever Turnstile is configured (i.e. in production).
 * A scripted client that simply omits the token can no longer bypass the check.
 *
 * In development (no `TURNSTILE_SECRET_KEY`), it is a no-op so local flows work.
 *
 * @param token Token from the client (may be undefined/empty)
 * @param ip    Optional requester IP
 */
export async function verifyTurnstileRequired(
  token: string | undefined | null,
  ip?: string
): Promise<VerifyResult> {
  // When Turnstile isn't configured, skip (matches verifyTurnstileToken's dev behaviour).
  if (!process.env.TURNSTILE_SECRET_KEY) {
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'Captcha verification required.' };
  }

  return verifyTurnstileToken(token, ip);
}
