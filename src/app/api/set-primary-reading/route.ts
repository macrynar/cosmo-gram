import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

const Body = z.object({ reading_id: z.string().uuid() });

// PATCH /api/set-primary-reading — mark a kosmogram as the user's primary ("główny").
export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });

  // Verify the reading belongs to this user
  const { data: reading } = await supabaseAdmin
    .from("readings")
    .select("id")
    .eq("id", parsed.data.reading_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!reading) return NextResponse.json({ error: "Nie znaleziono kosmogramu" }, { status: 404 });

  const { error: upErr } = await supabaseAdmin
    .from("user_preferences")
    .upsert(
      { user_id: user.id, primary_reading_id: parsed.data.reading_id, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (upErr) return NextResponse.json({ error: "Błąd zapisu" }, { status: 500 });

  return NextResponse.json({ ok: true, primary_id: parsed.data.reading_id });
}
