import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { generateNatalKarta } from "@/services/natalGenerator";
import type { GenerationContext } from "@/lib/moduleSpecs";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // Auth
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    chart_id:             string;
    natal_data:           GenerationContext["natal_data"];
    grammatical_form?:    GenerationContext["grammatical_form"];
    hasExactTime?:        boolean;
    birthYear?:           number;
    locationPrecisionKm?: number;
  };

  if (!body.chart_id || !body.natal_data) {
    return NextResponse.json({ error: "chart_id and natal_data are required" }, { status: 400 });
  }

  try {
    const ctx: GenerationContext = {
      user_id:             user.id,
      chart_id:            body.chart_id,
      natal_data:          body.natal_data,
      grammatical_form:    body.grammatical_form ?? "neutralna",
      hasExactTime:        body.hasExactTime ?? false,
      birthYear:           body.birthYear ?? new Date().getFullYear() - 30,
      locationPrecisionKm: body.locationPrecisionKm ?? 10,
    };

    const modules = await generateNatalKarta(ctx);
    return NextResponse.json({ modules });

  } catch (err) {
    console.error("[natal-karta] generation error:", err);
    return NextResponse.json({ error: "Generation failed", detail: String(err) }, { status: 500 });
  }
}
