import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { CompatibilityResult } from "@/app/api/astro-match/route";

export const runtime     = "nodejs";
export const alt         = "Cosmo Match — kompatybilność";
export const size        = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

const ASPECT_TYPE_PL: Record<string, string> = {
  conjunction: "w koniunkcji z",
  sextile:     "w sekstylu z",
  trine:       "w trygonie z",
  square:      "w kwadraturze z",
  opposition:  "naprzeciw",
};

const TIERS: [number, string][] = [
  [90, "Splecione gwiazdy"], [75, "Silne przyciąganie"], [60, "Rosnąca więź"],
  [45, "Nauka przez tarcie"], [0, "Dwa różne nieba"],
];

export default async function Image({ params }: Props) {
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("matches")
    .select("person1_name, person2_name, overall_score, compatibility_data")
    .eq("id", id)
    .single();

  const name1  = data?.person1_name ?? "Osoba 1";
  const name2  = data?.person2_name ?? "Osoba 2";
  const score  = (data?.overall_score as number | null) ?? null;
  const result = (data?.compatibility_data ?? null) as CompatibilityResult | null;

  const topAspect = result?.aspects?.[0];
  const aspectLabel = topAspect
    ? `${topAspect.planet_a} ${ASPECT_TYPE_PL[topAspect.type] ?? "aspekt"} ${topAspect.planet_b}`
    : null;

  const tierLabel = score !== null ? (TIERS.find(([m]) => score >= m)?.[1] ?? "") : "";
  const scoreColor =
    score !== null && score >= 75 ? "#FFC56B" :
    score !== null && score >= 45 ? "#E0B566" :
    "#E0865A";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0912",
          fontFamily: "Georgia, serif",
          gap: "20px",
          position: "relative",
        }}
      >
        {/* Amber glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "440px",
            background: "radial-gradient(ellipse at 50% 0%, rgba(255,174,61,0.16) 0%, rgba(90,72,162,0.10) 45%, transparent 72%)",
          }}
        />

        {/* Label chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 18px",
            borderRadius: "999px",
            border: "1px solid rgba(224,181,102,0.35)",
            background: "rgba(224,181,102,0.08)",
            fontSize: "13px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#E0B566",
          }}
        >
          Cosmo Match
        </div>

        {/* Names */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: "68px",
            fontWeight: 500,
            color: "#F4F1EA",
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
          }}
        >
          {name1}
          <span style={{ color: "#E0B566" }}>×</span>
          {name2}
        </div>

        {/* Score */}
        {score !== null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "28px",
              color: "rgba(182,175,198,0.75)",
            }}
          >
            Zgodność:{" "}
            <span style={{ fontSize: "56px", fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: "22px" }}>/100</span>
          </div>
        )}

        {/* Tier label */}
        {tierLabel && (
          <div style={{ fontSize: "30px", fontStyle: "italic", color: "#E9DCC0" }}>
            {tierLabel}
          </div>
        )}

        {/* Top aspect */}
        {aspectLabel && (
          <div
            style={{
              fontSize: "20px",
              color: "rgba(224,181,102,0.75)",
              letterSpacing: "0.06em",
              textAlign: "center",
            }}
          >
            {aspectLabel}
          </div>
        )}

        {/* Bottom brand */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "15px",
            color: "rgba(135,127,160,0.55)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          cosmo-gram.com/match
        </div>
      </div>
    ),
    { ...size }
  );
}
