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

  const scoreColor =
    score && score >= 75 ? "#a78bfa" :
    score && score >= 50 ? "#f59e0b" :
    "#f87171";

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
          background: "#050508",
          fontFamily: "Georgia, serif",
          gap: "20px",
          position: "relative",
        }}
      >
        {/* Rose/pink glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "400px",
            background: "radial-gradient(ellipse at 50% 0%, rgba(244,63,94,0.18) 0%, transparent 70%)",
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
            border: "0.5px solid rgba(244,63,94,0.35)",
            background: "rgba(244,63,94,0.08)",
            fontSize: "13px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: "rgba(251,113,133,0.90)",
          }}
        >
          ♥ Cosmo Match
        </div>

        {/* Names */}
        <div
          style={{
            fontSize: "68px",
            fontWeight: 500,
            color: "#ffffff",
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            textAlign: "center",
          }}
        >
          {name1}{" "}
          <span style={{ color: "#FFAE3D" }}>×</span>{" "}
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
              color: "rgba(255,255,255,0.55)",
            }}
          >
            Zgodność:{" "}
            <span
              style={{
                fontSize: "56px",
                fontWeight: 700,
                color: scoreColor,
                lineHeight: 1,
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: "22px" }}>/100</span>
          </div>
        )}

        {/* Top aspect */}
        {aspectLabel && (
          <div
            style={{
              fontSize: "20px",
              color: "rgba(212,175,55,0.70)",
              letterSpacing: "0.06em",
              textAlign: "center",
            }}
          >
            ✦ {aspectLabel}
          </div>
        )}

        {/* Bottom brand */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "15px",
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          cosmo-gram.com
        </div>
      </div>
    ),
    { ...size }
  );
}
