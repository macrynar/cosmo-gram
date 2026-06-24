import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  // Verify user is logged in via their session token
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });
  }

  const body = await req.json() as {
    name?: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    chart: unknown;
    interpretation: string;
    dailyReading: string;
    promptVersionId?: string;
    grammaticalForm?: string;
  };

  const name = body.name?.trim() || `${body.birthPlace.split(",")[0]} · ${body.birthDate}`;
  const grammaticalForm = ["kobieta", "mezczyzna", "neutralna"].includes(body.grammaticalForm ?? "")
    ? body.grammaticalForm
    : "mezczyzna";

  const { data: inserted, error } = await supabaseAdmin.from("readings").insert({
    user_id: user.id,
    name,
    birth_date: body.birthDate,
    birth_time: body.birthTime,
    birth_place: body.birthPlace,
    chart_data: body.chart,
    interpretation: body.interpretation,
    daily_reading: body.dailyReading,
    grammatical_form: grammaticalForm,
    ...(body.promptVersionId ? { prompt_version_id: body.promptVersionId } : {}),
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: inserted?.id });
}
