import { NextResponse } from "next/server";
import { createHash } from "crypto";

// TYMCZASOWY endpoint diagnostyczny — do USUNIĘCIA po namierzeniu CRON_SECRET.
// Nie ujawnia sekretu: tylko czy jest zdefiniowany, jego długość i skrócony hash.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const raw = process.env.CRON_SECRET;
  const trimmed = raw?.trim();
  return NextResponse.json({
    defined: raw !== undefined,
    rawLength: raw?.length ?? null,
    trimmedLength: trimmed?.length ?? null,
    sha256_16: trimmed ? createHash("sha256").update(trimmed).digest("hex").slice(0, 16) : null,
    // oczekiwane dla mojego sekretu: trimmedLength=64, sha256_16=c855fbbde89a4e27
    marker: "cron-debug-v1",
  });
}
