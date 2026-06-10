import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ error: "No query" }, { status: 400 });
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: "Invalid query length" }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "cosmo-gram/1.0 (astrology chart generator)" },
    });
    if (!res.ok) throw new Error("Nominatim error");
    const data = await res.json();

    const results = (data as Array<{
      display_name: string;
      lat: string;
      lon: string;
      type: string;
      importance: number;
    }>)
      .filter((item) => item.importance > 0.3)
      .slice(0, 5)
      .map((item) => ({
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
