import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimiter";
import { geocodeSearch } from "@/lib/geocode";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ error: "No query" }, { status: 400 });
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: "Invalid query length" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const rateLimitRes = await checkRateLimit("geo", ip);
  if (rateLimitRes) return rateLimitRes;

  try {
    const results = await geocodeSearch(query, 5);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
