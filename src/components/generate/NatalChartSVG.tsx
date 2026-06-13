"use client";

import { useState, useEffect, useRef } from "react";
import { NatalChart, Planet, ZODIAC_SIGNS } from "@/lib/astro-types";
import { SIGN_LOCATIVE } from "@/lib/i18n/astro";
import { GLYPH_NODES, SIGN_KEYS, signIndexFromLon } from "@/components/astro/zodiacGlyphs";

// U+FE0E — wymusza prezentację tekstową symbolu (nie emoji). Doklejany do glifu
// w jednym węźle tekstowym, inaczej się nie łączy.
const FE0E = "︎";

// ─── Paleta (wyłącznie tokeny DS) ───────────────────────────────────────────
// Solidne kolory przez zmienne CSS; półprzezroczyste nakładki przez rgba z RGB
// tokenów (accent 255,174,61 · accent-deep 224,181,102 · line 43,37,64).
// Jedyny kolor napięcia: #E2654A (DS --p-mars).
const C = {
  accent: "var(--accent)",
  accentDeep: "var(--accent-deep)",
  voice: "var(--voice)",
  muted: "var(--text-muted)",
  line: "var(--line)",
  tense: "#E2654A",
};
const accentA = (a: number) => `rgba(255,174,61,${a})`;
const deepA = (a: number) => `rgba(224,181,102,${a})`;
const lineA = (a: number) => `rgba(43,37,64,${a})`;

// ─── Layout ─────────────────────────────────────────────────────────────────

const CX = 300, CY = 300;
const R_OUTER       = 278;
const R_ZODIAC      = 242;
const R_SIGN_GLYPH  = 260;
const R_HOUSE_OUT   = 218;
const R_HOUSE_IN    = 196;
const R_HOUSE_NUM   = 207;
const R_PLANET_PRIMARY   = 172;
const R_PLANET_SECONDARY = 138;
const R_HUB         = 92;
const R_ASPECT      = 150;

// ─── Geometry ─────────────────────────────────────────────────────────────────

function lonToAngle(lon: number, asc: number): number {
  return Math.PI - ((lon - asc + 360) % 360) * (Math.PI / 180);
}
function polarToXY(angle: number, r: number, cx = CX, cy = CY) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

// ─── Aspect engine (logika bez zmian, kolory → tokeny) ──────────────────────

const ASPECT_DEFS = [
  { name: "conjunction" as const, target: 0,   orb: 8, weight: 10, harmonious: true,  color: C.accentDeep, dash: undefined },
  { name: "opposition"  as const, target: 180, orb: 8, weight: 7,  harmonious: false, color: C.tense,      dash: "7 4"    },
  { name: "trine"       as const, target: 120, orb: 7, weight: 6,  harmonious: true,  color: C.accentDeep, dash: undefined },
  { name: "square"      as const, target: 90,  orb: 6, weight: 5,  harmonious: false, color: C.tense,      dash: "4 3"    },
  { name: "sextile"     as const, target: 60,  orb: 5, weight: 4,  harmonious: true,  color: C.accentDeep, dash: undefined },
] as const;

type AspectName = typeof ASPECT_DEFS[number]["name"];
type ComputedAspect = {
  p1: Planet; p2: Planet; type: AspectName;
  orb: number; score: number;
  color: string; dash?: string; harmonious: boolean;
};

function computeTopAspects(planets: Planet[]): ComputedAspect[] {
  const all: ComputedAspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let diff = Math.abs(planets[i].longitude - planets[j].longitude);
      if (diff > 180) diff = 360 - diff;
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.target);
        if (orb <= def.orb) {
          all.push({
            p1: planets[i], p2: planets[j],
            type: def.name, orb,
            score: def.weight * (1 - orb / def.orb),
            color: def.color, dash: def.dash, harmonious: def.harmonious,
          });
          break;
        }
      }
    }
  }
  return all.sort((a, b) => b.score - a.score).slice(0, 8);
}

// ─── Stellium fan-out (bez zmian) ───────────────────────────────────────────

