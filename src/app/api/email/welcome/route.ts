import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  // Idempotent — skip if already sent
  const { data: prefs } = await supabaseAdmin
    .from("user_preferences")
    .select("welcome_sent")
    .eq("user_id", user.id)
    .single();

  if (prefs?.welcome_sent) {
    return NextResponse.json({ skipped: true });
  }

  // Send email
  await sendWelcomeEmail(user.email!);

  // Upsert preferences + mark sent
  await supabaseAdmin.from("user_preferences").upsert({
    user_id:      user.id,
    welcome_sent: true,
    updated_at:   new Date().toISOString(),
  });

  return NextResponse.json({ sent: true });
}
