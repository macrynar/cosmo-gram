import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_NAMES = ["daily-horoscope"] as const;

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("cron_runs")
    .select("name, ran_at, status, metadata")
    .in("name", CRON_NAMES)
    .order("ran_at", { ascending: false })
    .limit(CRON_NAMES.length * 3);

  if (error) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 503 });
  }

  // Latest run per cron
  const latest: Record<string, { ran_at: string; status: string; metadata: unknown } | null> = {};
  for (const name of CRON_NAMES) latest[name] = null;
  for (const row of data ?? []) {
    if (!latest[row.name]) {
      latest[row.name] = { ran_at: row.ran_at, status: row.status, metadata: row.metadata };
    }
  }

  const now = Date.now();
  const stale = Object.entries(latest).filter(([, v]) => {
    if (!v) return true;
    return now - new Date(v.ran_at).getTime() > 28 * 60 * 60 * 1000; // >28h means missed a day
  });

  const overallStatus = stale.length === 0 ? "ok" : "stale";

  return NextResponse.json(
    { status: overallStatus, ts: new Date().toISOString(), crons: latest },
    { status: overallStatus === "ok" ? 200 : 503 }
  );
}
