import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email?: string };
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Nieprawidłowy email" }, { status: 400 });
  }

  try {
    await supabaseAdmin.from("waitlist").upsert({ email, created_at: new Date().toISOString() }, { onConflict: "email" });
  } catch {
    // Table may not exist yet — don't fail the UX
  }

  return NextResponse.json({ ok: true });
}
