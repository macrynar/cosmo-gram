import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { ensureMissionTeaser } from "@/lib/letters/teaser";

export const runtime = "nodejs";
export const maxDuration = 30;

// Wywoływane przez klienta po wygenerowaniu kosmogramu — tworzy i dostarcza
// darmowy list „Twoja misja" (wabik konwersji). Idempotentne.
export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  try {
    const res = await ensureMissionTeaser(user.id);
    return NextResponse.json(res);
  } catch (e) {
    console.error("[letters/teaser] failed:", e);
    return NextResponse.json({ created: false, reason: "error" }, { status: 200 });
  }
}
