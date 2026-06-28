import { Redis as UpstashRedis } from '@upstash/redis';
import { Ratelimit, type Duration } from '@upstash/ratelimit';
import IORedis from 'ioredis';

// Determine which Redis client to use
const useUpstash = !!process.env.UPSTASH_REDIS_REST_URL;

// Create IORedis client for local development
const ioRedisClient = !useUpstash && process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL)
  : null;

// Create Upstash client for production
const upstashClient = useUpstash
  ? new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Unified Redis interface that works with both clients
interface RedisLike {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: string, options?: { ex?: number }): Promise<unknown>;
  setnx(key: string, value: string): Promise<number>; // Returns 1 if set, 0 if key exists
  del(key: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  exists(key: string): Promise<number>;
  scan(cursor: number, options: { match: string; count: number }): Promise<[number, string[]]>;
  pipeline(): PipelineLike;
}

interface PipelineLike {
  set(key: string, value: string, options?: { ex?: number }): PipelineLike;
  // Atomic set-if-not-exists with expiry (SET key val NX EX ttl). Queued in the
  // pipeline; on exec the result is the SET reply: OK when it set the key, null
  // when the key already existed (NX lost), so callers can detect races.
  setNxEx(key: string, value: string, ttlSeconds: number): PipelineLike;
  expire(key: string, seconds: number): PipelineLike;
  get(key: string): PipelineLike;
  del(key: string): PipelineLike;
  exec(): Promise<unknown[]>;
}

// Create a unified wrapper
class LocalRedisWrapper implements RedisLike {
  private client: IORedis;

  constructor(client: IORedis) {
    this.client = client;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: string, options?: { ex?: number }): Promise<unknown> {
    if (options?.ex) {
      return this.client.setex(key, options.ex, value);
    }
    return this.client.set(key, value);
  }

  async setnx(key: string, value: string): Promise<number> {
    return this.client.setnx(key, value);
  }

