import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req.headers.get("Authorization"));
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const { data, error } = await supabaseAdmin
      .from("prompt_versions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  }

  // List with stats
  const { data: versions } = await supabaseAdmin
    .from("prompt_versions")
    .select("*")
    .order("prompt_name")
    .order("version");

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Enrich with reading stats per version
  const enriched = await Promise.all(
    (versions ?? []).map(async (v) => {
      const { count: readingCount } = await supabaseAdmin
        .from("readings")
        .select("id", { count: "exact", head: true })
        .eq("prompt_version_id", v.id)
        .gte("created_at", sevenDaysAgo);

      const { data: thumbsData } = await supabaseAdmin
        .from("readings")
        .select("rating_thumbs")
        .eq("prompt_version_id", v.id)
        .not("rating_thumbs", "is", null);

      const thumbsUp = thumbsData?.filter((r) => r.rating_thumbs === 1).length ?? 0;
      const thumbsTotal = thumbsData?.length ?? 0;

      const { data: evals } = await supabaseAdmin
        .from("reading_evaluations")
        .select("scores")
        .eq("prompt_version_id", v.id)
        .limit(100);

      let avgScore: number | null = null;
      if (evals && evals.length > 0) {
        const totals = evals.reduce(
          (acc, e) => {
            const s = e.scores as Record<string, number>;
            return {
              sum:
                acc.sum +
                (s.accuracy + s.engagement + s.specificity + s.no_jargon + s.grammar) / 5,
              count: acc.count + 1,
            };
          },
          { sum: 0, count: 0 }
        );
        avgScore = Math.round((totals.sum / totals.count) * 10) / 10;
      }

      return {
        ...v,
        stats: {
          readings_7d: readingCount ?? 0,
          thumbs_up: thumbsUp,
          thumbs_total: thumbsTotal,
          avg_judge_score: avgScore,
        },
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req.headers.get("Authorization"));
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("prompt_versions")
    .insert({ ...body, created_by: admin.userId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req.headers.get("Authorization"));
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, ...updates } = await req.json();
  const { data, error } = await supabaseAdmin
    .from("prompt_versions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
