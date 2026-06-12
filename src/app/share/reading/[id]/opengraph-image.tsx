import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { NatalChart } from "@/lib/astro-types";
import { longitudeToSign } from "@/lib/astro-types";

export const runtime = "nodejs";
export const alt     = "Kosmogram Natalny";
export const size    = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

export default async function Image({ params }: Props) {
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("readings")
    .select("name, chart_data")
    .eq("id", id)
    .single();

  const name  = data?.name ?? "Kosmogram Natalny";
  const chart = (data?.chart_data ?? null) as NatalChart | null;

  const sun  = chart?.planets.find(p => p.name === "Słońce")?.sign ?? null;
  const moon = chart?.planets.find(p => p.name === "Księżyc")?.sign ?? null;
  const asc  = chart && !chart.birthData.timeUnknown
    ? longitudeToSign(chart.ascendant).name
    : null;

  const bigThreeParts = [
    sun  ? `☀ ${sun}`  : null,
    moon ? `☽ ${moon}` : null,
    asc  ? `↑ ${asc}`  : null,
  ].filter(Boolean).join("   ·   ");

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
          gap: "24px",
        }}
      >
        {/* Purple glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "400px",
            background: "radial-gradient(ellipse at 50% 0%, rgba(88,60,140,0.30) 0%, transparent 70%)",
          }}
        />

        {/* Label */}
        <div
          style={{
            fontSize: "13px",
            letterSpacing: "0.30em",
            textTransform: "uppercase",
            color: "rgba(212,175,55,0.65)",
          }}
        >
          Kosmogram Natalny
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 500,
            color: "#ffffff",
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            textAlign: "center",
            maxWidth: "900px",
          }}
        >
          {name}
        </div>

        {/* Big Three */}
        {bigThreeParts && (
          <div
            style={{
              fontSize: "24px",
              color: "rgba(212,175,55,0.80)",
              letterSpacing: "0.08em",
            }}
          >
            {bigThreeParts}
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
