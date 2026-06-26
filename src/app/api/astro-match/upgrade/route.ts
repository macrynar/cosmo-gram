import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { resolveActiveSubscription } from "@/lib/subscription";
import { checkRateLimit } from "@/lib/rateLimiter";
import { geocodePlace } from "@/lib/geocode";
import { generateMatchResult, matchNeedsUpgrade, type CompatibilityResult } from "@/lib/astro/matchGenerator";

// §2.5 — przy przejściu free→premium dogeneruj brakujące 5 modułów starego matcha.
// Match trzyma daty/godziny/miejsca (nie lat/lng) → odzyskujemy współrzędne geokodowaniem.

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const rateLimitRes = await checkRateLimit("ai", user.id);
  if (rateLimitRes) return rateLimitRes;

  // Tylko premium dogenerowuje pełną kartę.
  const isPaid = await resolveActiveSubscription(user.id, user.email).catch(() => false);
  if (!isPaid) return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });

  const { matchId } = await req.json().catch(() => ({})) as { matchId?: string };
  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });

  const { data: m } = await supabaseAdmin
    .from("matches")
    .select("id, person1_name, person1_birth_date, person1_birth_time, person1_birth_place, person2_name, person2_birth_date, person2_birth_time, person2_birth_place, compatibility_data")
    .eq("id", matchId)
    .eq("user_id", user.id)
    .single();
  if (!m) return NextResponse.json({ error: "Nie znaleziono matcha" }, { status: 404 });

  const current = m.compatibility_data as CompatibilityResult | null;
  // Już pełny → idempotentne (klient nie powinien wołać, ale dla pewności).
  if (current && !matchNeedsUpgrade(current)) {
    return NextResponse.json({ result: current, alreadyFull: true });
  }

  // Bardzo stary zapis bez daty/miejsca → nie da się dogenerować.
  if (!m.person1_birth_date || !m.person2_birth_date || !m.person1_birth_place || !m.person2_birth_place) {
    return NextResponse.json({ error: "MISSING_BIRTH_DATA" }, { status: 422 });
  }

  // Odzyskaj lat/lng z zapisanych nazw miejsc.
  const [g1, g2] = await Promise.all([
    geocodePlace(m.person1_birth_place),
    geocodePlace(m.person2_birth_place),
  ]);
  if (!g1 || !g2) return NextResponse.json({ error: "GEOCODE_FAILED" }, { status: 422 });

  try {
    const { result } = await generateMatchResult(
      { name: m.person1_name ?? "", date: String(m.person1_birth_date).slice(0, 10), time: (m.person1_birth_time ?? "").slice(0, 5), place: m.person1_birth_place, lat: g1.lat, lng: g1.lng },
      { name: m.person2_name ?? "", date: String(m.person2_birth_date).slice(0, 10), time: (m.person2_birth_time ?? "").slice(0, 5), place: m.person2_birth_place, lat: g2.lat, lng: g2.lng },
      true,            // premium → pełne 8 modułów
      user.id,
    );

    await supabaseAdmin
      .from("matches")
      .update({ compatibility_data: result, overall_score: result.overallScore })
      .eq("id", matchId)
      .eq("user_id", user.id);

    // NIE inkrementujemy capa — to jednorazowe odblokowanie istniejącego matcha, nie nowe utworzenie.
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[astro-match/upgrade] error:", err);
    return NextResponse.json({ error: "Błąd regeneracji" }, { status: 500 });
  }
}
