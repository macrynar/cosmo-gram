import { NextResponse } from "next/server";

// TYMCZASOWY endpoint — sprawdza OBECNOŚĆ kluczowych env na projekcie serwującym www.
// Zwraca tylko true/false (czy zmienna istnieje), NIGDY wartości. Do usunięcia po diagnozie.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Realne nazwy z kodu (grep process.env.*). Podzielone na must-have i opcjonalne.
const REQUIRED = [
  "ANTHROPIC_API_KEY",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_MONTHLY",
  "STRIPE_PRICE_YEARLY",
  "NEXT_PUBLIC_APP_URL",
  "STRIPE_PRICE_CHAT_PACK_SMALL",
  "STRIPE_PRICE_CHAT_PACK_MEDIUM",
  "STRIPE_PRICE_CHAT_PACK_LARGE",
];
// Działa bez nich, ale lepiej mieć (analityka / rate-limit; rateLimiter ma no-op).
const OPTIONAL = [
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_POSTHOG_HOST",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

const has = (k: string) => (process.env[k]?.length ?? 0) > 0;

export async function GET() {
  const missingRequired = REQUIRED.filter((k) => !has(k));
  const missingOptional = OPTIONAL.filter((k) => !has(k));
  return NextResponse.json({
    missingRequired,
    missingOptional,
    allRequiredPresent: missingRequired.length === 0,
    marker: "envcheck-v4",
  });
}
