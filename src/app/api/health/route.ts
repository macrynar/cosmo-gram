import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  // Supabase reachability ping
  let dbOk = false;
  let dbMs = 0;
  try {
    const t0 = Date.now();
    const { error } = await supabaseAdmin.from("user_preferences").select("user_id").limit(1);
    dbMs = Date.now() - t0;
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  const status = dbOk ? "ok" : "degraded";
  const httpStatus = dbOk ? 200 : 503;

  return NextResponse.json(
    {
      status,
      ts: new Date().toISOString(),
      latencyMs: Date.now() - start,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      checks: {
        db: { ok: dbOk, ms: dbMs },
        ai_mock: process.env.AI_MOCK === "true",
        ai_disabled: process.env.AI_DISABLED === "true",
      },
    },
    { status: httpStatus }
  );
}
