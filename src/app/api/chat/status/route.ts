import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { hasActiveSubscription, getUserSubscription } from "@/lib/subscription";
import { FREE_CHAT_MESSAGES, PREMIUM_MONTHLY_CHAT_LIMIT } from "@/lib/pricing";

async function getChatCredits(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("user_preferences")
    .select("chat_credit_balance")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as { chat_credit_balance?: number } | null)?.chat_credit_balance ?? 0;
}

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
    const remaining = Math.max(0, FREE_CHAT_MESSAGES - used);
    const credits = await getChatCredits(user.id);
    return NextResponse.json({ isPaid: false, limit: FREE_CHAT_MESSAGES, used, remaining, credits });
  }

  // Premium: use billing anniversary if available, else calendar month
  const sub = await getUserSubscription(user.id);
  let periodStart: Date;
  if (sub?.current_period_start) {
    periodStart = new Date(sub.current_period_start);
    const now = new Date();
    while (periodStart <= now) {
      const next = new Date(periodStart);
      next.setMonth(next.getMonth() + 1);
      if (next > now) break;
      periodStart = next;
    }
  } else {
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

  const credits = await getChatCredits(user.id);
  const used = count ?? 0;
  const remaining = Math.max(0, PREMIUM_MONTHLY_CHAT_LIMIT - used);

  return NextResponse.json({ isPaid: true, limit: PREMIUM_MONTHLY_CHAT_LIMIT, used, remaining, credits });
}
