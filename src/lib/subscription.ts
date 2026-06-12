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
