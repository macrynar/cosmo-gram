import { supabaseAdmin } from "@/lib/supabase-server";
import type { NatalChart } from "@/lib/astro-types";

/**
 * The user's PRIMARY ("główny") reading — the default chart for email horoscopes
 * and anywhere the app needs one chart without an explicit selection.
 *
 * Resolution: explicit `user_preferences.primary_reading_id` (if set & still
 * valid) → otherwise the OLDEST reading (the one created at registration).
 */
export async function getPrimaryReading(
  userId: string,
): Promise<{ readingId: string; chart: NatalChart } | null> {
  const { data: prefs } = await supabaseAdmin
    .from("user_preferences")
    .select("primary_reading_id")
    .eq("user_id", userId)
    .maybeSingle();

  const primaryId = prefs?.primary_reading_id ?? null;
  if (primaryId) {
    const { data } = await supabaseAdmin
      .from("readings")
      .select("id, chart_data")
      .eq("id", primaryId)
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.chart_data) return { readingId: data.id, chart: data.chart_data as NatalChart };
  }

  // Fallback: oldest reading (first created — themselves, from registration).
  const { data } = await supabaseAdmin
    .from("readings")
    .select("id, chart_data")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (data?.chart_data) return { readingId: data.id, chart: data.chart_data as NatalChart };
  return null;
}

/** Just the primary reading's id (explicit, or oldest as fallback). */
export async function getPrimaryReadingId(userId: string): Promise<string | null> {
  const { data: prefs } = await supabaseAdmin
    .from("user_preferences")
    .select("primary_reading_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (prefs?.primary_reading_id) {
    const { data } = await supabaseAdmin
      .from("readings")
      .select("id")
      .eq("id", prefs.primary_reading_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const { data } = await supabaseAdmin
    .from("readings")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}
