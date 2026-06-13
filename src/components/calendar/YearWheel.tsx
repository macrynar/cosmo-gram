"use client";

import { useMemo } from "react";
import { getPowerDays } from "@/lib/astro/powerDays";
import { selectShownSeasons } from "@/lib/astro/calendarSelectors";
import { POWER_DAY_SANITY_CAP } from "@/lib/astro/calendarLimits";
import type { NatalChart } from "@/lib/astro-types";
import type { Season } from "@/lib/astro/layers";

// ─── Layout constants ─────────────────────────────────────────────────────────

const CX = 200;
const CY = 200;
const R_MONTH_OUT  = 158;   // outer edge of month ring
const R_MONTH_IN   = 113;   // inner edge of month ring (= season space edge)
const R_LABEL      = 135;   // centre of month ring (label placement)
const R_SEA_0      = 104;   // outermost season arc radius
const R_SEA_STEP   =  11;   // step between stacked season arcs
const R_DOT        = 168;   // power day dot radius
const R_NOW_INNER  =  55;   // now-line inner radius
const R_NOW_OUTER  = 172;   // now-line outer radius

const MONTH_SHORT = ["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"];

// Planet → arc color (amber-first palette; no violet/purple)
const PLANET_COLOR: Record<string, string> = {
  "Jowisz":  "#E0B566",   // gold
  "Saturn":  "#7BA4C9",   // steel
  "Pluton":  "#C87941",   // copper
  "Neptun":  "#6BC4A0",   // teal
  "Uran":    "#A8C4A2",   // sage
};

// ─── Math helpers ─────────────────────────────────────────────────────────────

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function dayOfYear(dateStr: string, year: number): number {
  const d = new Date(dateStr + "T00:00:00Z");
  const s = new Date(Date.UTC(year, 0, 1));
  return Math.max(0, Math.floor((d.getTime() - s.getTime()) / 86400000));
}

function dateToAngle(dateStr: string, year: number): number {
  const days = isLeapYear(year) ? 366 : 365;
  return (dayOfYear(dateStr, year) / days) * 360;
}

