"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SynastryAspect, PlanetPos } from "@/lib/astro/synastry";

// ─── Layout ──────────────────────────────────────────────────────────────────

const CX = 200, CY = 200;
const R_ZODIAC_OUTER = 185;
const R_ZODIAC_INNER = 165;
const R_A            = 148;  // Person A planet ring
const R_B            = 112;  // Person B planet ring
const R_LINE_A       = 140;  // aspect line endpoint, A-side
const R_LINE_B       = 104;  // aspect line endpoint, B-side

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Coordinate helpers ───────────────────────────────────────────────────────

function lonToXY(lon: number, r: number) {
  // 0° Aries at top, counterclockwise (standard astrology)
  const a = -(Math.PI / 2) - lon * (Math.PI / 180);
  // Zaokrąglamy do 2 miejsc: Math.sin/cos są „implementation-approximated", więc
  // serwer (Node) i klient (przeglądarka) liczą różne ULP-y → hydration mismatch.
  // 0.01 jednostki w viewBox 400 = sub-piksel, niewidoczne.
  return {
    x: Math.round((CX + r * Math.cos(a)) * 100) / 100,
    y: Math.round((CY + r * Math.sin(a)) * 100) / 100,
  };
}

// ─── Glyphs ────────────────────────────────────────────────────────────────────
// Wymuszamy prezentację TEKSTOWĄ (cienki, złoty glif) zamiast emoji (kolorowy
// kwadrat) dopisując U+FE0E (variation selector) + renderując fontem serif.

const VS = "︎";
const ASTRO_RE = /[☉☽☿♀♂♃♄♅♆♇♈-♓]/g;
/** Dopisz selektor prezentacji tekstowej do glifów astro w dowolnym napisie UI. */
export const glyph = (s: string) => s.replace(ASTRO_RE, m => m + VS);

const GLYPH_FONT = 'Georgia, "Times New Roman", serif';

export const PLANET_SYMBOL: Record<string, string> = {
  "Słońce":    "☉" + VS, "Księżyc":  "☽" + VS, "Merkury":  "☿" + VS, "Wenus":    "♀" + VS,
  "Mars":      "♂" + VS, "Jowisz":   "♃" + VS, "Saturn":   "♄" + VS, "Uran":     "♅" + VS,
  "Neptun":    "♆" + VS, "Pluton":   "♇" + VS, "Ascendent": "Asc",
};

const ZODIAC_SYMBOLS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map(s => s + VS);

export const ASPECT_TYPE_LABEL: Record<string, string> = {
  conjunction: "koniunkcja", sextile: "sekstyl", trine: "trygon",
  square: "kwadratura", opposition: "opozycja",
};

// ─── Złoty monochrom (jak kosmogram natalny) ───────────────────────────────────

const COL_A        = "#FFC56B";              // Osoba A — amber
const COL_A_STROKE = "rgba(255,197,107,.75)";
const COL_B        = "#EAD9B0";              // Osoba B — krem
const COL_B_STROKE = "rgba(234,217,176,.70)";

function aspectColor(a: SynastryAspect) {
  if (a.harmony === "harmonious") return "#E0B566"; // amber-gold ciągły
  if (a.harmony === "tense")      return "#E0865A"; // burnt amber przerywany
  return "rgba(182,175,198,0.70)";                  // koniunkcja / neutralny
}

// ─── Legenda (eksport — hero renderuje ją pod kołem) ────────────────────────────

