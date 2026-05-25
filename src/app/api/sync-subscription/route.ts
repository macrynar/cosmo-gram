import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-server";
import { upsertSubscription } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ synced: false, error: "Stripe not configured" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Find Stripe customer(s) by email
  const customers = await stripe.customers.list({ email: user.email, limit: 5 });

  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 5,
    });

    // Prefer active/trialing
    const active = subs.data.find(
      (s) => s.status === "active" || s.status === "trialing"
    );

    const target = active ?? subs.data[0];
    if (!target) continue;

    await upsertSubscription({
      userId: user.id,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: target.id,
      status: target.status,
      priceId: target.items.data[0]?.price.id ?? null,
      cancelAtPeriodEnd: target.cancel_at_period_end,
      cancelAt: target.cancel_at ? new Date(target.cancel_at * 1000) : null,
    });

    if (active) break; // found active — no need to process other customers
  }

  // Read final state from DB
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasSubscription = sub?.status === "active" || sub?.status === "trialing";

  return NextResponse.json({
    synced: customers.data.length > 0,
    hasSubscription,
    status: sub?.status ?? "free",
    currentPeriodEnd: sub?.current_period_end ?? null,
  });
}
