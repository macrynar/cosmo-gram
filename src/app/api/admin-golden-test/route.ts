import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/adminGuard";
import { judgeReading } from "@/lib/judge";
import { deepSeekChat } from "@/lib/deepseek";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req.headers.get("Authorization"));
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { prompt_version_id, chart_ids } = (await req.json()) as {
    prompt_version_id: string;
    chart_ids?: string[];
  };

  // Load the prompt version
  const { data: version } = await supabaseAdmin
    .from("prompt_versions")
    .select("*")
    .eq("id", prompt_version_id)
    .single();

  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  // Load golden charts relevant to this prompt
  let query = supabaseAdmin
    .from("golden_test_charts")
    .select("*")
    .contains("prompt_names", [version.prompt_name]);

  if (chart_ids && chart_ids.length > 0) {
    query = query.in("id", chart_ids);
  }

  const { data: charts } = await query.limit(20);
  if (!charts || charts.length === 0) {
    return NextResponse.json({ error: "No golden charts for this prompt" }, { status: 404 });
  }

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const results: Array<{
    chart_id: string;
    chart_name: string;
    judge_scores: Record<string, number>;
    traits_matched: number;
    traits_total: number;
    passed: boolean;
  }> = [];

  for (const chart of charts) {
    try {
      const output = await deepSeekChat({
        system: version.system_prompt as string,
        messages: [
          {
            role: "user",
            content:
              (version.user_prompt_template as string) ||
              `Wygeneruj interpretację dla: ${JSON.stringify(chart.birth_data)}`,
          },
        ],
        maxTokens: (version.config as Record<string, number>)?.max_tokens ?? 4000,
        temperature: (version.config as Record<string, number>)?.temperature ?? 0.7,
      });

      const judgeResult = await judgeReading(chart.birth_data, output, "impersonal");

      // Check trait matching
      const expectedTraits = (chart.expected_traits as string[]) ?? [];
      const outputLower = output.toLowerCase();
      const matched = expectedTraits.filter((trait: string) =>
        outputLower.includes(trait.toLowerCase())
      ).length;

      const avgScore =
        (judgeResult.scores.accuracy +
          judgeResult.scores.engagement +
          judgeResult.scores.specificity +
          judgeResult.scores.no_jargon +
          judgeResult.scores.grammar) /
        5;

      const passed =
        avgScore >= 3.5 && (expectedTraits.length === 0 || matched / expectedTraits.length >= 0.6);

      await supabaseAdmin.from("golden_test_runs").insert({
        prompt_version_id,
        chart_id: chart.id,
        output_markdown: output,
        judge_scores: judgeResult.scores,
        traits_matched: matched,
        traits_total: expectedTraits.length,
        passed,
      });

      results.push({
        chart_id: chart.id as string,
        chart_name: chart.name as string,
        judge_scores: judgeResult.scores,
        traits_matched: matched,
        traits_total: expectedTraits.length,
        passed,
      });
    } catch (err) {
      results.push({
        chart_id: chart.id as string,
        chart_name: chart.name as string,
        judge_scores: {},
        traits_matched: 0,
        traits_total: 0,
        passed: false,
      });
      console.error(`Golden test failed for chart ${chart.id}:`, err);
    }
  }

  const passCount = results.filter((r) => r.passed).length;
  return NextResponse.json({
    total: results.length,
    passed: passCount,
    failed: results.length - passCount,
    results,
  });
}
