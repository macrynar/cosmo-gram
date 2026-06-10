import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/adminGuard";
import { judgeReading } from "@/lib/judge";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req.headers.get("Authorization"));
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { limit?: number };
  const limit = Math.min(body.limit ?? 50, 100);

  const judgeModel = "claude-haiku-4-5-20251001";

  // Fetch already-evaluated reading IDs to exclude
  const { data: alreadyEvaluated, error: evalFetchError } = await supabaseAdmin
    .from("reading_evaluations")
    .select("reading_id")
    .eq("judge_model", judgeModel);

  if (evalFetchError) {
    // reading_evaluations table likely doesn't exist — migration not run yet
    return NextResponse.json({
      evaluated: 0,
      debug_error: `reading_evaluations fetch failed: ${evalFetchError.message}. Run the migration at supabase/migrations/20260525_prompt_registry.sql first.`,
    });
  }

  const evaluatedIds = (alreadyEvaluated ?? []).map((r) => r.reading_id as string);

  // 7-day window — wide enough to catch existing readings during initial testing
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Select only columns guaranteed to exist before migration
  let query = supabaseAdmin
    .from("readings")
    .select("id, interpretation, chart_data")
    .gte("created_at", since)
    .limit(limit);

  if (evaluatedIds.length > 0) {
    query = query.not("id", "in", `(${evaluatedIds.join(",")})`);
  }

  const { data: readings, error: readingsFetchError } = await query;

  if (readingsFetchError) {
    return NextResponse.json({
      evaluated: 0,
      debug_error: `readings fetch failed: ${readingsFetchError.message}`,
    });
  }

  if (!readings || readings.length === 0) {
    return NextResponse.json({
      evaluated: 0,
      message: "No readings in last 7 days to evaluate",
      debug_since: since,
    });
  }

  let evaluated = 0;
  const errors: string[] = [];

  for (const reading of readings) {
    try {
      const result = await judgeReading(
        reading.chart_data,
        (reading.interpretation as string) ?? "",
        "impersonal"
      );

      await supabaseAdmin.from("reading_evaluations").upsert({
        reading_id: reading.id,
        prompt_version_id: null,
        scores: result.scores,
        reasoning: result.reasoning,
        judge_model: result.judge_model,
      });

      evaluated++;
    } catch (err) {
      errors.push(`${reading.id}: ${String(err)}`);
    }
  }

  const avgScores: Record<string, number> = {};
  if (evaluated > 0) {
    const { data: recent } = await supabaseAdmin
      .from("reading_evaluations")
      .select("scores")
      .gte("evaluated_at", since)
      .limit(evaluated);

    if (recent) {
      const dims = ["accuracy", "engagement", "specificity", "no_jargon", "grammar"];
      for (const dim of dims) {
        const vals = recent.map((r) => (r.scores as Record<string, number>)[dim]).filter(Boolean);
        avgScores[dim] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      }
    }
  }

  return NextResponse.json({ evaluated, errors, avg_scores: avgScores });
}