export function SynastryLegend({ nameA = "Osoba A", nameB = "Osoba B" }: { nameA?: string; nameB?: string }) {
  const swatch = (color: string, dashed = false) => (
    <span style={{
      display: "inline-block", width: 14, height: 0,
      borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}`,
      verticalAlign: "middle", marginRight: 5,
    }} />
  );
  return (
    <div style={{
      display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap",
      fontSize: 11.5, color: "#877FA0",
    }}>
      <span>{swatch(COL_A)}<span style={{ color: COL_A }}>{nameA}</span></span>
      <span>{swatch(COL_B)}<span style={{ color: COL_B }}>{nameB}</span></span>
      <span>{swatch("#E0B566")}harmonijny</span>
      <span>{swatch("#E2654A", true)}napięty</span>
    </div>
  );
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
  /** Hero: renderuj samo koło (SVG + tooltip), bez legendy/listy — wypełnia kontener. */
  bare?:       boolean;
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
  bare = false,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const [hovered, setHovered] = useState<SynastryAspect | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
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
  function handleLineLeave() { setHovered(null); setTooltip(null); }
  function handleLineTap(a: SynastryAspect) { setHovered(prev => prev === a ? null : a); }

  // ── SVG wheel (wspólne dla bare/full) ──
  const wheel = (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox="0 0 400 400"
        width="100%"
        height={bare ? "100%" : undefined}
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
          const s  = lonToXY(startLon, R_ZODIAC_OUTER);
          const e  = lonToXY(endLon, R_ZODIAC_OUTER);
          const si = lonToXY(startLon, R_ZODIAC_INNER);
          const ei = lonToXY(endLon, R_ZODIAC_INNER);
          const mid = lonToXY(midLon, (R_ZODIAC_OUTER + R_ZODIAC_INNER) / 2);
          return (
            <g key={i}>
              {i % 2 === 0 && (
                <path
                  d={`M ${s.x} ${s.y} A ${R_ZODIAC_OUTER} ${R_ZODIAC_OUTER} 0 0 0 ${e.x} ${e.y} L ${ei.x} ${ei.y} A ${R_ZODIAC_INNER} ${R_ZODIAC_INNER} 0 0 1 ${si.x} ${si.y} Z`}
                  fill="rgba(212,175,55,0.04)" stroke="none"
                />
              )}
              <line x1={s.x} y1={s.y} x2={si.x} y2={si.y} stroke="rgba(212,175,55,0.16)" strokeWidth={0.5} />
              <text
                x={mid.x} y={mid.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={11} fill="rgba(224,181,102,0.60)"
                style={{ fontFamily: GLYPH_FONT }}
              >
                {sym}
              </text>
            </g>
          );
        })}

        {/* ── Pierścień stopni (co 5°, dłuższe co 30°) — jak na ekranie natala ── */}
        {Array.from({ length: 72 }).map((_, k) => {
          const d = k * 5;
          const o = lonToXY(d, R_ZODIAC_INNER - 2);
          const q = lonToXY(d, d % 30 === 0 ? R_ZODIAC_INNER - 12 : R_ZODIAC_INNER - 7);
          return (
            <line key={`deg-${d}`} x1={o.x} y1={o.y} x2={q.x} y2={q.y}
              stroke="rgba(224,181,102,0.22)" strokeWidth={d % 30 === 0 ? 0.8 : 0.4} />
          );
        })}

        {/* ── Ring separators ── */}
        <circle cx={CX} cy={CY} r={128}      fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth={0.5} />
        <circle cx={CX} cy={CY} r={R_B - 14} fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth={0.5} />

        {/* ── Aspect lines (rysują się od planety A do B) ── */}
        {visibleAspects.map((a, i) => {
          const from = lonToXY(a.lon_a, R_LINE_A);
          const to   = lonToXY(a.lon_b, R_LINE_B);
          const len  = Math.round(Math.hypot(to.x - from.x, to.y - from.y) * 100) / 100;
          const col  = aspectColor(a);
          const isHov = hovered === a;
          // Uwaga: w trybie animowanym linia napięta rysuje się dashoffsetem (dasharray=len),
          // więc finalnie jest ciągła — rozróżnienie napięcia niesie kolor (#E0865A).
          // Dash "4 3" pokazujemy w stanie statycznym (instant / reduced-motion). [zgodne z mock-upem]
          return (
            <motion.line
              key={`${a.planet_a}-${a.planet_b}-${a.type}`}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={col}
              strokeWidth={isHov ? 1.8 : a.harmony === "tense" ? 1 : 0.9}
              strokeLinecap="round"
              strokeDasharray={animate ? len : a.harmony === "tense" ? "4 3" : undefined}
              style={{ cursor: "pointer" }}
              initial={animate ? { strokeDashoffset: len, opacity: 0 } : false}
              animate={animate ? { strokeDashoffset: 0, opacity: 0.5 } : { opacity: 0.5 }}
              transition={animate ? { delay: 0.52 + i * 0.08, duration: 0.55, ease: EASE } : { duration: 0 }}
              onPointerEnter={e => handleLineEnter(a, e)}
              onPointerLeave={handleLineLeave}
              onClick={() => handleLineTap(a)}
            />
          );
        })}

        {/* ── Person A planets (outer ring, amber) ── */}
        {planetsA.map((p, i) => {
          const pos = lonToXY(p.lon, R_A);
          return (
            <motion.g
              key={`A-${p.name}`}
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={animate ? { delay: 0.06 + i * 0.055, duration: 0.4 } : { duration: 0 }}
            >
              <circle cx={pos.x} cy={pos.y} r={9.5} fill="rgba(11,9,18,0.92)" stroke={COL_A_STROKE} strokeWidth={0.9} />
              <text
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={p.name === "Ascendent" ? 7 : 10} fill={COL_A}
                style={{ fontFamily: GLYPH_FONT }}
              >
                {PLANET_SYMBOL[p.name] ?? p.name[0]}
              </text>
            </motion.g>
          );
        })}

        {/* ── Person B planets (inner ring, krem) ── */}
        {planetsB.map((p, i) => {
          const pos = lonToXY(p.lon, R_B);
          return (
            <motion.g
              key={`B-${p.name}`}
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={animate ? { delay: 0.06 + (planetsA.length + i) * 0.055, duration: 0.4 } : { duration: 0 }}
            >
              <circle cx={pos.x} cy={pos.y} r={9.5} fill="rgba(11,9,18,0.92)" stroke={COL_B_STROKE} strokeWidth={0.9} />
              <text
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={p.name === "Ascendent" ? 7 : 10} fill={COL_B}
                style={{ fontFamily: GLYPH_FONT }}
              >
                {PLANET_SYMBOL[p.name] ?? p.name[0]}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg text-xs"
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
            <span style={{ color: COL_A }}>{PLANET_SYMBOL[hovered.planet_a]} {hovered.planet_a}</span>
            {" "}
            <span style={{ color: aspectColor(hovered) }}>{ASPECT_TYPE_LABEL[hovered.type]}</span>
            {" "}
            <span style={{ color: COL_B }}>{PLANET_SYMBOL[hovered.planet_b]} {hovered.planet_b}</span>
            <br />
            <span style={{ color: "rgba(255,255,255,0.40)", fontSize: 10 }}>orb {hovered.orb_degrees}°</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Hero: tylko koło, wypełnia okrągły kontener.
  if (bare) return wheel;

  // Standalone: legenda + koło + toggle + lista mobilna.
  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <SynastryLegend nameA={nameA} nameB={nameB} />

      <div className="relative w-full" style={{ maxWidth: 390 }}>
        {wheel}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="text-xs py-1 px-3 rounded-full transition-colors"
          style={{ color: "rgba(212,175,55,0.65)", border: "0.5px solid rgba(212,175,55,0.20)", background: "transparent" }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.06)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        >
          {showAll ? "Pokaż top 15" : `Pokaż wszystkie (${aspects.length})`}
        </button>
      )}

      <div className="w-full max-w-sm space-y-1 mt-1 sm:hidden">
        {visibleAspects.slice(0, 5).map(a => (
          <div
            key={`${a.planet_a}-${a.planet_b}`}
            className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}
          >
            <span>
              <span style={{ color: COL_A }}>{PLANET_SYMBOL[a.planet_a]} {a.planet_a}</span>
              {" · "}
              <span style={{ color: aspectColor(a) }}>{ASPECT_TYPE_LABEL[a.type]}</span>
              {" · "}
              <span style={{ color: COL_B }}>{PLANET_SYMBOL[a.planet_b]} {a.planet_b}</span>
            </span>
            <span style={{ color: "rgba(255,255,255,0.30)" }}>{a.orb_degrees}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}
