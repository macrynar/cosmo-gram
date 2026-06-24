import { NextRequest, NextResponse } from "next/server";
import { runLettersDrip } from "@/lib/letters/runDrip";

// Vercel Cron — dzienny drip listów. Logika w runLettersDrip (współdzielona z ręcznym triggerem).
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.AI_DISABLED === "true") {
    return NextResponse.json({ skipped: true, reason: "AI_DISABLED" });
  }
  const result = await runLettersDrip();
  return NextResponse.json(result);
}
