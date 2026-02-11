import { Redis as UpstashRedis } from '@upstash/redis';
import { Ratelimit, type Duration } from '@upstash/ratelimit';

// Determine which Redis client to use
const useUpstash = !!process.env.UPSTASH_REDIS_REST_URL;

// Create Upstash client for production
const upstashClient = useUpstash
  ? new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// For rate limiting without Redis, we use in-memory storage (dev only)
interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory rate limiter for development without Redis
const memoryStore = new Map<string, { count: number; resetTime: number }>();

class MemoryRateLimiter {
  private prefix: string;
  private requests: number;
  private window: number; // in seconds

  constructor(opts: { prefix: string; requests: number; window: number }) {
    this.prefix = opts.prefix;
    this.requests = opts.requests;
    this.window = opts.window;
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    const entry = memoryStore.get(key);

    // Clean up if window has passed
    if (entry && now > entry.resetTime) {
      memoryStore.delete(key);
    }

    const current = memoryStore.get(key);

    if (!current) {
      // First request in window
      memoryStore.set(key, { count: 1, resetTime: now + this.window * 1000 });
      return {
        success: true,
        limit: this.requests,
        remaining: this.requests - 1,
        reset: now + this.window * 1000,
      };
    }

    if (current.count >= this.requests) {
      return {
        success: false,
        limit: this.requests,
        remaining: 0,
        reset: current.resetTime,
      };
    }

    current.count++;
    return {
      success: true,
      limit: this.requests,
      remaining: this.requests - current.count,
      reset: current.resetTime,
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

  return new MemoryRateLimiter({
    prefix: opts.prefix,
    requests: opts.requests,
    window: seconds,
  });
}

// Rate limiters for admin endpoints
export const rateLimits = {
  // Admin login: 5 attempts per 15 minutes
  login: createRateLimiter({ requests: 5, window: '15 m', prefix: 'ratelimit:admin:login' }),

  // Password reset: 3 attempts per hour
  passwordReset: createRateLimiter({ requests: 3, window: '1 h', prefix: 'ratelimit:admin:password-reset' }),

  // API: 100 requests per minute for authenticated admins
  api: createRateLimiter({ requests: 100, window: '1 m', prefix: 'ratelimit:admin:api' }),
};