const GLYPH_MIN_GAP_DEG = 9.0;
const MAX_SHIFT_DEG     = 12.0;

type Positioned = { planet: Planet; display: number; actual: number; radius: number };

function fanOut(planets: Planet[], asc: number): Positioned[] {
  if (planets.length === 0) return [];
  const relLon = (p: Planet) => ((p.longitude - asc + 360) % 360);
  const getActual = (p: Planet) => lonToAngle(p.longitude, asc);
  const sorted = [...planets].sort((a, b) => relLon(a) - relLon(b));

  const clusters: Planet[][] = [];
  let group: Planet[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (relLon(sorted[i]) - relLon(sorted[i - 1]) < GLYPH_MIN_GAP_DEG) group.push(sorted[i]);
    else { clusters.push(group); group = [sorted[i]]; }
  }
  clusters.push(group);

  const result: Positioned[] = [];
  for (const cluster of clusters) {
    if (cluster.length === 1) {
      const p = cluster[0];
      const a = getActual(p);
      result.push({ planet: p, actual: a, display: a, radius: R_PLANET_PRIMARY });
      continue;
    }
    const lons = cluster.map(relLon);
    const centroid = lons.reduce((s, x) => s + x, 0) / lons.length;
    const n = cluster.length;
    const halfSpread = ((n - 1) * GLYPH_MIN_GAP_DEG) / 2;
    const spreadGroup = (g: Planet[], radius: number) => {
      const m = g.length;
      const hs = m > 1 ? ((m - 1) * GLYPH_MIN_GAP_DEG) / 2 : 0;
      g.forEach((p, i) => {
        const dispRelLon = centroid - hs + i * GLYPH_MIN_GAP_DEG;
        const dispLon = (dispRelLon + asc + 360) % 360;
        result.push({ planet: p, actual: getActual(p), display: lonToAngle(dispLon, asc), radius });
      });
    };
    if (halfSpread <= MAX_SHIFT_DEG) spreadGroup(cluster, R_PLANET_PRIMARY);
    else {
      spreadGroup(cluster.filter((_, i) => i % 2 === 0), R_PLANET_PRIMARY);
      spreadGroup(cluster.filter((_, i) => i % 2 === 1), R_PLANET_SECONDARY);
    }
  }
  return result;
}

function angularShiftDeg(a: number, b: number): number {
  const raw = Math.abs(a - b);
  const norm = Math.min(raw, 2 * Math.PI - raw);
  return norm * (180 / Math.PI);
}

// ─── Copy do panelu ─────────────────────────────────────────────────────────

