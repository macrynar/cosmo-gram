import { supabaseAdmin } from "@/lib/supabase-server";

// Delete-proof, monthly anti-abuse counters (patrz migracja 20260625_usage_counters.sql).
// Licznik liczy UTWORZENIA w miesiącu kalendarzowym i NIE jest dekrementowany przy
// usunięciu rekordu — dzięki temu delete+add nie omija capa.

export type UsageKind = "natal" | "child" | "match";

export type UsageScope = "month" | "lifetime";

/** Bieżący okres rozliczeniowy capa: miesiąc kalendarzowy w strefie Europe/Warsaw → "YYYY-MM". */
export function currentPeriodYm(now: Date = new Date()): string {
  // en-CA daje stabilny format YYYY-MM-DD; bierzemy YYYY-MM.
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return ymd.slice(0, 7);
}

/**
 * Ile utworzeń danego typu user ma w bieżącym okresie ("month") lub łącznie ("lifetime").
 * Lifetime sumuje wszystkie miesiące — używane do limitów free (np. 1 match / 1 dziecko),
 * które muszą przetrwać granicę miesiąca i delete+add.
 */
export async function getUsedCount(
  userId: string,
  kind: UsageKind,
  scope: UsageScope,
  now: Date = new Date(),
): Promise<number> {
  if (scope === "month") {
    const { data } = await supabaseAdmin
      .from("usage_counters")
      .select("count")
      .eq("user_id", userId)
      .eq("kind", kind)
      .eq("period_ym", currentPeriodYm(now))
      .maybeSingle();
    return (data as { count?: number } | null)?.count ?? 0;
  }

  const { data } = await supabaseAdmin
    .from("usage_counters")
    .select("count")
    .eq("user_id", userId)
    .eq("kind", kind);
  return (data as { count?: number }[] | null ?? []).reduce((sum, r) => sum + (r.count ?? 0), 0);
}

/**
 * Sprawdza, czy user może wykonać kolejne utworzenie (PRZED generacją). Nie inkrementuje —
 * po udanej generacji wołaj incrementUsage(). Failed-open na błędzie DB (nie blokuj usera
 * przez chwilową awarię licznika — rate-limiter i tak chroni przed burstem).
 */
export async function checkUsageLimit(
  userId: string,
  kind: UsageKind,
  opts: { limit: number; scope: UsageScope },
  now: Date = new Date(),
): Promise<{ allowed: boolean; used: number }> {
  try {
    const used = await getUsedCount(userId, kind, opts.scope, now);
    return { allowed: used < opts.limit, used };
  } catch {
    return { allowed: true, used: 0 };
  }
}

/** Inkrementuje licznik bieżącego okresu (atomowo, przez RPC). Best-effort. */
export async function incrementUsage(
  userId: string,
  kind: UsageKind,
  now: Date = new Date(),
): Promise<void> {
  try {
    await supabaseAdmin.rpc("increment_usage_counter", {
      p_user_id: userId,
      p_kind: kind,
      p_period_ym: currentPeriodYm(now),
    });
  } catch (err) {
    console.error("[usageLimits] increment failed:", err instanceof Error ? err.message : err);
  }
}
