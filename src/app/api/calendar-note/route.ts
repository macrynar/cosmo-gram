import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

function getUser(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return { user: null, error: "Brak autoryzacji" };
  return supabaseAdmin.auth.getUser(token);
}

export async function GET(req: NextRequest) {
  const { data: { user }, error: authError } = await getUser(req) as Awaited<ReturnType<typeof supabaseAdmin.auth.getUser>>;
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const reading_id = searchParams.get("reading_id");

  if (!date || !reading_id) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { data } = await supabaseAdmin
    .from("calendar_notes")
    .select("note_text")
    .eq("user_id", user.id)
    .eq("reading_id", reading_id)
    .eq("date", date)
    .maybeSingle();

  return NextResponse.json({ note_text: data?.note_text ?? "" });
}

export async function POST(req: NextRequest) {
  const { data: { user }, error: authError } = await getUser(req) as Awaited<ReturnType<typeof supabaseAdmin.auth.getUser>>;
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const { date, reading_id, note_text } = await req.json() as { date: string; reading_id: string; note_text: string };

  if (!date || !reading_id) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("calendar_notes")
    .upsert(
      { user_id: user.id, reading_id, date, note_text: note_text ?? "", updated_at: new Date().toISOString() },
      { onConflict: "user_id,reading_id,date" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
