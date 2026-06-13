import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { calcAgeYears } from "@/lib/prompts/child-v1";
import type { ChildModule } from "@/lib/schemas/childModule";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const body = await req.json() as {
    name:         string;
    birthDate:    string;
    birthTime:    string;
    birthPlace:   string;
    lat:          number;
    lng:          number;
    timezone:     string;
    chartData:    unknown;
    /** Structured 6-module array (v2). When present, overrides interpretation. */
    modules?:     ChildModule[];
    /** Legacy plain-text interpretation (v1). */
    interpretation?: string;
    promptVersion?:  string;
  };

  const ageAtCreation = calcAgeYears(body.birthDate);

  // v2: store modules as JSON string in interpretation column
  const interpretation = body.modules
    ? JSON.stringify(body.modules)
    : (body.interpretation ?? "");

  const promptVersion = body.promptVersion
    ?? (body.modules ? "child-v2.0" : "child-v1.0");

  const { data: inserted, error } = await supabaseAdmin.from("children").insert({
    user_id:           user.id,
    name:              body.name,
    birth_date:        body.birthDate,
    birth_time:        body.birthTime,
    birth_place:       body.birthPlace,
    lat:               body.lat,
    lng:               body.lng,
    timezone:          body.timezone,
    age_at_creation:   ageAtCreation,
    chart_data:        body.chartData,
    interpretation,
    ai_prompt_version: promptVersion,
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: inserted?.id });
}
