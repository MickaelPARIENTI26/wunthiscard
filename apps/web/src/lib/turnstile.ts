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
    // Fail CLOSED in production: a missing secret key must not silently
    // disable captcha protection. In non-production, skip so local dev/test
    // flows work without Turnstile configured.
    if (process.env.NODE_ENV === 'production') {
      console.error('TURNSTILE_SECRET_KEY not configured - rejecting request (fail closed)');
      return {
        success: false,
        error: 'Captcha verification is temporarily unavailable. Please try again later.',
      };
    }
    console.warn('TURNSTILE_SECRET_KEY not configured - skipping captcha verification');
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
  // When Turnstile isn't configured: fail CLOSED in production, skip in dev/test
  // (matches verifyTurnstileToken's behaviour).
  if (!process.env.TURNSTILE_SECRET_KEY) {
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        error: 'Captcha verification is temporarily unavailable. Please try again later.',
      };
    }
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'Captcha verification required.' };
  }

  return verifyTurnstileToken(token, ip);
}
