import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

async function getUser(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}

// GET /api/calendar-notes?reading_id=UUID
// Returns all non-empty notes for that reading, sorted newest first
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const readingId = new URL(req.url).searchParams.get("reading_id");
  if (!readingId) return NextResponse.json({ error: "reading_id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("calendar_notes")
    .select("date, note_text, updated_at")
    .eq("user_id", user.id)
    .eq("reading_id", readingId)
    .neq("note_text", "")
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data ?? [] });
}
