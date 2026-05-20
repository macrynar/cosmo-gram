import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { calcAgeYears } from "@/lib/prompts/child-v1";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });
  }

  const body = await req.json() as {
    name: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    lat: number;
    lng: number;
    timezone: string;
    chartData: unknown;
    interpretation: string;
  };

  const ageAtCreation = calcAgeYears(body.birthDate);

  const { data: inserted, error } = await supabaseAdmin.from("children").insert({
    user_id: user.id,
    name: body.name,
    birth_date: body.birthDate,
    birth_time: body.birthTime,
    birth_place: body.birthPlace,
    lat: body.lat,
    lng: body.lng,
    timezone: body.timezone,
    age_at_creation: ageAtCreation,
    chart_data: body.chartData,
    interpretation: body.interpretation,
    ai_prompt_version: "child-v1.0",
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: inserted?.id });
}
