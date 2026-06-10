import { NextResponse } from "next/server";

// Graceful no-op when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set.
// Set those env vars and this becomes a real distributed rate limiter.

let ratelimit: {
  ai:   { limit: (id: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };
  chat: { limit: (id: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };
  geo:  { limit: (id: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };
} | null = null;

async function getRatelimiter() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (ratelimit) return ratelimit;

  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis }     = await import("@upstash/redis");
  const redis = Redis.fromEnv();

  ratelimit = {
    // AI generation: 5 req / 60 s per user/IP
    ai:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  "60 s"), prefix: "rl:ai" }),
    // Chat messages: 15 req / 60 s per user/IP
    chat: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(15, "60 s"), prefix: "rl:chat" }),
    // Geocoding: 30 req / 60 s per IP
    geo:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60 s"), prefix: "rl:geo" }),
  };
  return ratelimit;
}

type LimiterKey = "ai" | "chat" | "geo";

/**
 * Returns a 429 NextResponse if the identifier has exceeded the limit, otherwise null.
 * identifier should be userId for authenticated endpoints, or IP for anonymous ones.
 */
export async function checkRateLimit(
  key: LimiterKey,
  identifier: string,
): Promise<NextResponse | null> {
  const rl = await getRatelimiter();
  if (!rl) return null; // Upstash not configured — no-op in dev

  const { success, limit, remaining, reset } = await rl[key].limit(identifier);

  const headers = {
    "X-RateLimit-Limit":     String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset":     String(reset),
  };

  if (!success) {
    return NextResponse.json(
      { error: "Zbyt wiele żądań. Spróbuj za chwilę." },
      {
        status: 429,
        headers: {
          ...headers,
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    );
  }
  return null;
}
