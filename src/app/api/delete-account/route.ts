import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const uid = user.id;

  // Cancel Stripe subscription if active
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", uid)
        .maybeSingle();
      if (sub?.stripe_subscription_id) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(sub.stripe_subscription_id as string);
      }
    } catch (err) {
      console.error("delete-account: Stripe cancel failed (non-fatal)", err);
    }
  }

  // Delete all user data from every table
  await Promise.allSettled([
    supabaseAdmin.from("messages").delete().eq("user_id", uid),
    supabaseAdmin.from("conversations").delete().eq("user_id", uid),
    supabaseAdmin.from("chat_suggested_questions").delete().eq("user_id", uid),
    supabaseAdmin.from("matches").delete().eq("user_id", uid),
    supabaseAdmin.from("children").delete().eq("user_id", uid),
    supabaseAdmin.from("readings").delete().eq("user_id", uid),
    supabaseAdmin.from("calendar_notes").delete().eq("user_id", uid),
    supabaseAdmin.from("user_preferences").delete().eq("user_id", uid),
    supabaseAdmin.from("user_consents").delete().eq("user_id", uid),
    supabaseAdmin.from("subscriptions").delete().eq("user_id", uid),
  ]);

  // Delete the auth user (cascade handles any remaining FK refs)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(uid);
  if (deleteError) {
    console.error("delete-account: auth.admin.deleteUser failed", deleteError);
    return NextResponse.json({ error: "Nie udało się usunąć konta" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
