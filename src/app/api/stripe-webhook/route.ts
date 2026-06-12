import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { upsertSubscription } from "@/lib/subscription";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getPostHogClient } from "@/lib/posthog-server";

// billingCycleAnchorToDate converts billing_cycle_anchor (Unix epoch) to a Date.
// Used for billing anniversary reset of chat limits.
function billingCycleAnchorToDate(anchor: number): Date {
  return new Date(anchor * 1000);
}

function subFromEvent(sub: Stripe.Subscription) {
  return {
    stripeSubscriptionId: sub.id,
    status: sub.status,
    priceId: sub.items.data[0]?.price.id ?? null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
    // billing_cycle_anchor gives us the subscription anniversary date
    currentPeriodStart: billingCycleAnchorToDate(sub.billing_cycle_anchor),
  };
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const posthog = getPostHogClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (!userId || !session.subscription) break;

        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await upsertSubscription({
          userId,
          stripeCustomerId: session.customer as string,
          ...subFromEvent(sub),
        });
        posthog.capture({
          distinctId: userId,
          event: "subscription_activated",
          properties: {
            price_id: sub.items.data[0]?.price.id ?? null,
            status: sub.status,
          },
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!existing?.user_id) break;

        await upsertSubscription({
          userId: existing.user_id,
          stripeCustomerId: customerId,
          ...subFromEvent(sub),
        });

        if (event.type === "customer.subscription.deleted") {
          posthog.capture({
            distinctId: existing.user_id,
            event: "subscription_cancelled",
            properties: { price_id: sub.items.data[0]?.price.id ?? null },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (existing?.user_id) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("user_id", existing.user_id);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