function polar(r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function arcPath(r: number, a1: number, a2: number): string {
  // Safety: clamp span to avoid degenerate arcs
  const span = ((a2 - a1) + 360) % 360;
  if (span < 0.5) return "";
  const [sx, sy] = polar(r, a1);
  const [ex, ey] = polar(r, a2);
  const large    = span > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
}

function wedgePath(rIn: number, rOut: number, a1: number, a2: number): string {
  const span = ((a2 - a1) + 360) % 360;
  if (span < 0.1) return "";
  const [ix1, iy1] = polar(rIn,  a1);
  const [ox1, oy1] = polar(rOut, a1);
  const [ix2, iy2] = polar(rIn,  a2);
  const [ox2, oy2] = polar(rOut, a2);
  const large = span > 180 ? 1 : 0;
  return (
    `M ${ox1} ${oy1}` +
    ` A ${rOut} ${rOut} 0 ${large} 1 ${ox2} ${oy2}` +
    ` L ${ix2} ${iy2}` +
    ` A ${rIn} ${rIn} 0 ${large} 0 ${ix1} ${iy1} Z`
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  year:          number;
  seasons:       Season[];        // pre-computed (from getSeasons, already sliced)
  chart:         NatalChart;
  isPremium:     boolean;
  onDayClick?:   (date: string) => void;
  onSeasonClick?:(season: Season) => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function YearWheel({
  year, seasons, chart, isPremium, onDayClick, onSeasonClick,
}: Props) {
  const today    = new Date().toISOString().slice(0, 10);
  const nowAngle = dateToAngle(today, year);
  const nowM     = new Date().getUTCMonth(); // 0-based

  // Up to 3 shown seasons (already sliced by selectShownSeasons in parent)
  const shownSeasons = selectShownSeasons(seasons);

  // Power days: collect all months, cap at POWER_DAY_SANITY_CAP × 4 = 32 dots max
  const powerDays = useMemo(() => {
    const all = [];
    for (let m = 1; m <= 12; m++) {
      for (const d of getPowerDays(chart, year, m)) all.push(d);
    }
    return all
      .sort((a, b) => b.score - a.score)
      .slice(0, POWER_DAY_SANITY_CAP * 4);
  }, [chart, year]);

  const yearStart = `${year}-01-01`;
  const yearEnd   = `${year}-12-31`;

  return (
    <svg
      viewBox="0 0 400 400"
      aria-label={`Koło roku ${year}`}
      style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }}
    >
      {/* ── Outer decorative ring ─────────────────────────────────────── */}
      <circle cx={CX} cy={CY} r={R_MONTH_OUT + 4}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
      <circle cx={CX} cy={CY} r={R_MONTH_IN - 4}
        fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />

      {/* ── Month segments ───────────────────────────────────────────── */}
      {MONTH_SHORT.map((label, i) => {
        const a1 = i * 30;
        const a2 = a1 + 30;
        const isCurrent = i === nowM;
        return (
          <g key={i}>
            <path
              d={wedgePath(R_MONTH_IN, R_MONTH_OUT, a1, a2)}
              fill={isCurrent ? "rgba(255,174,61,0.12)" : "rgba(255,255,255,0.03)"}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={0.5}
            />
            {/* Month label */}
            {(() => {
              const midAngle = a1 + 15;
              const [lx, ly] = polar(R_LABEL, midAngle);
              // Rotate label to follow ring tangent
              const rot = midAngle > 90 && midAngle < 270 ? midAngle + 90 : midAngle - 90;
              return (
                <text
                  x={lx} y={ly}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={isCurrent ? 8.5 : 7.5}
                  fontWeight={isCurrent ? "700" : "400"}
                  fill={isCurrent ? "#FFAE3D" : "rgba(148,163,184,0.70)"}
                  transform={`rotate(${rot}, ${lx}, ${ly})`}
                  style={{ userSelect: "none" }}
                >
                  {label}
                </text>
              );
            })()}
          </g>
        );
      })}

      {/* ── Season arcs ──────────────────────────────────────────────── */}
      {shownSeasons.map((s, idx) => {
        const clampedStart = s.start < yearStart ? yearStart : s.start;
        const clampedEnd   = s.end   > yearEnd   ? yearEnd   : s.end;
        if (clampedStart > clampedEnd) return null;

        const a1    = dateToAngle(clampedStart, year);
        const a2    = dateToAngle(clampedEnd,   year);
        const r     = R_SEA_0 - idx * R_SEA_STEP;
        const color = PLANET_COLOR[s.transitPlanet] ?? "#E0B566";
        const path  = arcPath(r, a1, a2);
        if (!path) return null;

        return (
          <g key={idx} style={{ cursor: onSeasonClick ? "pointer" : "default" }}
             onClick={() => onSeasonClick?.(s)}>
            <title>
              {s.transitPlanet} → {s.natalPoint} ({s.phase})
            </title>
            {/* Shadow / glow */}
            <path d={path} fill="none"
              stroke={color} strokeWidth={12} strokeLinecap="round"
              opacity={0.15} />
            {/* Main arc */}
            <path d={path} fill="none"
              stroke={color} strokeWidth={s.favorable ? 6 : 4} strokeLinecap="round"
              opacity={s.favorable ? 0.80 : 0.55}
              strokeDasharray={s.favorable ? undefined : "6 4"} />
            {/* Exact days: small tick marks */}
            {s.exactDays
              .filter(d => d >= yearStart && d <= yearEnd)
              .map(d => {
                const a = dateToAngle(d, year);
                const [x1, y1] = polar(r - 5, a);
                const [x2, y2] = polar(r + 5, a);
                return (
                  <line key={d} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={color} strokeWidth={1.5} opacity={0.9} />
                );
              })}
          </g>
        );
      })}

      {/* ── Power day dots ───────────────────────────────────────────── */}
      {isPremium && powerDays.map((pd) => {
        if (pd.date < yearStart || pd.date > yearEnd) return null;
        const a       = dateToAngle(pd.date, year);
        const [dx, dy] = polar(R_DOT, a);
        const isToday  = pd.date === today;
        return (
          <circle key={pd.date}
            cx={dx} cy={dy}
            r={isToday ? 4 : 3}
            fill={isToday ? "#FFAE3D" : "rgba(255,174,61,0.65)"}
            stroke={isToday ? "rgba(255,174,61,0.30)" : "none"}
            strokeWidth={isToday ? 3 : 0}
            style={{ cursor: onDayClick ? "pointer" : "default" }}
            onClick={() => onDayClick?.(pd.date)}
          >
            <title>Dzień Mocy · {pd.date}</title>
          </circle>
        );
      })}

      {/* ── "Now" indicator ─────────────────────────────────────────── */}
      {(() => {
        const [x1, y1] = polar(R_NOW_INNER, nowAngle);
        const [x2, y2] = polar(R_NOW_OUTER, nowAngle);
        return (
          <>
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#FFAE3D" strokeWidth={1.5} strokeLinecap="round" opacity={0.70} />
            {/* Arrowhead dot */}
            <circle cx={x2} cy={y2} r={2.5} fill="#FFAE3D" opacity={0.90} />
          </>
        );
      })()}

      {/* ── Center text ──────────────────────────────────────────────── */}
      <circle cx={CX} cy={CY} r={R_NOW_INNER - 4}
        fill="rgba(7,5,15,0.70)" />
      <text x={CX} y={CY - 8}
        textAnchor="middle" dominantBaseline="central"
        fontSize={26} fontWeight="700"
        fill="rgba(255,255,255,0.88)"
        style={{ userSelect: "none", fontVariantNumeric: "tabular-nums" }}
      >
        {year}
      </text>
      <text x={CX} y={CY + 16}
        textAnchor="middle" dominantBaseline="central"
        fontSize={9.5}
        fill="rgba(255,174,61,0.70)"
        style={{ userSelect: "none" }}
      >
        {MONTH_SHORT[nowM].toUpperCase()}
      </text>
    </svg>
  );
}
