// Server-side geocoding (Nominatim / OpenStreetMap). Współdzielone przez
// /api/geocode (autocomplete) i regenerację matcha (odzyskanie lat/lng z miejsca).

export type GeocodeResult = { lat: number; lng: number; displayName: string };

export async function geocodeSearch(query: string, limit = 5): Promise<GeocodeResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "cosmo-gram/1.0 (astrology chart generator)" },
  });
  if (!res.ok) throw new Error("Nominatim error");
  const data = await res.json() as Array<{
    display_name: string; lat: string; lon: string; importance: number;
  }>;
  return data
    .filter(item => item.importance > 0.3)
    .slice(0, limit)
    .map(item => ({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), displayName: item.display_name }));
}

/** Najlepszy pojedynczy wynik dla nazwy miejsca (do regeneracji z zapisanego matcha). null gdy brak/błąd. */
export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  if (!query || query.trim().length < 2) return null;
  try {
    const results = await geocodeSearch(query, 1);
    return results[0] ?? null;
  } catch {
    return null;
  }
}
