import { NextResponse } from "next/server";

// TYMCZASOWY endpoint — sprawdza OBECNOŚĆ kluczowych env na projekcie serwującym www.
// Zwraca tylko true/false (czy zmienna istnieje), NIGDY wartości. Do usunięcia po diagnozie.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEYS = [
  "CRON_SECRET",
  "RESEND_API_KEY",
  "ANTHROPIC_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_STRIPE_PRICE_ID",
  "RESEND_FROM",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "STRIPE_PRICE_CHAT_PACK_SMALL",
  "STRIPE_PRICE_CHAT_PACK_MEDIUM",
  "STRIPE_PRICE_CHAT_PACK_LARGE",
];

export async function GET() {
  const present: Record<string, boolean> = {};
  const missing: string[] = [];
  for (const k of KEYS) {
    const ok = (process.env[k]?.length ?? 0) > 0;
    present[k] = ok;
    if (!ok) missing.push(k);
  }
  return NextResponse.json({ present, missing, allPresent: missing.length === 0, marker: "envcheck-v3" });
}
