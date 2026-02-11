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
  del(key: string): PipelineLike;
  exec(): Promise<unknown>;
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
    return {
      set(key: string, value: string, options?: { ex?: number }) {
        if (options?.ex) {
          pipe.setex(key, options.ex, value);
        } else {
          pipe.set(key, value);
        }
        return this;
      },
      del(key: string) {
        pipe.del(key);
        return this;
      },
      async exec() {
        return pipe.exec();
      },
    };
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
    return {
      set(key: string, value: string, options?: { ex?: number }) {
        if (options?.ex) {
          pipe.set(key, value, { ex: options.ex });
        } else {
          pipe.set(key, value);
        }
        return this;
      },
      del(key: string) {
        pipe.del(key);
        return this;
      },
      async exec() {
        return pipe.exec();
      },
    };
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
  // Login: 5 attempts per 15 minutes
  login: createRateLimiter({ requests: 5, window: '15 m', prefix: 'ratelimit:login' }),

  // Signup: 3 attempts per hour
  signup: createRateLimiter({ requests: 3, window: '1 h', prefix: 'ratelimit:signup' }),

  // Password reset: 3 attempts per hour
  passwordReset: createRateLimiter({ requests: 3, window: '1 h', prefix: 'ratelimit:password-reset' }),

  // Ticket reservation: 10 attempts per minute
  ticketReserve: createRateLimiter({ requests: 10, window: '1 m', prefix: 'ratelimit:ticket-reserve' }),

  // Checkout: 5 attempts per 5 minutes
  checkout: createRateLimiter({ requests: 5, window: '5 m', prefix: 'ratelimit:checkout' }),

  // Contact form: 3 attempts per hour
  contact: createRateLimiter({ requests: 3, window: '1 h', prefix: 'ratelimit:contact' }),

  // Global authenticated: 100 per minute
  globalAuth: createRateLimiter({ requests: 100, window: '1 m', prefix: 'ratelimit:global-auth' }),

  // Global unauthenticated: 30 per minute
  globalUnauth: createRateLimiter({ requests: 30, window: '1 m', prefix: 'ratelimit:global-unauth' }),
};

// Ticket reservation lock constants
export const TICKET_RESERVATION_TTL = 600; // 10 minutes in seconds
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

// Reservation data structure
export interface ReservationData {
  userId: string;
  competitionId: string;
  ticketNumbers: number[];
  reservedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
}

// Reserve tickets in Redis using atomic SETNX to prevent race conditions
export async function reserveTicketsInRedis(
  competitionId: string,
  userId: string,
  ticketNumbers: number[]
): Promise<{ success: boolean; expiresAt: number; error?: string }> {
  const reservationKey = getTicketReservationKey(competitionId, userId);
  const expiresAt = Date.now() + TICKET_RESERVATION_TTL * 1000;
  const acquiredLocks: string[] = [];
  const failedTickets: number[] = [];

  // Try to acquire locks atomically using SETNX pattern
  for (const ticketNumber of ticketNumbers) {
    const lockKey = getTicketLockKey(competitionId, ticketNumber);

    // First check if we already own this lock
    const existingLock = await redis.get<string>(lockKey);

    if (existingLock === userId) {
      // We already own this lock - just refresh the TTL
      await redis.expire(lockKey, TICKET_RESERVATION_TTL);
      acquiredLocks.push(lockKey);
    } else if (existingLock) {
      // Already locked by another user
      failedTickets.push(ticketNumber);
    } else {
      // Try to acquire lock atomically with SETNX
      // SETNX returns 1 if the key was set, 0 if it already exists
      const lockAcquired = await redis.setnx(lockKey, userId);

      if (lockAcquired === 1) {
        // Successfully acquired - set TTL
        await redis.expire(lockKey, TICKET_RESERVATION_TTL);
        acquiredLocks.push(lockKey);
      } else {
        // Another user grabbed it between our check and setnx
        // Double-check who owns it now
        const currentOwner = await redis.get<string>(lockKey);
        if (currentOwner === userId) {
          // We somehow got it (race condition resolved in our favor)
          await redis.expire(lockKey, TICKET_RESERVATION_TTL);
          acquiredLocks.push(lockKey);
        } else {
          failedTickets.push(ticketNumber);
        }
      }
    }
  }

  // If any locks failed, rollback all acquired locks
  if (failedTickets.length > 0) {
    // Release any locks we acquired
    if (acquiredLocks.length > 0) {
      const pipeline = redis.pipeline();
      for (const lockKey of acquiredLocks) {
        pipeline.del(lockKey);
      }
      await pipeline.exec();
    }

    return {
      success: false,
      expiresAt: 0,
      error: `Tickets ${failedTickets.join(', ')} are being purchased by another user`,
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

// Check if ticket is locked
export async function isTicketLocked(
  competitionId: string,
  ticketNumber: number,
  excludeUserId?: string
): Promise<boolean> {
  const lockKey = getTicketLockKey(competitionId, ticketNumber);
  const lockedBy = await redis.get<string>(lockKey);
  if (!lockedBy) return false;
  if (excludeUserId && lockedBy === excludeUserId) return false;
  return true;
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
      if (match && match[1]) {
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
  const attempts = await redis.get<number>(attemptKey) || 0;

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

// Get QCM attempt count
export async function getQcmAttempts(
  competitionId: string,
  userId: string
): Promise<number> {
  const attemptKey = getQcmAttemptKey(competitionId, userId);
  const attempts = await redis.get<number>(attemptKey);
  return typeof attempts === 'number' ? attempts : 0;
}
