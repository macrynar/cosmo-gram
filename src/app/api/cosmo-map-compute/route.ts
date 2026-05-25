import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { computeAstrocartography } from "@/lib/astrocartography";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { profile_id?: string };
  const profileId = body.profile_id ?? null;

  // Check cache
  const { data: cached } = await supabaseAdmin
    .from("astrocartography_lines")
    .select("lines, parans")
    .eq("user_id", user.id)
    .is("profile_id", profileId)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({ lines: cached.lines, parans: cached.parans, cached: true });
  }

  // Fetch birth data
  let birthDate: string, birthTime: string, lat: number, lng: number;

  if (profileId) {
    const { data: profile } = await supabaseAdmin
      .from("children_profiles")
      .select("birth_date, birth_time, lat, lng")
      .eq("id", profileId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    birthDate = profile.birth_date;
    birthTime = profile.birth_time;
    lat = profile.lat;
    lng = profile.lng;
  } else {
    // Use the user's most recent reading for birth data
    const { data: reading } = await supabaseAdmin
      .from("readings")
      .select("chart_data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!reading?.chart_data?.birthData) {
      return NextResponse.json({ error: "No birth data found. Generate a cosmogram first." }, { status: 404 });
    }
    const bd = reading.chart_data.birthData;
    birthDate = bd.date;
    birthTime = bd.time ?? "12:00";
    lat = bd.lat;
    lng = bd.lng;
  }

  const [y, m, d] = birthDate.split("-").map(Number);
  const [h, min] = birthTime.split(":").map(Number);
  const dateUtc = new Date(Date.UTC(y, m - 1, d, h, min, 0));

  const astro = computeAstrocartography(dateUtc, lat, lng);

  // Save to cache
  await supabaseAdmin.from("astrocartography_lines").upsert({
    user_id: user.id,
    profile_id: profileId,
    lines: astro.planets,
    parans: astro.parans,
    computed_at: new Date().toISOString(),
  }, { onConflict: "user_id,profile_id" });

  return NextResponse.json({ lines: astro.planets, parans: astro.parans, cached: false });
}