  async del(key: string): Promise<unknown> {
    return this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<unknown> {
    return this.client.expire(key, seconds);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async scan(cursor: number, options: { match: string; count: number }): Promise<[number, string[]]> {
    const result = await this.client.scan(cursor, 'MATCH', options.match, 'COUNT', options.count);
    return [parseInt(result[0], 10), result[1]];
  }

  pipeline(): PipelineLike {
    const pipe = this.client.pipeline();
    const self: PipelineLike = {
      set(key: string, value: string, options?: { ex?: number }) {
        if (options?.ex) {
          pipe.setex(key, options.ex, value);
        } else {
          pipe.set(key, value);
        }
        return self;
      },
      setNxEx(key: string, value: string, ttlSeconds: number) {
        pipe.set(key, value, 'EX', ttlSeconds, 'NX');
        return self;
      },
      expire(key: string, seconds: number) {
        pipe.expire(key, seconds);
        return self;
      },
      get(key: string) {
        pipe.get(key);
        return self;
      },
      del(key: string) {
        pipe.del(key);
        return self;
      },
      async exec() {
        // ioredis exec() returns Array<[error, result]>; surface the results so
        // callers see the same shape as Upstash (array of replies).
        const res = await pipe.exec();
        return (res ?? []).map((entry) => (Array.isArray(entry) ? entry[1] : entry));
      },
    };
    return self;
  }
}

// Upstash Redis wrapper
class UpstashRedisWrapper implements RedisLike {
  private client: UpstashRedis;

  constructor(client: UpstashRedis) {
    this.client = client;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.client.get<T>(key);
  }

  async set(key: string, value: string, options?: { ex?: number }): Promise<unknown> {
    if (options?.ex) {
      return this.client.set(key, value, { ex: options.ex });
    }
    return this.client.set(key, value);
  }

  async setnx(key: string, value: string): Promise<number> {
    return this.client.setnx(key, value);
  }

  async del(key: string): Promise<unknown> {
    return this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<unknown> {
    return this.client.expire(key, seconds);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async scan(cursor: number, options: { match: string; count: number }): Promise<[number, string[]]> {
    const result = await this.client.scan(cursor, { match: options.match, count: options.count });
    // Upstash returns cursor as string, convert to number
    return [typeof result[0] === 'string' ? parseInt(result[0], 10) : result[0], result[1]];
  }

  pipeline(): PipelineLike {
    const pipe = this.client.pipeline();
    const self: PipelineLike = {
      set(key: string, value: string, options?: { ex?: number }) {
        if (options?.ex) {
          pipe.set(key, value, { ex: options.ex });
        } else {
          pipe.set(key, value);
        }
        return self;
      },
      setNxEx(key: string, value: string, ttlSeconds: number) {
        pipe.set(key, value, { nx: true, ex: ttlSeconds });
        return self;
      },
      expire(key: string, seconds: number) {
        pipe.expire(key, seconds);
        return self;
      },
      get(key: string) {
        pipe.get(key);
        return self;
      },
      del(key: string) {
        pipe.del(key);
        return self;
      },
      async exec() {
        // Upstash exec() already returns an array of replies, one per command.
        return pipe.exec<unknown[]>();
      },
    };
    return self;
  }
}

// Export the unified redis client
export const redis: RedisLike = useUpstash && upstashClient
  ? new UpstashRedisWrapper(upstashClient)
  : ioRedisClient
    ? new LocalRedisWrapper(ioRedisClient)
    : (() => {
        throw new Error('Redis not configured. Set REDIS_URL or UPSTASH_REDIS_REST_URL');
      })();

// For rate limiting, we need to create a mock or use Upstash only
// Since @upstash/ratelimit requires Upstash Redis, we create a simple local alternative

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class LocalRateLimiter {
  private prefix: string;
  private requests: number;
  private window: number; // in seconds

  constructor(opts: { prefix: string; requests: number; window: number }) {
    this.prefix = opts.prefix;
    this.requests = opts.requests;
    this.window = opts.window;
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    if (!ioRedisClient) {
      return { success: true, limit: this.requests, remaining: this.requests, reset: 0 };
    }

    const key = `${this.prefix}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - this.window;

    // Remove old entries
    await ioRedisClient.zremrangebyscore(key, 0, windowStart);

    // Count current entries
    const count = await ioRedisClient.zcard(key);

    if (count >= this.requests) {
      const oldest = await ioRedisClient.zrange(key, 0, 0, 'WITHSCORES');
      const oldestScore = oldest.length >= 2 && oldest[1] ? oldest[1] : null;
      const reset = oldestScore ? parseInt(oldestScore, 10) + this.window : now + this.window;
      return {
        success: false,
        limit: this.requests,
        remaining: 0,
        reset,
      };
    }

    // Add new entry
    await ioRedisClient.zadd(key, now, `${now}-${Math.random()}`);
    await ioRedisClient.expire(key, this.window);

    return {
      success: true,
      limit: this.requests,
      remaining: this.requests - count - 1,
      reset: now + this.window,
    };
  }
}

// Create rate limiters based on environment
function createRateLimiter(opts: { requests: number; window: string; prefix: string }) {
  // Parse window string (e.g., "15 m", "1 h", "1 m")
  const match = opts.window.match(/^(\d+)\s*([mhs])$/);
  if (!match || !match[1] || !match[2]) throw new Error(`Invalid window format: ${opts.window}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];
  let seconds: number;

  switch (unit) {
    case 's':
      seconds = value;
      break;
    case 'm':
      seconds = value * 60;
      break;
    case 'h':
      seconds = value * 3600;
      break;
    default:
      seconds = value * 60;
  }

  if (useUpstash && upstashClient) {
    return new Ratelimit({
      redis: upstashClient,
      limiter: Ratelimit.slidingWindow(opts.requests, opts.window as Duration),
      prefix: opts.prefix,
    });
  }

  return new LocalRateLimiter({
    prefix: opts.prefix,
    requests: opts.requests,
    window: seconds,
  });
}

// Rate limiters for different endpoints
export const rateLimits = {
  // Login: 5 attempts per 15 minutes (keyed per-account email).
  login: createRateLimiter({ requests: 5, window: '15 m', prefix: 'ratelimit:login' }),

  // Login (per-IP): looser cap to throttle credential-stuffing / password-
  // spraying across many accounts from a single source, without locking out
  // shared/NAT IPs (CGNAT, offices, cafés) doing legitimate logins.
  loginIp: createRateLimiter({ requests: 30, window: '15 m', prefix: 'ratelimit:login-ip' }),

  // Signup: 10 attempts per hour. CAPTCHA (Turnstile) is the primary bot
  // defense; this is just a safety net. Kept generous so multiple real users
  // behind one shared/carrier IP (CGNAT, offices, cafés) aren't locked out.
  signup: createRateLimiter({ requests: 10, window: '1 h', prefix: 'ratelimit:signup' }),

  // Password reset: 3 attempts per hour
  passwordReset: createRateLimiter({ requests: 3, window: '1 h', prefix: 'ratelimit:password-reset' }),

  // Ticket reservation: 10 attempts per minute
  ticketReserve: createRateLimiter({ requests: 10, window: '1 m', prefix: 'ratelimit:ticket-reserve' }),

  // Checkout: 5 attempts per 5 minutes
  checkout: createRateLimiter({ requests: 5, window: '5 m', prefix: 'ratelimit:checkout' }),

  // Contact form: 3 attempts per hour
  contact: createRateLimiter({ requests: 3, window: '1 h', prefix: 'ratelimit:contact' }),

  // Avatar upload: 10 per hour per user (prevents R2 storage/egress abuse from one account).
  avatarUpload: createRateLimiter({ requests: 10, window: '1 h', prefix: 'ratelimit:avatar' }),

  // Global unauthenticated: 30 per minute (used by the public ticket-status poll)
  globalUnauth: createRateLimiter({ requests: 30, window: '1 m', prefix: 'ratelimit:global-unauth' }),
};

// Ticket reservation lock constants
export const TICKET_RESERVATION_TTL = 300; // 5 minutes — selection/skill-question window
// Once the buyer commits to paying, the hold is extended to outlast the Stripe
// Checkout session (30 min — see create-session expires_at) so their reserved
// numbers can't be resold to someone else while they sit on the payment page.
export const CHECKOUT_RESERVATION_TTL = 31 * 60; // 31 minutes in seconds
export const QCM_ATTEMPT_TTL = 900; // 15 minutes in seconds
export const MAX_QCM_ATTEMPTS = 3;

// Ticket reservation lock keys
export function getTicketReservationKey(competitionId: string, userId: string): string {
  return `reservation:${competitionId}:${userId}`;
}

export function getTicketLockKey(competitionId: string, ticketNumber: number): string {
  return `ticket-lock:${competitionId}:${ticketNumber}`;
}

export function getQcmAttemptKey(competitionId: string, userId: string): string {
  return `qcm-attempts:${competitionId}:${userId}`;
}

export function getQcmBlockKey(competitionId: string, userId: string): string {
  return `qcm-block:${competitionId}:${userId}`;
}

export function getQcmPassedKey(competitionId: string, userId: string): string {
  return `qcm-passed:${competitionId}:${userId}`;
}

// Free-entry ticket-number allocation (unlimited free competitions)
// ------------------------------------------------------------------
// Unlimited free competitions create ticket rows on demand, so the next
// ticketNumber can't come from COUNT(*): that read serialises concurrent
// entries and, under load, races to the same number (duplicate-key 409s /
// exhausted retries). Instead we keep a per-competition Redis counter and use
// atomic INCR, which is monotonic and collision-free across concurrent callers.
// The counter is seeded lazily — and atomically, via SETNX so only the first
// caller seeds — from the current max ticketNumber in Postgres, so it stays
// consistent with any rows that already exist (e.g. created before this counter
// was introduced, or via the admin assignment path).
export function getFreeEntryTicketCounterKey(competitionId: string): string {
  return `free-entry-ticket-counter:${competitionId}`;
}

export async function nextFreeEntryTicketNumber(
  competitionId: string,
  // Lazily computes the current max ticketNumber for this competition. Only
  // invoked when the counter has not been seeded yet.
  getCurrentMax: () => Promise<number>
): Promise<number> {
  const key = getFreeEntryTicketCounterKey(competitionId);

  // Seed the counter once, atomically. SETNX only succeeds for the first caller;
  // everyone else sees the key already present and skips straight to INCR. We
  // seed to the current max so the first INCR yields max + 1.
  const exists = await redis.exists(key);
  if (exists === 0) {
    const currentMax = await getCurrentMax();
    await redis.setnx(key, String(currentMax));
  }

  // Atomic, monotonic allocation — never returns the same number twice.
  return redis.incr(key);
}

// Reservation data structure
export interface ReservationData {
  userId: string;
  competitionId: string;
  ticketNumbers: number[];
  reservedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
}

// Reserve tickets in Redis using atomic SET ... NX EX to prevent race
// conditions. The work is batched so the number of Redis round-trips stays
// roughly constant regardless of how many tickets are reserved (instead of the
// old ~2-3 sequential awaits per ticket):
//   1. one pipelined GET of every lock key to classify free / held-by-me /
//      held-by-others — if ANY is held by another user, fail before taking any;
//   2. one pipeline that atomically SET..NX..EX every free lock and refreshes
//      the TTL of locks we already hold;
//   3. verify each of our NX sets actually won (NX returns null when the key
//      already existed, i.e. someone raced us); if any lost, release the locks
//      we won in this call and fail.
export async function reserveTicketsInRedis(
  competitionId: string,
  userId: string,
  ticketNumbers: number[]
): Promise<{ success: boolean; expiresAt: number; error?: string }> {
  const reservationKey = getTicketReservationKey(competitionId, userId);
  const expiresAt = Date.now() + TICKET_RESERVATION_TTL * 1000;

  // Stable, de-duplicated key list so pipeline result indexes line up exactly
  // with the keys we queued. (A ticket number appearing twice would otherwise
  // make us SET..NX the same key twice and treat the second as a lost race.)
  const lockKeys = [...new Set(ticketNumbers)].map((ticketNumber) => ({
    ticketNumber,
    lockKey: getTicketLockKey(competitionId, ticketNumber),
  }));

  if (lockKeys.length === 0) {
    return { success: false, expiresAt: 0, error: 'No tickets requested' };
  }

  // Step 1 — one pipelined GET of all lock keys to see current ownership.
  const getPipeline = redis.pipeline();
  for (const { lockKey } of lockKeys) {
    getPipeline.get(lockKey);
  }
  const owners = await getPipeline.exec();

  const heldByOthers: number[] = [];
  // Keys we need to acquire fresh (currently free) vs. keys we already own and
  // only need to refresh.
  const toAcquire: { ticketNumber: number; lockKey: string }[] = [];
  const toRefresh: string[] = [];

  lockKeys.forEach(({ ticketNumber, lockKey }, i) => {
    const owner = owners[i] == null ? null : String(owners[i]);
    if (owner === null) {
      toAcquire.push({ ticketNumber, lockKey });
    } else if (owner === userId) {
      toRefresh.push(lockKey);
    } else {
      heldByOthers.push(ticketNumber);
    }
  });

  // If anything is already locked by someone else, acquire none and fail.
  if (heldByOthers.length > 0) {
    return {
      success: false,
      expiresAt: 0,
      error: `Tickets ${heldByOthers.join(', ')} are being purchased by another user`,
    };
  }

  // Step 2 — one pipeline: atomically SET..NX..EX every free lock and refresh
  // the TTL of locks we already hold.
  const acquirePipeline = redis.pipeline();
  for (const { lockKey } of toAcquire) {
    acquirePipeline.setNxEx(lockKey, userId, TICKET_RESERVATION_TTL);
  }
  for (const lockKey of toRefresh) {
    acquirePipeline.expire(lockKey, TICKET_RESERVATION_TTL);
  }
  const acquireResults = await acquirePipeline.exec();

  // Step 3 — verify our NX sets won. The first `toAcquire.length` results
  // correspond to the SET..NX calls (in order); a null/falsy reply means the
  // key already existed, i.e. another user raced us to it after step 1.
  const wonLocks: string[] = [];
  const lostTickets: number[] = [];
  toAcquire.forEach(({ ticketNumber, lockKey }, i) => {
    if (acquireResults[i]) {
      wonLocks.push(lockKey);
    } else {
      lostTickets.push(ticketNumber);
    }
  });

  // If we lost any race, release only the locks we won in THIS call (the
  // refreshed ones were already ours and stay reserved) and fail.
  if (lostTickets.length > 0) {
    if (wonLocks.length > 0) {
      const rollback = redis.pipeline();
      for (const lockKey of wonLocks) {
        rollback.del(lockKey);
      }
      await rollback.exec();
    }

    return {
      success: false,
      expiresAt: 0,
      error: `Tickets ${lostTickets.join(', ')} are being purchased by another user`,
    };
  }

  // All locks acquired successfully - store reservation data
  const reservationData: ReservationData = {
    userId,
    competitionId,
    ticketNumbers,
    reservedAt: Date.now(),
    expiresAt,
  };
  await redis.set(reservationKey, JSON.stringify(reservationData), { ex: TICKET_RESERVATION_TTL });

  return { success: true, expiresAt };
}

// Release tickets from Redis
export async function releaseTicketsFromRedis(
  competitionId: string,
  userId: string
): Promise<void> {
  const reservationKey = getTicketReservationKey(competitionId, userId);

  // Get reservation data
  const reservationDataStr = await redis.get<string>(reservationKey);
  if (!reservationDataStr) {
    return; // No reservation to release
  }

  const reservationData: ReservationData = typeof reservationDataStr === 'string'
    ? JSON.parse(reservationDataStr)
    : reservationDataStr;

  // Delete all locks
  const pipeline = redis.pipeline();
  pipeline.del(reservationKey);

  for (const ticketNumber of reservationData.ticketNumbers) {
    const lockKey = getTicketLockKey(competitionId, ticketNumber);
    pipeline.del(lockKey);
  }

  await pipeline.exec();
}

// Get reservation data
export async function getReservation(
  competitionId: string,
  userId: string
): Promise<ReservationData | null> {
  const reservationKey = getTicketReservationKey(competitionId, userId);
  const data = await redis.get<string>(reservationKey);
  if (!data) return null;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

// Extend/refresh an existing reservation TTL
export async function extendReservation(
  competitionId: string,
  userId: string,
  ttlSeconds: number = TICKET_RESERVATION_TTL
): Promise<{ success: boolean; expiresAt: number }> {
  const reservationKey = getTicketReservationKey(competitionId, userId);
  const data = await redis.get<string>(reservationKey);

  if (!data) {
    return { success: false, expiresAt: 0 };
  }

  const reservationData: ReservationData = typeof data === 'string' ? JSON.parse(data) : data;
  const newExpiresAt = Date.now() + ttlSeconds * 1000;

  // Update reservation with new expiry
  reservationData.expiresAt = newExpiresAt;
  await redis.set(reservationKey, JSON.stringify(reservationData), { ex: ttlSeconds });

  // Also extend all ticket locks
  for (const ticketNumber of reservationData.ticketNumbers) {
    const lockKey = getTicketLockKey(competitionId, ticketNumber);
    const lockedBy = await redis.get<string>(lockKey);
    if (lockedBy === userId) {
      await redis.expire(lockKey, ttlSeconds);
    }
  }

  return { success: true, expiresAt: newExpiresAt };
}

// Recreate a reservation from ticket numbers (used when reservation expired but sessionStorage still has data)
export async function recreateReservation(
  competitionId: string,
  userId: string,
  ticketNumbers: number[]
): Promise<{ success: boolean; expiresAt: number; error?: string }> {
  // Simply call reserveTicketsInRedis - it handles atomicity
  return reserveTicketsInRedis(competitionId, userId, ticketNumbers);
}

// Get all locked ticket numbers for a competition
export async function getLockedTickets(competitionId: string): Promise<number[]> {
  // Use SCAN to find all keys matching the pattern
  const pattern = `ticket-lock:${competitionId}:*`;
  const lockedNumbers: number[] = [];

  let cursor = 0;
  do {
    const result = await redis.scan(cursor, { match: pattern, count: 100 });
    cursor = result[0];
    const keys = result[1];

    for (const key of keys) {
      const match = key.match(/ticket-lock:[^:]+:(\d+)/);
      if (match?.[1]) {
        lockedNumbers.push(parseInt(match[1], 10));
      }
    }
  } while (cursor !== 0);

  return lockedNumbers;
}

// QCM attempt tracking
export async function recordQcmAttempt(
  competitionId: string,
  userId: string
): Promise<{ attempts: number; maxAttempts: number; blocked: boolean; blockUntil?: number }> {
  const attemptKey = getQcmAttemptKey(competitionId, userId);
  const blockKey = getQcmBlockKey(competitionId, userId);

  // Check if blocked
  const isBlocked = await redis.exists(blockKey);
  if (isBlocked) {
    return { attempts: MAX_QCM_ATTEMPTS, maxAttempts: MAX_QCM_ATTEMPTS, blocked: true };
  }

  // Increment attempts
  const attempts = await redis.incr(attemptKey);

  // Set TTL on first attempt
  if (attempts === 1) {
    await redis.expire(attemptKey, QCM_ATTEMPT_TTL);
  }

  // Block if max attempts reached
  if (attempts >= MAX_QCM_ATTEMPTS) {
    await redis.set(blockKey, '1', { ex: QCM_ATTEMPT_TTL });
    const blockUntil = Date.now() + QCM_ATTEMPT_TTL * 1000;
    return { attempts, maxAttempts: MAX_QCM_ATTEMPTS, blocked: true, blockUntil };
  }

  return { attempts, maxAttempts: MAX_QCM_ATTEMPTS, blocked: false };
}

// Check if user is blocked from QCM
export async function isQcmBlocked(
  competitionId: string,
  userId: string
): Promise<{ blocked: boolean; remainingTime: number; attempts: number }> {
  const blockKey = getQcmBlockKey(competitionId, userId);
  const attemptKey = getQcmAttemptKey(competitionId, userId);

  const isBlocked = await redis.exists(blockKey);
  const attempts = await redis.get<number>(attemptKey) ?? 0;

  if (isBlocked === 1) {
    // Estimate remaining time (TTL is QCM_ATTEMPT_TTL seconds)
    return { blocked: true, remainingTime: QCM_ATTEMPT_TTL, attempts: MAX_QCM_ATTEMPTS };
  }

  return { blocked: false, remainingTime: 0, attempts: typeof attempts === 'number' ? attempts : 0 };
}

// Mark QCM as passed
export async function markQcmPassed(
  competitionId: string,
  userId: string
): Promise<void> {
  const passedKey = getQcmPassedKey(competitionId, userId);
  // Keep for 1 hour - enough time to complete checkout
  await redis.set(passedKey, '1', { ex: 3600 });
}

// Check if QCM was passed
export async function hasPassedQcm(
  competitionId: string,
  userId: string
): Promise<boolean> {
  const passedKey = getQcmPassedKey(competitionId, userId);
  const passed = await redis.exists(passedKey);
  return passed === 1;
}

// Consume the QCM pass so the skill question is required again for the NEXT
// purchase (per-purchase entry, per business_rules.md) rather than reusable for
// the whole 1h window.
export async function clearQcmPassed(
  competitionId: string,
  userId: string
): Promise<void> {
  const passedKey = getQcmPassedKey(competitionId, userId);
  await redis.del(passedKey);
}

// --- Credentials sign-in grant ---------------------------------------------
// The login endpoint (/api/auth/callback/credentials) enforces a server-side
// Turnstile captcha. The post-registration auto-login uses the SAME endpoint but
// has no fresh captcha token (the one solved during registration is single-use).
// So a successful, captcha-verified registration mints a short-lived, single-use
// "sign-in grant" keyed by email; the login wrapper accepts it in lieu of a captcha
// token. Obtaining a grant requires completing a captcha'd, rate-limited
// registration, so it cannot be used to bypass the login captcha.

function getCredentialsSignInGrantKey(email: string): string {
  return `signin-grant:${email.toLowerCase()}`;
}

export async function grantCredentialsSignIn(email: string): Promise<void> {
  try {
    await redis.set(getCredentialsSignInGrantKey(email), '1', { ex: 120 });
  } catch (e) {
    // Non-blocking: if the grant can't be stored the auto-login simply falls back
    // to the captcha path (and will fail closed), which is acceptable degradation.
    console.error('Failed to mint credentials sign-in grant (non-blocking):', e);
  }
}

// Consume (single-use) a sign-in grant. Returns true only if a grant existed.
// Fails CLOSED on Redis error (treated as "no grant") so a Redis hiccup can't be
// leveraged to skip the login captcha.
export async function consumeCredentialsSignIn(email: string): Promise<boolean> {
  try {
    const key = getCredentialsSignInGrantKey(email);
    const existed = await redis.exists(key);
    if (existed === 1) {
      await redis.del(key);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Credentials sign-in grant check failed (treating as no grant):', e);
    return false;
  }
}