const PLANET_ACTION: Record<string, string> = {
  "Słońce": "Tożsamość i wola", "Księżyc": "Emocje i instynkt",
  "Merkury": "Myślenie i komunikacja", "Wenus": "Miłość i wartości",
  "Mars": "Energia i działanie", "Jowisz": "Wzrost i szczęście",
  "Saturn": "Struktura i wytrwałość", "Uran": "Przebudzenie i zmiana",
  "Neptun": "Duchowość i intuicja", "Pluton": "Transformacja i głębia",
};
const SIGN_QUALITY: Record<string, string> = {
  "Baran": "przez inicjatywę i odwagę", "Byk": "przez wytrwałość i zmysłowość",
  "Bliźnięta": "przez komunikację i ciekawość", "Rak": "przez opiekę i emocjonalną pamięć",
  "Lew": "przez ekspresję i lojalność", "Panna": "przez analizę i doskonałość",
  "Waga": "przez harmonię i relacje", "Skorpion": "przez głębię i transformację",
  "Strzelec": "przez wizję i ekspansję", "Koziorożec": "przez dyscyplinę i ambicję",
  "Wodnik": "przez innowację i wolność", "Ryby": "przez empatię i intuicję",
};
const ASPECT_VERB: Record<AspectName, string> = {
  conjunction: "scala z", opposition: "stoi naprzeciw", trine: "harmonizuje z",
  square: "aktywuje napięciem z", sextile: "subtelnie wspiera",
};
const ASPECT_LABEL: Record<AspectName, string> = {
  conjunction: "koniunkcja", opposition: "opozycja", trine: "trygon",
  square: "kwadrat", sextile: "sekstyl",
};
function planetSignDesc(planet: string, sign: string): string {
  return `${PLANET_ACTION[planet] ?? planet} ${SIGN_QUALITY[sign] ?? `w ${SIGN_LOCATIVE[sign] ?? sign}`}.`;
}
function aspectOneLineSentence(a: ComputedAspect): string {
  const e1 = (PLANET_ACTION[a.p1.name] ?? a.p1.name).toLowerCase();
  const e2 = (PLANET_ACTION[a.p2.name] ?? a.p2.name).toLowerCase();
  return `${cap(e1)} ${ASPECT_VERB[a.type]} ${e2}.`;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ─── Component ──────────────────────────────────────────────────────────────

interface Props { chart: NatalChart }

export default function NatalChartSVG({ chart }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { planets, houses, ascendant: asc, mc } = chart;
  const hasHouses = Array.isArray(houses) && houses.length === 12 && !chart.birthData.timeUnknown;
  const aspects = computeTopAspects(planets);
  const positioned = fanOut(planets, asc);
  const occupied = new Set(planets.map(p => signIndexFromLon(p.longitude)));

  const active = pinned ?? hover;

  // ── Reveal (rotacja -10°→0); reduced-motion → od razu widoczne ──
  useEffect(() => {
    if (typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }
    const node = wrapRef.current;
    if (!node) { setRevealed(true); return; }
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { setRevealed(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const activeAspects = active ? aspects.filter(a => a.p1.name === active || a.p2.name === active) : [];
  const pinnedObj = pinned ? planets.find(p => p.name === pinned) ?? null : null;

  return (
    <div ref={wrapRef}>
      <svg
        viewBox="0 0 600 600"
        className="w-full max-w-[560px] mx-auto"
        aria-label="Koło kosmogramu natalnego"
        style={{
          overflow: "visible",
          transform: revealed ? "none" : "rotate(-10deg) scale(.97)",
          opacity: revealed ? 1 : 0,
          transition: "transform 1.3s var(--ease-out), opacity .9s var(--ease-out)",
        }}
        onClick={(e) => { if ((e.target as SVGElement).tagName === "svg") setPinned(null); }}
      >
        <defs>
          <radialGradient id="nc-hub" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor={accentA(0)} />
            <stop offset="100%" stopColor={accentA(0.08)} />
          </radialGradient>
          <radialGradient id="nc-disc" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--bg-elevated)" />
            <stop offset="100%" stopColor="var(--bg-base)" />
          </radialGradient>
        </defs>

        {/* ── Naprzemienne wypełnienia segmentów ── */}
        {ZODIAC_SIGNS.map((sign, i) => {
          if (i % 2 !== 0) return null;
          const sA = lonToAngle(sign.from, asc);
          const eA = lonToAngle((sign.from + 30) % 360, asc);
          const SO = polarToXY(sA, R_OUTER), EO = polarToXY(eA, R_OUTER);
          const SI = polarToXY(sA, R_ZODIAC), EI = polarToXY(eA, R_ZODIAC);
          return (
            <path key={`wedge-${i}`} fill={deepA(0.03)} stroke="none"
              d={`M ${SO.x} ${SO.y} A ${R_OUTER} ${R_OUTER} 0 0 0 ${EO.x} ${EO.y} L ${EI.x} ${EI.y} A ${R_ZODIAC} ${R_ZODIAC} 0 0 1 ${SI.x} ${SI.y} Z`} />
          );
        })}

        {/* ── Pierścienie ── */}
        <circle cx={CX} cy={CY} r={R_OUTER}     fill="none" stroke={deepA(0.30)} strokeWidth={1} />
        <circle cx={CX} cy={CY} r={R_ZODIAC}    fill="none" stroke={C.line} strokeWidth={1} />
        <circle cx={CX} cy={CY} r={R_HOUSE_OUT} fill="none" stroke={lineA(0.7)} strokeWidth={1} />
        <circle cx={CX} cy={CY} r={R_HOUSE_IN}  fill="none" stroke={lineA(0.55)} strokeWidth={1} />

        {/* ── Tiki co 5° (dłuższe co 10°) ── */}
        {Array.from({ length: 72 }, (_, i) => i * 5).map((deg) => {
          if (deg % 30 === 0) return null;
          const a = lonToAngle(deg, asc);
          const len = deg % 10 === 0 ? 9 : 5;
          const o = polarToXY(a, R_ZODIAC);
          const inn = polarToXY(a, R_ZODIAC - len);
          return <line key={`tick-${deg}`} x1={o.x} y1={o.y} x2={inn.x} y2={inn.y}
            stroke={C.line} strokeWidth={0.8} opacity={0.55} />;
        })}

        {/* ── Granice znaków + glify ── */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const a = lonToAngle(sign.from, asc);
          const o = polarToXY(a, R_OUTER), inn = polarToXY(a, R_ZODIAC);
          const g = polarToXY(lonToAngle(sign.from + 15, asc), R_SIGN_GLYPH);
          const on = occupied.has(i);
          const key = SIGN_KEYS[i];
          return (
            <g key={`sign-${i}`}>
              <line x1={o.x} y1={o.y} x2={inn.x} y2={inn.y} stroke={C.line} strokeWidth={1} opacity={0.7} />
              <svg x={g.x - 11} y={g.y - 11} width={22} height={22} viewBox="0 0 24 24" fill="none"
                style={{ color: on ? C.accentDeep : C.muted, opacity: on ? 1 : 0.65 }}>
                {GLYPH_NODES[key]}
              </svg>
            </g>
          );
        })}

        {/* ── Domy ── */}
        {hasHouses && houses.map((h) => {
          const a = lonToAngle(h.longitude, asc);
          const o = polarToXY(a, R_ZODIAC - 2);
          const inn = polarToXY(a, R_HUB + 2);
          const isAngular = [1, 4, 7, 10].includes(h.house);
          const nextLon = houses[(h.house % 12)].longitude;
          const mid = (h.longitude + ((nextLon - h.longitude + 360) % 360) / 2) % 360;
          const np = polarToXY(lonToAngle(mid, asc), R_HOUSE_NUM);
          return (
            <g key={`house-${h.house}`}>
              <line x1={o.x} y1={o.y} x2={inn.x} y2={inn.y}
                stroke={isAngular ? deepA(0.28) : lineA(0.55)}
                strokeWidth={isAngular ? 1 : 0.6}
                strokeDasharray={isAngular ? undefined : "3 5"} />
              <text x={np.x} y={np.y} textAnchor="middle" dominantBaseline="central"
                fontSize="10.5" fill={C.muted} fillOpacity={isAngular ? 0.9 : 0.55}
                style={{ fontFamily: "'General Sans', sans-serif", fontVariantNumeric: "tabular-nums" }}>
                {h.house}
              </text>
            </g>
          );
        })}

        {/* ── Hub ── */}
        <circle cx={CX} cy={CY} r={R_HUB + 26} fill="url(#nc-hub)" />
        <circle cx={CX} cy={CY} r={R_HUB} fill="url(#nc-disc)" stroke={C.line} strokeWidth={1} />
        <g transform={`translate(${CX}, ${CY}) scale(.42)`} fill={C.accentDeep} opacity={0.20}>
          <path d="M 28.79,-40.86 A 50,50 0 1,0 28.79,40.86 A 40,40 0 1,1 28.79,-40.86 Z" />
          <circle cx="10" cy="0" r="9" />
        </g>

        {/* ── Aspekty ── */}
        {aspects.map((asp) => {
          const a1 = lonToAngle(asp.p1.longitude, asc);
          const a2 = lonToAngle(asp.p2.longitude, asc);
          const q1 = polarToXY(a1, R_ASPECT), q2 = polarToXY(a2, R_ASPECT);
          const involved = active === null || asp.p1.name === active || asp.p2.name === active;
          return (
            <line key={`asp-${asp.p1.name}-${asp.p2.name}`}
              x1={q1.x} y1={q1.y} x2={q2.x} y2={q2.y}
              stroke={asp.color} strokeDasharray={asp.dash}
              strokeWidth={involved ? (active ? 1.6 : 1.1) : 0.5}
              strokeOpacity={active ? (involved ? 0.85 : 0.1) : 0.45}
              style={{ transition: "stroke-opacity .25s, stroke-width .25s" }} />
          );
        })}

        {/* ── Łączniki glif→pozycja rzeczywista ── */}
        {positioned.map(({ planet, display, actual, radius }) => {
          if (angularShiftDeg(display, actual) <= 3) return null;
          const from = polarToXY(display, radius + 12);
          const to = polarToXY(actual, R_HOUSE_IN - 4);
          return <line key={`conn-${planet.name}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={deepA(0.28)} strokeWidth={0.7} strokeDasharray="2 3" />;
        })}
        {positioned.map(({ planet, actual, display }) => {
          if (angularShiftDeg(display, actual) <= 3) return null;
          const p = polarToXY(actual, R_HOUSE_IN - 4);
          return <circle key={`adot-${planet.name}`} cx={p.x} cy={p.y} r={2} fill={C.accentDeep} fillOpacity={0.6} />;
        })}

        {/* ── Planety: punkt + halo + glif (FE0E) ── */}
        {positioned.map(({ planet, display, radius }) => {
          const dot = polarToXY(display, radius - 22);
          const gly = polarToXY(display, radius);
          const showLabel = radius === R_PLANET_PRIMARY;
          const lbl = polarToXY(display, radius - 44);
          const isActive = active === planet.name;
          const isDimmed = active !== null && !isActive;
          return (
            <g key={planet.name} style={{ cursor: "pointer", transition: "opacity .25s" }}
              opacity={isDimmed ? 0.35 : 1}
              onClick={(e) => { e.stopPropagation(); setPinned(prev => prev === planet.name ? null : planet.name); }}
              onMouseEnter={() => setHover(planet.name)}
              onMouseLeave={() => setHover(null)}
            >
              <circle cx={gly.x} cy={gly.y} r={isActive ? 13 : 11}
                fill={C.accent} opacity={isActive ? 0.32 : 0.2}
                style={{ filter: "blur(3.2px)", transition: "opacity .25s" }} />
              <circle cx={dot.x} cy={dot.y} r={3.4} fill={C.accent} />
              <text x={gly.x} y={gly.y} textAnchor="middle" dominantBaseline="central"
                fontSize="16" fill={isActive ? C.accent : C.voice}
                style={{ fontFamily: "system-ui, 'Segoe UI Symbol', sans-serif", transition: "fill .2s" }}>
                {planet.symbol + FE0E}
              </text>
              {planet.isRetrograde && (
                <text x={gly.x + 12} y={gly.y - 9} fontSize="9" fill={C.muted}>℞</text>
              )}
              {showLabel && (
                <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="central"
                  fontSize="10" fill={C.muted}
                  style={{ fontFamily: "'General Sans', sans-serif", fontVariantNumeric: "tabular-nums" }}>
                  {planet.degree}°
                </text>
              )}
            </g>
          );
        })}

        {/* ── Osie ASC/MC/DSC/IC ── */}
        {hasHouses && (() => {
          const axisLine = (lon: number, label: string, strong: boolean) => {
            const a = lonToAngle(lon, asc);
            const p1 = polarToXY(a, R_OUTER + 2);
            const p2 = polarToXY(a, R_HUB);
            const lp = polarToXY(a, R_OUTER + 18);
            return (
              <g key={label}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={C.accentDeep} strokeWidth={1.5}
                  strokeOpacity={strong ? 0.7 : 0.28}
                  strokeDasharray={strong ? undefined : "5 4"} />
                <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="central"
                  fontSize="11" fill={C.muted} fillOpacity={strong ? 1 : 0.55}
                  style={{ fontFamily: "'General Sans', sans-serif", letterSpacing: "0.08em" }}>
                  {label}
                </text>
              </g>
            );
          };
          return (
            <>
              {axisLine(asc, "ASC", true)}
              {axisLine((asc + 180) % 360, "DSC", false)}
              {axisLine(mc, "MC", true)}
              {axisLine((mc + 180) % 360, "IC", false)}
            </>
          );
        })()}

        {/* (środek = oczko znaku z logo w piaście — bez osobnego markera) */}

        {/* ── Tooltip aktywnej planety ── */}
        {active && (() => {
          const obj = planets.find(p => p.name === active);
          const pos = positioned.find(p => p.planet.name === active);
          if (!obj || !pos) return null;
          const t = polarToXY(pos.display, pos.radius + 30);
          return (
            <text x={t.x} y={t.y} textAnchor="middle" dominantBaseline="central"
              role="status" fontSize="11.5" fill={C.voice}
              style={{ fontFamily: "'General Sans', sans-serif", pointerEvents: "none" }}>
              {obj.name} · {obj.degree}° {obj.sign}
            </text>
          );
        })()}
      </svg>

      {/* ── Legenda ── */}
      <div className="flex items-center justify-center gap-5 mt-2 mb-1">
        <div className="flex items-center gap-1.5">
          <svg width="28" height="10"><line x1="2" y1="5" x2="26" y2="5" stroke={C.accentDeep} strokeWidth="1.5" /></svg>
          <span className="text-[10px]" style={{ color: C.muted }}>harmonijne</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="28" height="10"><line x1="2" y1="5" x2="26" y2="5" stroke={C.tense} strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          <span className="text-[10px]" style={{ color: C.muted }}>napięte</span>
        </div>
      </div>

      {/* ── Panel wybranej planety (klik) ── */}
      {pinnedObj && (
        <div className="mt-3 rounded-2xl px-4 py-4 space-y-3"
          style={{ background: "var(--bg-elevated)", border: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-3">
            <span className="text-xl" style={{ color: C.voice }}>{pinnedObj.symbol + FE0E}</span>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {pinnedObj.name}
                {pinnedObj.isRetrograde && <span className="ml-1 text-xs" style={{ color: C.muted }}>℞</span>}
                &nbsp;<span style={{ color: C.accentDeep }}>w {SIGN_LOCATIVE[pinnedObj.sign] ?? pinnedObj.sign}</span>
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                {planetSignDesc(pinnedObj.name, pinnedObj.sign)}
              </p>
            </div>
          </div>
          {activeAspects.length > 0 ? (
            <div className="space-y-1.5 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
              {activeAspects.map(asp => {
                const partner = asp.p1.name === pinned ? asp.p2 : asp.p1;
                const def = ASPECT_DEFS.find(d => d.name === asp.type)!;
                return (
                  <div key={`${asp.p1.name}-${asp.p2.name}`} className="flex items-center gap-2 text-[11px]">
                    <svg width="20" height="10" className="shrink-0">
                      <line x1="2" y1="5" x2="18" y2="5" stroke={def.color} strokeWidth="1.5" strokeDasharray={def.dash} />
                    </svg>
                    <span className="shrink-0" style={{ color: C.muted }}>{ASPECT_LABEL[asp.type]}</span>
                    <span className="shrink-0" style={{ color: C.voice }}>{partner.symbol + FE0E} {partner.name}</span>
                    <span className="text-[10px] ml-auto shrink-0" style={{ color: C.muted }}>orb {asp.orb.toFixed(1)}°</span>
                  </div>
                );
              })}
              <p className="text-[10px] italic pt-1" style={{ color: C.muted }}>{aspectOneLineSentence(activeAspects[0])}</p>
            </div>
          ) : (
            <p className="text-[11px] pt-2" style={{ color: C.muted, borderTop: `1px solid ${C.line}` }}>
              Brak głównych aspektów z tej planety.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
