import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { CompatibilityResult } from "@/app/api/astro-match/route";

export const runtime = "nodejs";

// Karta 9:16 do pobrania (IG / Stories) — paleta redesignu, generowana satori.

const ASPECT_SHORT_PL: Record<string, string> = {
  conjunction: "koniunkcja", sextile: "sekstyl", trine: "trygon",
  square: "kwadratura", opposition: "opozycja",
};

const TIERS: [number, string][] = [
  [90, "Splecione gwiazdy"], [75, "Silne przyciąganie"], [60, "Rosnąca więź"],
  [45, "Nauka przez tarcie"], [0, "Dwa różne nieba"],
];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("matches")
    .select("person1_name, person2_name, overall_score, compatibility_data")
    .eq("id", id)
    .single();

  const name1  = data?.person1_name ?? "Osoba 1";
  const name2  = data?.person2_name ?? "Osoba 2";
  const score  = (data?.overall_score as number | null) ?? 0;
  const result = (data?.compatibility_data ?? null) as CompatibilityResult | null;

  const topAspect = result?.aspects?.[0];
  const aspectLabel = topAspect
    ? `${topAspect.planet_a} ↔ ${topAspect.planet_b} · ${ASPECT_SHORT_PL[topAspect.type] ?? topAspect.type}`
    : null;

  const tierLabel  = TIERS.find(([m]) => score >= m)?.[1] ?? "";
  const scoreColor = score >= 75 ? "#FFC56B" : score >= 45 ? "#E0B566" : "#E0865A";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px", height: "1920px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between",
          background: "#0B0912", fontFamily: "Georgia, serif", position: "relative",
          padding: "120px 80px",
        }}
      >
        {/* Glow */}
        <div style={{
          position: "absolute", top: "-260px", left: "50%", transform: "translateX(-50%)",
          width: "1200px", height: "1100px",
          background: "radial-gradient(circle at 50% 32%, rgba(255,174,61,0.20) 0%, rgba(90,72,162,0.12) 42%, transparent 70%)",
        }} />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "34px", fontWeight: 600, color: "#F4F1EA", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          cosmogram
        </div>

        {/* Center block */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "30px", letterSpacing: "0.32em", textTransform: "uppercase", color: "#877FA0", marginBottom: "18px" }}>
            Kompatybilność
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "76px", color: "#F4F1EA", marginBottom: "20px" }}>
            {name1}<span style={{ color: "#E0B566" }}>×</span>{name2}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "14px" }}>
            <span style={{ fontSize: "300px", fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: "70px", color: "rgba(182,175,198,0.6)", paddingBottom: "44px" }}>/100</span>
          </div>
          {tierLabel && (
            <div style={{ fontSize: "56px", fontStyle: "italic", color: "#E9DCC0", marginTop: "8px" }}>{tierLabel}</div>
          )}
          {aspectLabel && (
            <div style={{
              display: "flex", marginTop: "26px", padding: "16px 34px", borderRadius: "999px",
              border: "1px solid rgba(224,181,102,0.3)", background: "rgba(224,181,102,0.07)",
              fontSize: "32px", color: "#E0B566",
            }}>
              {aspectLabel}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ fontSize: "30px", color: "rgba(135,127,160,0.6)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          cosmo-gram.com/match
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: {
        "Content-Disposition": `attachment; filename="cosmo-match-${id}.png"`,
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
