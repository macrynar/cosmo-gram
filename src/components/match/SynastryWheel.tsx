"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SynastryAspect, PlanetPos } from "@/lib/astro/synastry";

// ─── Layout ──────────────────────────────────────────────────────────────────

const CX = 200, CY = 200;
const R_ZODIAC_OUTER = 185;
const R_ZODIAC_INNER = 165;
const R_A            = 148;  // Person A planet ring
const R_DIVIDER      = 128;
const R_B            = 112;  // Person B planet ring
const R_LINE_A       = 140;  // aspect line endpoint, A-side
const R_LINE_B       = 104;  // aspect line endpoint, B-side

// ─── Coordinate helpers ───────────────────────────────────────────────────────

function lonToXY(lon: number, r: number) {
  // 0° Aries at top, counterclockwise (standard astrology)
  const a = -(Math.PI / 2) - lon * (Math.PI / 180);
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function lonToAngleDeg(lon: number) {
  return -90 - lon; // SVG degrees for text rotation
}

// ─── Styling ──────────────────────────────────────────────────────────────────

const PLANET_SYMBOL: Record<string, string> = {
  "Słońce":    "☉", "Księżyc":  "☽", "Merkury":  "☿", "Wenus":    "♀",
  "Mars":      "♂", "Jowisz":   "♃", "Saturn":   "♄", "Uran":     "♅",
  "Neptun":    "♆", "Pluton":   "♇", "Ascendent": "Asc",
};

const ZODIAC_SYMBOLS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

const ASPECT_TYPE_LABEL: Record<string, string> = {
  conjunction: "koniunkcja", sextile: "sekstyl", trine: "trygon",
  square: "kwadratura", opposition: "opozycja",
};

function aspectColor(a: SynastryAspect) {
  if (a.harmony === "harmonious") return "#E0B566"; // amber-gold
  if (a.harmony === "tense")      return "#E0865A"; // warm burnt amber
  return "rgba(182,175,198,0.75)";                  // muted cool (conjunction/neutral)
}

function aspectDash(a: SynastryAspect) {
  return a.harmony === "tense" ? "4 3" : "none";
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  planetsA:    PlanetPos[];
  planetsB:    PlanetPos[];
  aspects:     SynastryAspect[];
  nameA?:      string;
  nameB?:      string;
  maxAspects?: number;  // default 15
  animate?:    boolean; // default true
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SynastryWheel({
  planetsA,
  planetsB,
  aspects,
  nameA = "Osoba A",
  nameB = "Osoba B",
  maxAspects = 15,
  animate = true,
}: Props) {
  const [showAll, setShowAll]         = useState(false);
  const [hovered, setHovered]         = useState<SynastryAspect | null>(null);
  const [tooltip, setTooltip]         = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const visibleAspects = showAll ? aspects : aspects.slice(0, maxAspects);
  const hasMore = aspects.length > maxAspects;

  function handleLineEnter(a: SynastryAspect, e: React.PointerEvent) {
    setHovered(a);
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setTooltip({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    }
  }

  function handleLineLeave() {
    setHovered(null);
    setTooltip(null);
  }

  function handleLineTap(a: SynastryAspect) {
    setHovered(prev => prev === a ? null : a);
  }

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded-full" style={{ background: "#FFAE3D" }} />
          <span style={{ color: "#FFAE3D" }}>{nameA}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded-full" style={{ background: "#f87185" }} />
          <span style={{ color: "#f87185" }}>{nameB}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t" style={{ borderColor: "#E0B566" }} />
          <span style={{ color: "rgba(224,181,102,0.75)" }}>harmonijny</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 border-t"
            style={{ borderColor: "#E0865A", borderStyle: "dashed" }}
          />
          <span style={{ color: "rgba(224,134,90,0.75)" }}>napięty</span>
        </span>
      </div>

      {/* SVG wheel */}
      <div className="relative w-full" style={{ maxWidth: 390 }}>
        <svg
          ref={svgRef}
          viewBox="0 0 400 400"
          width="100%"
          style={{ display: "block" }}
          aria-label="Koło synastrii"
        >
          {/* ── Zodiac outer ring ── */}
          <circle cx={CX} cy={CY} r={R_ZODIAC_OUTER} fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth={1} />
          <circle cx={CX} cy={CY} r={R_ZODIAC_INNER} fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth={0.5} />

          {/* Zodiac sign segments */}
          {ZODIAC_SYMBOLS.map((sym, i) => {
            const startLon = i * 30;
            const midLon   = startLon + 15;
            const endLon   = startLon + 30;
            const s = lonToXY(startLon, R_ZODIAC_OUTER);
            const e = lonToXY(endLon, R_ZODIAC_OUTER);
            const si = lonToXY(startLon, R_ZODIAC_INNER);
            const ei = lonToXY(endLon, R_ZODIAC_INNER);
            const mid = lonToXY(midLon, (R_ZODIAC_OUTER + R_ZODIAC_INNER) / 2);
            const largeArc = 0; // 30° < 180°
            return (
              <g key={i}>
                <path
                  d={`M ${s.x} ${s.y} A ${R_ZODIAC_OUTER} ${R_ZODIAC_OUTER} 0 ${largeArc} 0 ${e.x} ${e.y} L ${ei.x} ${ei.y} A ${R_ZODIAC_INNER} ${R_ZODIAC_INNER} 0 ${largeArc} 1 ${si.x} ${si.y} Z`}
                  fill={i % 2 === 0 ? "rgba(212,175,55,0.04)" : "transparent"}
                  stroke="none"
                />
                <line
                  x1={s.x} y1={s.y} x2={si.x} y2={si.y}
                  stroke="rgba(212,175,55,0.16)" strokeWidth={0.5}
                />
                <text
                  x={mid.x} y={mid.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={10} fill="rgba(212,175,55,0.45)"
                >
                  {sym}
                </text>
              </g>
            );
          })}

          {/* ── Ring separators ── */}
          <circle cx={CX} cy={CY} r={R_DIVIDER} fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth={0.5} />
          <circle cx={CX} cy={CY} r={R_B - 14}  fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth={0.5} />

          {/* ── Aspect lines ── */}
          {visibleAspects.map((a, i) => {
            const from = lonToXY(a.lon_a, R_LINE_A);
            const to   = lonToXY(a.lon_b, R_LINE_B);
            const col  = aspectColor(a);
            const dash = aspectDash(a);
            const isHov = hovered === a;

            return (
              <motion.line
                key={`${a.planet_a}-${a.planet_b}-${a.type}`}
                x1={from.x} y1={from.y}
                x2={to.x}   y2={to.y}
                stroke={col}
                strokeWidth={isHov ? 1.8 : 0.9}
                strokeDasharray={dash}
                strokeLinecap="round"
                style={{ cursor: "pointer" }}
                initial={animate ? { opacity: 0 } : { opacity: isHov ? 0.95 : 0.45 }}
                animate={{ opacity: isHov ? 0.95 : 0.45 }}
                transition={animate ? { delay: 1.6 + i * 0.10, duration: 0.45 } : { duration: 0.15 }}
                onPointerEnter={e => handleLineEnter(a, e)}
                onPointerLeave={handleLineLeave}
                onClick={() => handleLineTap(a)}
              />
            );
          })}

          {/* ── Person A planets (outer ring, gold) ── */}
          {planetsA.map((p, i) => {
            const pos = lonToXY(p.lon, R_A);
            return (
              <motion.g
                key={`A-${p.name}`}
                initial={animate ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={animate ? { delay: i * 0.07, duration: 0.4 } : { duration: 0 }}
              >
                <circle cx={pos.x} cy={pos.y} r={9} fill="rgba(11,9,18,0.85)" stroke="rgba(212,175,55,0.55)" strokeWidth={0.8} />
                <text
                  x={pos.x} y={pos.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={8.5} fill="#FFAE3D"
                  style={{ fontFamily: "system-ui" }}
                >
                  {PLANET_SYMBOL[p.name] ?? p.name[0]}
                </text>
              </motion.g>
            );
          })}

          {/* ── Person B planets (inner ring, rose) ── */}
          {planetsB.map((p, i) => {
            const pos = lonToXY(p.lon, R_B);
            return (
              <motion.g
                key={`B-${p.name}`}
                initial={animate ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={animate ? { delay: planetsA.length * 0.07 + i * 0.07, duration: 0.4 } : { duration: 0 }}
              >
                <circle cx={pos.x} cy={pos.y} r={9} fill="rgba(11,9,18,0.85)" stroke="rgba(248,113,133,0.55)" strokeWidth={0.8} />
                <text
                  x={pos.x} y={pos.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={8.5} fill="#f87185"
                  style={{ fontFamily: "system-ui" }}
                >
                  {PLANET_SYMBOL[p.name] ?? p.name[0]}
                </text>
              </motion.g>
            );
          })}

          {/* ── Center label ── */}
          <text x={CX} y={CY - 8}  textAnchor="middle" fontSize={9} fill="rgba(212,175,55,0.45)" letterSpacing="0.08em">
            SYNASTRIA
          </text>
          <text x={CX} y={CY + 8}  textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.18)">
            {aspects.length} aspektów
          </text>
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hovered && tooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg text-xs max-w-[200px]"
              style={{
                left:       `${Math.min(tooltip.x, 65)}%`,
                top:        `${Math.min(tooltip.y, 75)}%`,
                transform:  "translate(-50%, -110%)",
                background: "rgba(11,9,18,0.96)",
                border:     `0.5px solid ${aspectColor(hovered)}`,
                color:      "#e2e8f0",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: "#FFAE3D" }}>{PLANET_SYMBOL[hovered.planet_a]} {hovered.planet_a}</span>
              {" "}
              <span style={{ color: aspectColor(hovered) }}>{ASPECT_TYPE_LABEL[hovered.type]}</span>
              {" "}
              <span style={{ color: "#f87185" }}>{PLANET_SYMBOL[hovered.planet_b]} {hovered.planet_b}</span>
              <br />
              <span style={{ color: "rgba(255,255,255,0.40)", fontSize: 10 }}>
                orb {hovered.orb_degrees}°
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Show-all toggle */}
      {hasMore && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="text-xs py-1 px-3 rounded-full transition-colors"
          style={{
            color:      "rgba(212,175,55,0.65)",
            border:     "0.5px solid rgba(212,175,55,0.20)",
            background: "transparent",
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.06)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        >
          {showAll ? "Pokaż top 15" : `Pokaż wszystkie (${aspects.length})`}
        </button>
      )}

      {/* Mobile aspect list (visible when no hover) */}
      <div className="w-full max-w-sm space-y-1 mt-1 sm:hidden">
        {visibleAspects.slice(0, 5).map(a => (
          <div
            key={`${a.planet_a}-${a.planet_b}`}
            className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}
          >
            <span>
              <span style={{ color: "#FFAE3D" }}>{PLANET_SYMBOL[a.planet_a]} {a.planet_a}</span>
              {" · "}
              <span style={{ color: aspectColor(a) }}>{ASPECT_TYPE_LABEL[a.type]}</span>
              {" · "}
              <span style={{ color: "#f87185" }}>{PLANET_SYMBOL[a.planet_b]} {a.planet_b}</span>
            </span>
            <span style={{ color: "rgba(255,255,255,0.30)" }}>{a.orb_degrees}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}
