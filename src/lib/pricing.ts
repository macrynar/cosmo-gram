// Jedno źródło prawdy dla cen, limitów i capów (model biznesowy 2026-06-25).
// CZYSTE stałe — bezpieczne do importu po stronie klienta i serwera (zero zależności
// serwerowych). Zmiana cennika/limitów = edycja tu (atomowo, łatwe A/B 24,99 vs 19,99).
//
// UWAGA: realne kwoty pobierane przez Stripe żyją w obiektach Stripe Price (env
// STRIPE_PRICE_*). Stringi poniżej to TYLKO wyświetlanie — muszą się zgadzać z Stripe.

// ── Subskrypcja Plus ──
export const PLAN_PRICES = {
  monthly: { amount: "24,99 zł", period: "/ miesiąc" },
  annual:  { amount: "199 zł", period: "/ rok", perMonth: "≈ 16,58 zł/mc", saving: "oszczędzasz ~33%" },
} as const;

// ── Cosmo Chat ──
export const FREE_CHAT_MESSAGES = 3;
export const PREMIUM_MONTHLY_CHAT_LIMIT = 50; // z 150

// ── Paczki czatu (wyświetlane ceny; kredyty bez zmian) ──
// Ceny utrzymane (stare): 9,99 / 24,99 / 199 — zgodne z aktualnymi Stripe Price.
export type ChatPackSize = "small" | "medium" | "large";
export const CHAT_PACKS: { size: ChatPackSize; messages: number; price: string; badge?: string }[] = [
  { size: "small",  messages: 50,  price: "9,99 zł" },
  { size: "medium", messages: 150, price: "24,99 zł", badge: "Popularne" },
  { size: "large",  messages: 500, price: "199,00 zł" },
];

// ── Anti-abuse capy generacji AI (delete-proof, §2.4/2.5/2.6) ──
// Free: limit lifetime (1× każda funkcja). Premium: cap miesięczny.
export const FREE_GENERATION_LIMIT = 1;
export const PREMIUM_MONTHLY_GENERATION_CAP = 5;
