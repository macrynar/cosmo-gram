import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getPrimaryReadingId } from "@/lib/readings";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ readings: [], primary_id: null });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ readings: [], primary_id: null });

  const [{ data }, primaryId] = await Promise.all([
    supabaseAdmin
      .from("readings")
      .select("id, name, birth_date, birth_time, birth_place, chart_data, interpretation, daily_reading, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    getPrimaryReadingId(user.id),
  ]);

  // Surface the primary ("główny") kosmogram first so every default selection
  // (data[0] across the app) uses it. Stable sort keeps the rest newest-first.
  const readings = (data ?? []).slice().sort((a, b) =>
    a.id === primaryId ? -1 : b.id === primaryId ? 1 : 0
  );

  return NextResponse.json({ readings, primary_id: primaryId });
}
