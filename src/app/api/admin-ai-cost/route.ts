import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/adminGuard";
import { estimateAiCostUsd } from "@/lib/aiCosts";

export const dynamic = "force-dynamic";

type LogRow = {
  called_at: string;
  task: string | null;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  status: string | null;
  user_id: string | null;
};

// Monitoring kosztu AI per user (§2.8). Liczy koszt z ai_call_logs po cenniku
// modeli (aiCosts.ts) i zestawia z liczbą aktywnych płatników → koszt/płatnik/tydz.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req.headers.get("Authorization"));
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = Date.now();
  const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7dMs = now - 7 * 24 * 60 * 60 * 1000;

  // Ostatnie 30 dni logów (kolumny potrzebne do kosztu). Cap bezpieczeństwa.
  const { data: rows, error } = await supabaseAdmin
    .from("ai_call_logs")
    .select("called_at,task,model,input_tokens,output_tokens,status,user_id")
    .gte("called_at", since30d)
    .order("called_at", { ascending: false })
    .limit(50000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const logs = (rows ?? []) as LogRow[];

  // Aktywni płatnicy (mianownik do kosztu/płatnik).
  const { count: payerCount } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id", { count: "exact", head: true })
    .in("status", ["active", "trialing"]);

  let cost7d = 0, cost30d = 0, calls7d = 0, calls30d = 0;
  const byTask  = new Map<string, { cost: number; calls: number }>();
  const byModel = new Map<string, { cost: number; calls: number }>();
  const byUser  = new Map<string, { cost: number; calls: number }>();

  for (const r of logs) {
    const cost = estimateAiCostUsd(r.model, r.input_tokens, r.output_tokens);
    const inWeek = new Date(r.called_at).getTime() >= since7dMs;

    cost30d += cost; calls30d += 1;
    if (inWeek) { cost7d += cost; calls7d += 1; }

    const taskKey = r.task ?? "—";
    const t = byTask.get(taskKey) ?? { cost: 0, calls: 0 };
    t.cost += cost; t.calls += 1; byTask.set(taskKey, t);

    const m = byModel.get(r.model) ?? { cost: 0, calls: 0 };
    m.cost += cost; m.calls += 1; byModel.set(r.model, m);

    const userKey = r.user_id ?? "anon/cron";
    const u = byUser.get(userKey) ?? { cost: 0, calls: 0 };
    u.cost += cost; u.calls += 1; byUser.set(userKey, u);
  }

  const toSorted = (map: Map<string, { cost: number; calls: number }>) =>
    [...map.entries()]
      .map(([key, v]) => ({ key, cost: Number(v.cost.toFixed(4)), calls: v.calls }))
      .sort((a, b) => b.cost - a.cost);

  const payers = payerCount ?? 0;

  return NextResponse.json({
    generatedAt: new Date(now).toISOString(),
    totals: {
      cost7d:  Number(cost7d.toFixed(2)),
      cost30d: Number(cost30d.toFixed(2)),
      calls7d, calls30d,
      payers,
      costPerPayer7d: payers > 0 ? Number((cost7d / payers).toFixed(3)) : null,
    },
    byTask:  toSorted(byTask),
    byModel: toSorted(byModel),
    topUsers: toSorted(byUser).slice(0, 20),
    note: logs.length >= 50000 ? "Ucięto do 50000 ostatnich logów — koszt zaniżony." : null,
  });
}
