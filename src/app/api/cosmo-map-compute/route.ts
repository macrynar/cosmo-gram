import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { computeAstrocartography } from "@/lib/astrocartography";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { reading_id?: string };
  const readingId = body.reading_id ?? null;

  // Cache key: user_id + reading_id (null = most recent)
  const { data: cached } = await supabaseAdmin
    .from("astrocartography_lines")
    .select("lines, parans")
    .eq("user_id", user.id)
    .is("profile_id", readingId) // reuse profile_id column as reading_id slot
    .maybeSingle();

  if (cached) {
    return NextResponse.json({ lines: cached.lines, parans: cached.parans, cached: true });
  }

  // Fetch birth data from readings table
  const query = supabaseAdmin
    .from("readings")
    .select("id, chart_data")
    .eq("user_id", user.id);

  const { data: reading } = readingId
    ? await query.eq("id", readingId).maybeSingle()
    : await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (!reading?.chart_data?.birthData) {
    return NextResponse.json(
      { error: "Brak danych urodzenia. Wygeneruj najpierw kosmogram." },
      { status: 404 }
    );
  }

  const bd = reading.chart_data.birthData;
  const birthDate: string = bd.date;
  const birthTime: string = bd.time ?? "12:00";
  const lat: number = bd.lat;
  const lng: number = bd.lng;

  const [y, m, d] = birthDate.split("-").map(Number);
  const [h, min] = birthTime.split(":").map(Number);
  const dateUtc = new Date(Date.UTC(y, m - 1, d, h, min, 0));

  const astro = computeAstrocartography(dateUtc, lat, lng);

  await supabaseAdmin.from("astrocartography_lines").upsert({
    user_id: user.id,
    profile_id: readingId,
    lines: astro.planets,
    parans: astro.parans,
    computed_at: new Date().toISOString(),
  }, { onConflict: "user_id,profile_id" });

  return NextResponse.json({
    lines: astro.planets,
    parans: astro.parans,
    cached: false,
    birthLat: lat,
    birthLon: lng,
  });
}
