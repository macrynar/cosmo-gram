import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserSubscription } from "@/lib/subscription";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ hasSubscription: false });

  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user } } = await userClient.auth.getUser(token);
  if (!user) return NextResponse.json({ hasSubscription: false });

  const sub = await getUserSubscription(user.id);
  const hasSubscription = sub?.status === "active" || sub?.status === "trialing";

  // Count free-tier usage
  const { count: matchCount } = await supabaseAdmin
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: convIds } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("user_id", user.id);

  let chatMessageCount = 0;
  if (convIds && convIds.length > 0) {
    const ids = convIds.map(c => c.id);
    const { count } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", ids)
      .eq("role", "user");
    chatMessageCount = count ?? 0;
  }

  return NextResponse.json({
    hasSubscription,
    status: sub?.status ?? "free",
    currentPeriodEnd: sub?.current_period_end ?? null,
    usage: {
      matchCount: matchCount ?? 0,
      chatMessageCount,
    },
  });
}
