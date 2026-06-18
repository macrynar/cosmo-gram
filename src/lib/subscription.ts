import { supabaseAdmin } from "@/lib/supabase-server";

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return false; // table may not exist yet
    return data?.status === "active" || data?.status === "trialing";
  } catch {
    return false;
  }
}

const isActiveStatus = (s?: string | null) => s === "active" || s === "trialing";

/**
 * Sync subskrypcji ze Stripe po e-mailu — źródło prawdy gdy webhook nie dotarł
 * albo zapis do DB się nie powiódł. Próbuje zapisać wynik do DB (best-effort),
 * ale NIE polega na tym, że zapis przejdzie — zwraca prawdę prosto ze Stripe.
 * Ta sama logika, której używa klient w /api/sync-subscription.
 */
export async function syncSubscriptionFromStripe(
  userId: string,
  email: string,
): Promise<{ hasSubscription: boolean; status: string; currentPeriodEnd: string | null }> {
  const dbFallback = async () => {
    const sub = await getUserSubscription(userId);
    return {
      hasSubscription: isActiveStatus(sub?.status),
      status: sub?.status ?? "free",
      currentPeriodEnd: sub?.current_period_end ?? null,
    };
  };

  if (!process.env.STRIPE_SECRET_KEY) return dbFallback();

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const customers = await stripe.customers.list({ email, limit: 5 });
  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 5 });
    const active = subs.data.find(s => isActiveStatus(s.status));
    const target = active ?? subs.data[0];
    if (!target) continue;

    try {
      await upsertSubscription({
        userId,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: target.id,
        status: target.status,
        priceId: target.items.data[0]?.price.id ?? null,
        cancelAtPeriodEnd: target.cancel_at_period_end,
        cancelAt: target.cancel_at ? new Date(target.cancel_at * 1000) : null,
      });
    } catch (upsertErr) {
      console.error("syncSubscriptionFromStripe upsert failed:", upsertErr);
    }

    if (active) {
      const periodEnd = (target as { current_period_end?: number }).current_period_end;
      return {
        hasSubscription: true,
        status: target.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      };
    }
  }

  return dbFallback();
}

/**
 * Premium check odporny na nieaktualną DB: najpierw szybki odczyt z DB,
 * a gdy DB mówi „nie" — fallback do Stripe (jak klient). Używaj tam, gdzie
 * poprawność jest ważniejsza niż latencja (np. gating treści premium),
 * NIE w hot-polled endpointach — tam zostaw hasActiveSubscription.
 */
export async function resolveActiveSubscription(userId: string, email?: string | null): Promise<boolean> {
  if (await hasActiveSubscription(userId)) return true;
  if (!email) return false;
  try {
    const { hasSubscription } = await syncSubscriptionFromStripe(userId, email);
    return hasSubscription;
  } catch (err) {
    console.error("resolveActiveSubscription Stripe fallback failed:", err);
    return false;
  }
}

export async function getUserSubscription(userId: string) {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("status, current_period_end, current_period_start, cancel_at_period_end, stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function upsertSubscription(params: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  priceId?: string | null;
  cancelAtPeriodEnd?: boolean;
  cancelAt?: Date | null;
  currentPeriodStart?: Date | null;
}) {
  await supabaseAdmin.from("subscriptions").upsert({
    user_id: params.userId,
    stripe_customer_id: params.stripeCustomerId,
    stripe_subscription_id: params.stripeSubscriptionId,
    status: params.status,
    price_id: params.priceId ?? null,
    cancel_at_period_end: params.cancelAtPeriodEnd ?? false,
    cancel_at: params.cancelAt?.toISOString() ?? null,
    ...(params.currentPeriodStart ? { current_period_start: params.currentPeriodStart.toISOString() } : {}),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}
