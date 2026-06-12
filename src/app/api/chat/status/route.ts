import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hasActiveSubscription, getUserSubscription } from "@/lib/subscription";

const FREE_CHAT_MESSAGES = 3;
const PREMIUM_MONTHLY_LIMIT = 150;
const CHAT_PACK_BONUS = 100;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const isPaid = await hasActiveSubscription(user.id);

  const { data: userConvs } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("user_id", user.id);
  const convIds = (userConvs ?? []).map(c => c.id);

  if (!isPaid) {
    const { count } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds.length > 0 ? convIds : ["__none__"])
      .eq("role", "user");
    const used = count ?? 0;
    return NextResponse.json({
      isPaid: false,
      limit: FREE_CHAT_MESSAGES,
      used,
      remaining: Math.max(0, FREE_CHAT_MESSAGES - used),
    });
  }

  // Premium: use billing anniversary if available, else calendar month
  const sub = await getUserSubscription(user.id);
  let periodStart: Date;
  if (sub?.current_period_start) {
    periodStart = new Date(sub.current_period_start);
    // Roll period start to current billing cycle
    const now = new Date();
    while (periodStart <= now) {
      const next = new Date(periodStart);
      next.setMonth(next.getMonth() + 1);
      if (next > now) break;
      periodStart = next;
    }
  } else {
    // Fallback: calendar month start
    periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
  }

  const { count } = await supabaseAdmin
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in("conversation_id", convIds.length > 0 ? convIds : ["__none__"])
    .eq("role", "user")
    .gte("created_at", periodStart.toISOString());

  // Check for chat_pack bonus
  const { data: prefs } = await supabaseAdmin
    .from("user_preferences")
    .select("chat_pack_purchased")
    .eq("user_id", user.id)
    .maybeSingle();

  const packBonus = (prefs as { chat_pack_purchased?: boolean } | null)?.chat_pack_purchased ? CHAT_PACK_BONUS : 0;
  const limit = PREMIUM_MONTHLY_LIMIT + packBonus;
  const used = count ?? 0;

  return NextResponse.json({
    isPaid: true,
    limit,
    used,
    remaining: Math.max(0, limit - used),
  });
}
