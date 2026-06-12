import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { generateNatalKarta, getExistingKarta } from "@/services/natalGenerator";
import { hasActiveSubscription } from "@/lib/subscription";
import type { GenerationContext } from "@/lib/moduleSpecs";
import { FREE_MODULE_IDS } from "@/lib/moduleSpecs";
import { checkRateLimit } from "@/lib/rateLimiter";
import type { ModuleId } from "@/lib/schemas/astroModule";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chartId = new URL(req.url).searchParams.get("chart_id");
  if (!chartId) return NextResponse.json({ error: "chart_id required" }, { status: 400 });

  const modules = await getExistingKarta(user.id, chartId);
  return NextResponse.json({ modules: modules ?? [] });
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Config error", detail: "ANTHROPIC_API_KEY not set on server" }, { status: 503 });
  }

  // Auth
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized", detail: "No Bearer token" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    console.error("[natal-karta] auth error:", authErr?.message);
    return NextResponse.json({ error: "Unauthorized", detail: authErr?.message ?? "Invalid token" }, { status: 401 });
  }

  let body: {
    chart_id:             string;
    natal_data:           GenerationContext["natal_data"];
    grammatical_form?:    GenerationContext["grammatical_form"];
    hasExactTime?:        boolean;
    birthYear?:           number;
    locationPrecisionKm?: number;
    onlyModuleIds?:       ModuleId[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.chart_id || !body.natal_data) {
    return NextResponse.json({ error: "chart_id and natal_data are required" }, { status: 400 });
  }

  const rateLimitRes = await checkRateLimit("ai", user.id);
  if (rateLimitRes) return rateLimitRes;

  try {
    const isPaid = await hasActiveSubscription(user.id).catch(() => false);
    // body.onlyModuleIds is used for single-module retry; falls back to tier-based restriction
    const onlyModuleIds = body.onlyModuleIds ?? (isPaid ? undefined : FREE_MODULE_IDS);

    const ctx: GenerationContext = {
      user_id:             user.id,
      chart_id:            body.chart_id,
      natal_data:          body.natal_data,
      grammatical_form:    body.grammatical_form ?? "neutralna",
      hasExactTime:        body.hasExactTime ?? false,
      birthYear:           body.birthYear ?? new Date().getFullYear() - 30,
      locationPrecisionKm: body.locationPrecisionKm ?? 10,
    };

    const { modules, failedIds } = await generateNatalKarta(ctx, onlyModuleIds);
    return NextResponse.json({ modules, failedIds });

  } catch (err) {
    if ((err as Error)?.name === "AiDisabledError") {
      return NextResponse.json({ error: "AI tymczasowo niedostępne. Spróbuj za chwilę." }, { status: 503 });
    }
    const detail = err instanceof Error
      ? err.message
      : (typeof err === "object" && err !== null)
        ? JSON.stringify(err)
        : String(err);
    console.error("[natal-karta] generation error:", err);
    return NextResponse.json({ error: "Generation failed", detail }, { status: 500 });
  }
}
