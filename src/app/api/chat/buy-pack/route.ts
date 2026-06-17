import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserSubscription } from "@/lib/subscription";
import { supabaseAdmin } from "@/lib/supabase-server";

// Pack sizes — set STRIPE_PRICE_CHAT_PACK_* in env
const PACK_PRICES: Record<string, string | undefined> = {
  small:  process.env.STRIPE_PRICE_CHAT_PACK_SMALL,   // +50 messages
  medium: process.env.STRIPE_PRICE_CHAT_PACK_MEDIUM,  // +150 messages
  large:  process.env.STRIPE_PRICE_CHAT_PACK_LARGE,   // +500 messages
};

const PACK_CREDITS: Record<string, number> = {
  small: 50,
  medium: 150,
  large: 500,
};

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const { packSize } = await req.json() as { packSize: "small" | "medium" | "large" };
  const priceId = PACK_PRICES[packSize];
  if (!priceId) {
    return NextResponse.json({ error: "Nieprawidłowy rozmiar paczki lub brak konfiguracji" }, { status: 400 });
  }

  const credits = PACK_CREDITS[packSize];
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const existing = await getUserSubscription(user.id);
    let customerId = existing?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${appUrl}/app/chat?pack_success=1`,
      cancel_url: `${appUrl}/app/chat`,
      metadata: { user_id: user.id, credits: String(credits) },
      locale: "pl",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[buy-pack] Stripe error:", err);
    const msg = err instanceof Error ? err.message : "Nieznany błąd Stripe";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
