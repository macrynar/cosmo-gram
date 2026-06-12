"use client";

import { useState, useEffect } from "react";
import { NatalChart, Planet, PLANET_COLORS, ZODIAC_SIGNS } from "@/lib/astro-types";
import { SIGN_LOCATIVE } from "@/lib/i18n/astro";

// ─── Layout constants ─────────────────────────────────────────────────────────

const CX = 300, CY = 300;
const R_OUTER     = 278;
const R_ZODIAC    = 242;
const R_HOUSE_OUT = 218;
const R_HOUSE_IN  = 188;
const R_PLANET    = 158;
const R_INNER     = 96; // reduced dead disc

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function lonToAngle(lon: number, asc: number): number {
  return Math.PI - ((lon - asc + 360) % 360) * (Math.PI / 180);
}
function polarToXY(angle: number, r: number, cx = CX, cy = CY) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

// ─── Aspect engine ────────────────────────────────────────────────────────────

const ASPECT_DEFS = [
  { name: "conjunction" as const, target: 0,   orb: 8, weight: 10, harmonious: true,  color: "#D4AF37", dash: undefined },
  { name: "opposition"  as const, target: 180, orb: 8, weight: 7,  harmonious: false, color: "#e05c5c", dash: "8 4"    },
  { name: "trine"       as const, target: 120, orb: 7, weight: 6,  harmonious: true,  color: "#28c897", dash: undefined },
  { name: "square"      as const, target: 90,  orb: 6, weight: 5,  harmonious: false, color: "#e8903a", dash: "5 3"    },
  { name: "sextile"     as const, target: 60,  orb: 5, weight: 4,  harmonious: true,  color: "#5da8e8", dash: undefined },
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

// ─── Stellium fan-out ─────────────────────────────────────────────────────────
// Planets within ~9° of each other are spread along the arc; a line connects
// the displayed glyph back to the actual ecliptic position.

function fanOut(planets: Planet[], asc: number) {
  const MIN_GAP = 0.17; // ~9.7° minimum glyph spacing
  const arr = planets
    .map(p => ({
      planet:  p,
      display: lonToAngle(p.longitude, asc),
      actual:  lonToAngle(p.longitude, asc),
    }))
    .sort((a, b) => a.display - b.display);

  for (let pass = 0; pass < 10; pass++) {
    for (let i = 1; i < arr.length; i++) {
      let d = arr[i].display - arr[i - 1].display;
      while (d > Math.PI)  d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      if (d < MIN_GAP) {
        const push = (MIN_GAP - d) / 2 + 0.001;
        arr[i - 1].display -= push;
        arr[i].display     += push;
      }
    }
  }
  return arr;
}

// ─── Descriptions ─────────────────────────────────────────────────────────────

const PLANET_ACTION: Record<string, string> = {
  "Słońce":  "Tożsamość i wola",
  "Księżyc": "Emocje i instynkt",
  "Merkury": "Myślenie i komunikacja",
  "Wenus":   "Miłość i wartości",
  "Mars":    "Energia i działanie",
  "Jowisz":  "Wzrost i szczęście",
  "Saturn":  "Struktura i wytrwałość",
  "Uran":    "Przebudzenie i zmiana",
  "Neptun":  "Duchowość i intuicja",
  "Pluton":  "Transformacja i głębia",
};

const SIGN_QUALITY: Record<string, string> = {
  "Baran":      "przez inicjatywę i odwagę",
  "Byk":        "przez wytrwałość i zmysłowość",
  "Bliźnięta":  "przez komunikację i ciekawość",
  "Rak":        "przez opiekę i emocjonalną pamięć",
  "Lew":        "przez ekspresję i lojalność",
  "Panna":      "przez analizę i doskonałość",
  "Waga":       "przez harmonię i relacje",
  "Skorpion":   "przez głębię i transformację",
  "Strzelec":   "przez wizję i ekspansję",
  "Koziorożec": "przez dyscyplinę i ambicję",
  "Wodnik":     "przez innowację i wolność",
  "Ryby":       "przez empatię i intuicję",
};

const ASPECT_VERB: Record<AspectName, string> = {
  conjunction: "scala z",
  opposition:  "stoi naprzeciw",
  trine:       "harmonizuje z",
  square:      "aktywuje napięciem z",
  sextile:     "subtelnie wspiera",
};

const ASPECT_LABEL: Record<AspectName, string> = {
  conjunction: "koniunkcja",
  opposition:  "opozycja",
  trine:       "trygon",
  square:      "kwadrat",
  sextile:     "sekstyl",
};

function planetSignDesc(planet: string, sign: string): string {
  return `${PLANET_ACTION[planet] ?? planet} ${SIGN_QUALITY[sign] ?? `w ${SIGN_LOCATIVE[sign] ?? sign}`}.`;
}

function aspectOneLineSentence(a: ComputedAspect): string {
  const e1 = (PLANET_ACTION[a.p1.name] ?? a.p1.name).toLowerCase();
  const e2 = (PLANET_ACTION[a.p2.name] ?? a.p2.name).toLowerCase();
  return `${capitalize(e1)} ${ASPECT_VERB[a.type]} ${e2}.`;
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { chart: NatalChart }

export default function NatalChartSVG({ chart }: Props) {
  const [activePlanet, setActivePlanet] = useState<string | null>(null);
  const [pulseVisible, setPulseVisible] = useState(false);

  const { planets, houses, ascendant: asc, mc } = chart;
  const aspects   = computeTopAspects(planets);
  const positioned = fanOut(planets, asc);

  // First-entry pulse on Sun — fires once, fades after 1.5s
  useEffect(() => {
    const t0 = setTimeout(() => setPulseVisible(true),  500);
    const t1 = setTimeout(() => setPulseVisible(false), 2000);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, []);

  const handlePlanetClick = (name: string) =>
    setActivePlanet(prev => (prev === name ? null : name));

  // Aspects connected to active planet (for highlight)
  const activeAspects = activePlanet
    ? aspects.filter(a => a.p1.name === activePlanet || a.p2.name === activePlanet)
    : [];
  const activePlanetObj = activePlanet
    ? planets.find(p => p.name === activePlanet) ?? null
    : null;

  return (
    <div>
      <svg
        viewBox="0 0 600 600"
        className="w-full max-w-[560px]"
        aria-label="Kosmogram natalny"
        style={{ overflow: "visible" }}
        onClick={e => {
          // click on background = deselect
          if ((e.target as SVGElement).tagName === "svg") setActivePlanet(null);
        }}
      >
        <defs>
          <filter id="axis-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="planet-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="inner-disc" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#0d0b16" />
            <stop offset="100%" stopColor="#050508" />
          </radialGradient>
          <style>{`
            @keyframes subtlePulse {
              0%,100% { opacity: 0; r: 17; }
              50%      { opacity: 0.55; r: 22; }
            }
          `}</style>
        </defs>

        {/* ── Zodiac ring ── */}
        {ZODIAC_SIGNS.map((sign) => {
          const startA = lonToAngle(sign.from, asc);
          const endA   = lonToAngle((sign.from + 30) % 360, asc);
          const SO = polarToXY(startA, R_OUTER);
          const EO = polarToXY(endA,   R_OUTER);
          const SI = polarToXY(startA, R_ZODIAC);
          const EI = polarToXY(endA,   R_ZODIAC);
          const pathD = [
            `M ${SO.x} ${SO.y}`,
            `A ${R_OUTER} ${R_OUTER} 0 0 0 ${EO.x} ${EO.y}`,
            `L ${EI.x} ${EI.y}`,
            `A ${R_ZODIAC} ${R_ZODIAC} 0 0 1 ${SI.x} ${SI.y}`,
            "Z",
          ].join(" ");
          const sym = polarToXY(lonToAngle(sign.from + 15, asc), (R_ZODIAC + R_OUTER) / 2);
          return (
            <g key={sign.symbol}>
              <path d={pathD} fill="rgba(212,175,55,0.038)" stroke="rgba(212,175,55,0.22)" strokeWidth={0.5} />
              <text x={sym.x} y={sym.y} textAnchor="middle" dominantBaseline="central"
                fontSize="16" fill="rgba(212,175,55,0.80)" style={{ fontFamily: "serif" }}>
                {sign.symbol}
              </text>
            </g>
          );
        })}

        {/* ── Degree ticks ── */}
        {Array.from({ length: 36 }, (_, i) => {
          const a = lonToAngle(i * 10, asc);
          const outer = polarToXY(a, R_OUTER);
          const inner = polarToXY(a, R_OUTER - (i % 3 === 0 ? 10 : 5));
          return (
            <line key={i} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
              stroke="rgba(212,175,55,0.18)" strokeWidth={i % 3 === 0 ? 0.9 : 0.4} />
          );
        })}

        {/* ── Ring borders ── */}
        <circle cx={CX} cy={CY} r={R_OUTER}     fill="none" stroke="rgba(212,175,55,0.58)" strokeWidth={1.5} />
        <circle cx={CX} cy={CY} r={R_ZODIAC}    fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth={0.8} />
        <circle cx={CX} cy={CY} r={R_HOUSE_OUT} fill="none" stroke="rgba(212,175,55,0.14)" strokeWidth={0.5} />
        <circle cx={CX} cy={CY} r={R_HOUSE_IN}  fill="none" stroke="rgba(212,175,55,0.10)" strokeWidth={0.4} />

        {/* ── House cusps ── */}
        {houses.map((h) => {
          const angle     = lonToAngle(h.longitude, asc);
          const outer     = polarToXY(angle, R_ZODIAC - 2);
          const inner     = polarToXY(angle, R_INNER + 2);
          const isAngular = [1, 4, 7, 10].includes(h.house);
          const nextLon   = houses[(h.house % 12)].longitude;
          const mid       = (h.longitude + ((nextLon - h.longitude + 360) % 360) / 2) % 360;
          const numPos    = polarToXY(lonToAngle(mid, asc), (R_HOUSE_IN + R_INNER) / 2);
          return (
            <g key={h.house}>
              <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
                stroke={isAngular ? "rgba(212,175,55,0.38)" : "rgba(255,255,255,0.09)"}
                strokeWidth={isAngular ? 1.2 : 0.5}
                strokeDasharray={isAngular ? undefined : "3 5"} />
              <text x={numPos.x} y={numPos.y} textAnchor="middle" dominantBaseline="central"
                fontSize="11"
                fill={isAngular ? "rgba(212,175,55,0.60)" : "rgba(255,255,255,0.22)"}
                style={{ fontFamily: "'Inter', sans-serif" }}>
                {h.house}
              </text>
            </g>
          );
        })}

        {/* ── Inner disc ── */}
        <circle cx={CX} cy={CY} r={R_INNER}
          fill="url(#inner-disc)" stroke="rgba(212,175,55,0.16)" strokeWidth={0.8} />

        {/* ── Aspect lines — top 8, color-coded, interactive ── */}
        {aspects.map((asp) => {
          const a1 = lonToAngle(asp.p1.longitude, asc);
          const a2 = lonToAngle(asp.p2.longitude, asc);
          const q1 = polarToXY(a1, R_INNER - 5);
          const q2 = polarToXY(a2, R_INNER - 5);

          const isInvolved = activePlanet === null
            || asp.p1.name === activePlanet
            || asp.p2.name === activePlanet;

          return (
            <line key={`${asp.p1.name}-${asp.p2.name}`}
              x1={q1.x} y1={q1.y} x2={q2.x} y2={q2.y}
              stroke={asp.color}
              strokeWidth={isInvolved ? (activePlanet ? 1.8 : 1.1) : 0.5}
              strokeOpacity={activePlanet ? (isInvolved ? 0.90 : 0.10) : 0.55}
              strokeDasharray={asp.dash}
              style={{ transition: "stroke-opacity 0.25s, stroke-width 0.25s" }} />
          );
        })}

        {/* ── Stellium connector lines: display pos → actual pos ── */}
        {positioned.map(({ planet, display, actual }) => {
          if (Math.abs(display - actual) < 0.01) return null;
          const from = polarToXY(display, R_PLANET + 18);
          const to   = polarToXY(actual,  R_HOUSE_OUT - 5);
          return (
            <line key={`connector-${planet.name}`}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={PLANET_COLORS[planet.name] ?? "#a78bfa"}
              strokeOpacity={0.30} strokeWidth={0.7}
              strokeDasharray="2 2" />
          );
        })}

        {/* ── Planet position dots on house ring ── */}
        {planets.map((p) => {
          const pos   = polarToXY(lonToAngle(p.longitude, asc), R_HOUSE_OUT - 6);
          const color = PLANET_COLORS[p.name] ?? "#a78bfa";
          return (
            <circle key={`dot-${p.name}`}
              cx={pos.x} cy={pos.y} r={2.5}
              fill={color} fillOpacity={0.60} />
          );
        })}

        {/* ── Planets — clickable, interactive dim ── */}
        {positioned.map(({ planet, display }) => {
          const pos   = polarToXY(display, R_PLANET);
          const color = PLANET_COLORS[planet.name] ?? "#a78bfa";
          const isActive  = activePlanet === planet.name;
          const isDimmed  = activePlanet !== null && !isActive;
          const isPulsing = pulseVisible && planet.name === "Słońce" && activePlanet === null;

          return (
            <g key={planet.name}
              filter="url(#planet-glow)"
              style={{ cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); handlePlanetClick(planet.name); }}
            >
              {/* First-entry pulse ring on Sun */}
              {isPulsing && (
                <circle
                  cx={pos.x} cy={pos.y} r={17}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  style={{ animation: "subtlePulse 1.2s ease-in-out infinite" }}
                />
              )}
              {/* Active ring */}
              {isActive && (
                <circle cx={pos.x} cy={pos.y} r={20}
                  fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.60} />
              )}
              {/* Planet circle */}
              <circle cx={pos.x} cy={pos.y} r={15}
                fill={isActive ? `${color}22` : "rgba(5,4,14,0.90)"}
                stroke={color}
                strokeWidth={isActive ? 2.0 : 1.5}
                strokeOpacity={isDimmed ? 0.30 : 0.88}
                style={{ transition: "stroke-opacity 0.25s, fill 0.25s" }} />
              {/* Symbol */}
              <text
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize="14" fill={color} fontWeight="500"
                fillOpacity={isDimmed ? 0.30 : 1}
                style={{ fontFamily: "serif", transition: "fill-opacity 0.25s" }}
              >
                {planet.symbol}
              </text>
              {planet.isRetrograde && (
                <text x={pos.x + 13} y={pos.y - 10} fontSize="9"
                  fill={color} fillOpacity={isDimmed ? 0.20 : 0.70}>↺</text>
              )}
            </g>
          );
        })}

        {/* ── ASC axis ── */}
        {(() => {
          const a   = lonToAngle(asc, asc);
          const p1  = polarToXY(a, R_OUTER + 2);
          const p2  = polarToXY(a, R_INNER);
          const lbl = polarToXY(a, R_OUTER + 24);
          return (
            <g filter="url(#axis-glow)">
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#D4AF37" strokeWidth={2.0} />
              <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="central"
                fontSize="12" fill="#D4AF37" fontWeight="600"
                style={{ fontFamily: "'Inter',sans-serif", letterSpacing: "0.06em" }}>ASC</text>
            </g>
          );
        })()}

        {/* ── DSC ── */}
        {(() => {
          const a   = lonToAngle((asc + 180) % 360, asc);
          const p1  = polarToXY(a, R_OUTER + 2);
          const p2  = polarToXY(a, R_INNER);
          const lbl = polarToXY(a, R_OUTER + 24);
          return (
            <g>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="rgba(212,175,55,0.30)" strokeWidth={0.9} strokeDasharray="5 4" />
              <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="central"
                fontSize="11" fill="rgba(212,175,55,0.35)"
                style={{ fontFamily: "'Inter',sans-serif" }}>DSC</text>
            </g>
          );
        })()}

        {/* ── MC axis ── */}
        {(() => {
          const a   = lonToAngle(mc, asc);
          const p1  = polarToXY(a, R_OUTER + 2);
          const p2  = polarToXY(a, R_INNER);
          const lbl = polarToXY(a, R_OUTER + 24);
          return (
            <g filter="url(#axis-glow)">
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#f59e0b" strokeWidth={2.0} />
              <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="central"
                fontSize="12" fill="#f59e0b" fontWeight="600"
                style={{ fontFamily: "'Inter',sans-serif", letterSpacing: "0.06em" }}>MC</text>
            </g>
          );
        })()}

        {/* ── IC ── */}
        {(() => {
          const a   = lonToAngle((mc + 180) % 360, asc);
          const p1  = polarToXY(a, R_OUTER + 2);
          const p2  = polarToXY(a, R_INNER);
          const lbl = polarToXY(a, R_OUTER + 24);
          return (
            <g>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="rgba(245,158,11,0.28)" strokeWidth={0.9} strokeDasharray="5 4" />
              <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="central"
                fontSize="11" fill="rgba(245,158,11,0.35)"
                style={{ fontFamily: "'Inter',sans-serif" }}>IC</text>
            </g>
          );
        })()}

        {/* ── Centre ── */}
        <circle cx={CX} cy={CY} r={3.5} fill="#D4AF37" fillOpacity={0.80} />
        <circle cx={CX} cy={CY} r={8}   fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth={0.7} />
      </svg>

      {/* ── Aspect legend ── */}
      <div className="flex items-center justify-center gap-5 mt-2 mb-1">
        {/* Harmonious */}
        <div className="flex items-center gap-1.5">
          <svg width="28" height="10">
            <line x1="2" y1="5" x2="26" y2="5" stroke="#28c897" strokeWidth="1.5" />
          </svg>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>harmonijne</span>
        </div>
        {/* Tense */}
        <div className="flex items-center gap-1.5">
          <svg width="28" height="10">
            <line x1="2" y1="5" x2="26" y2="5" stroke="#e05c5c" strokeWidth="1.5" strokeDasharray="5 3" />
          </svg>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>napięte</span>
        </div>
      </div>

      {/* ── Selected planet panel ── */}
      {activePlanetObj && (
        <div
          className="mt-3 rounded-xl px-4 py-4 space-y-3"
          style={{
            background: "rgba(5,4,14,0.70)",
            border: "0.5px solid rgba(212,175,55,0.20)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Planet header */}
          <div className="flex items-center gap-3">
            <span className="text-xl" style={{
              color: PLANET_COLORS[activePlanetObj.name] ?? "#a78bfa",
              fontFamily: "serif",
            }}>
              {activePlanetObj.symbol}
            </span>
            <div>
              <p className="text-white text-sm font-medium">
                {activePlanetObj.name}
                {activePlanetObj.isRetrograde && <span className="ml-1 text-xs opacity-60">↺</span>}
                &nbsp;
                <span style={{ color: "rgba(212,175,55,0.70)" }}>
                  w {SIGN_LOCATIVE[activePlanetObj.sign] ?? activePlanetObj.sign}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {planetSignDesc(activePlanetObj.name, activePlanetObj.sign)}
              </p>
            </div>
          </div>

          {/* Aspects of this planet */}
          {activeAspects.length > 0 ? (
            <div className="space-y-1.5 pt-1 border-t border-white/5">
              {activeAspects.map(asp => {
                const partner = asp.p1.name === activePlanet ? asp.p2 : asp.p1;
                const def = ASPECT_DEFS.find(d => d.name === asp.type)!;
                return (
                  <div key={`${asp.p1.name}-${asp.p2.name}`}
                    className="flex items-center gap-2 text-[11px]">
                    {/* Aspect swatch */}
                    <svg width="20" height="10" className="shrink-0">
                      <line x1="2" y1="5" x2="18" y2="5"
                        stroke={def.color} strokeWidth="1.5"
                        strokeDasharray={def.dash} />
                    </svg>
                    <span className="text-slate-500 shrink-0">{ASPECT_LABEL[asp.type]}</span>
                    <span style={{ color: PLANET_COLORS[partner.name] ?? "#a78bfa" }} className="shrink-0">
                      {partner.symbol} {partner.name}
                    </span>
                    <span className="text-slate-600 text-[10px] ml-auto shrink-0">
                      orb {asp.orb.toFixed(1)}°
                    </span>
                  </div>
                );
              })}
              {/* One-line meaning of most important aspect */}
              <p className="text-[10px] text-slate-600 italic pt-1">
                {aspectOneLineSentence(activeAspects[0])}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-600 pt-1 border-t border-white/5">
              Brak głównych aspektów z tej planety.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
