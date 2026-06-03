"use client";

import { NatalChart, PLANET_COLORS, ZODIAC_SIGNS } from "@/lib/astro-types";

const CX = 300;
const CY = 300;

const R_OUTER      = 278;
const R_ZODIAC     = 242;
const R_HOUSE_OUT  = 218;
const R_HOUSE_IN   = 188;
const R_PLANET     = 158;
const R_INNER      = 118;

/** Ecliptic longitude → SVG angle. ASC sits at 9 o'clock (π). */
function lonToAngle(lon: number, asc: number): number {
  return Math.PI - ((lon - asc + 360) % 360) * (Math.PI / 180);
}

function polarToXY(angle: number, r: number, cx = CX, cy = CY) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

interface Props { chart: NatalChart }

export default function NatalChartSVG({ chart }: Props) {
  const { planets, houses, ascendant: asc, mc } = chart;

  // Collision-aware planet radii
  const positioned = (() => {
    const items = planets.map(p => ({ planet: p, angle: lonToAngle(p.longitude, asc), r: R_PLANET }));
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        let diff = items[j].angle - items[i].angle;
        while (diff > Math.PI)  diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        if (Math.abs(diff) < 0.24) items[j].r = R_PLANET - 34;
      }
    }
    return items;
  })();

  return (
    <svg
      viewBox="0 0 600 600"
      className="w-full max-w-[560px]"
      aria-label="Kosmogram natalny"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Soft glow for axes */}
        <filter id="axis-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Planet glow */}
        <filter id="planet-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Very dark radial bg for inner disc only */}
        <radialGradient id="inner-disc" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0d0b16" />
          <stop offset="100%" stopColor="#050508" />
        </radialGradient>
      </defs>

      {/* ── Zodiac ring segments — uniform gold, minimal fill ── */}
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
            <path d={pathD}
              fill="rgba(212,175,55,0.038)"
              stroke="rgba(212,175,55,0.22)"
              strokeWidth={0.5} />
            <text
              x={sym.x} y={sym.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="16" fill="rgba(212,175,55,0.80)"
              style={{ fontFamily: "serif" }}
            >
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
          <line key={i}
            x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
            stroke="rgba(212,175,55,0.18)"
            strokeWidth={i % 3 === 0 ? 0.9 : 0.4} />
        );
      })}

      {/* ── Ring borders — progressive gold opacity ── */}
      <circle cx={CX} cy={CY} r={R_OUTER}     fill="none" stroke="rgba(212,175,55,0.58)" strokeWidth={1.5} />
      <circle cx={CX} cy={CY} r={R_ZODIAC}    fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth={0.8} />
      <circle cx={CX} cy={CY} r={R_HOUSE_OUT} fill="none" stroke="rgba(212,175,55,0.14)" strokeWidth={0.5} />
      <circle cx={CX} cy={CY} r={R_HOUSE_IN}  fill="none" stroke="rgba(212,175,55,0.10)" strokeWidth={0.4} />

      {/* ── House cusps ── */}
      {houses.map((h) => {
        const angle    = lonToAngle(h.longitude, asc);
        const outer    = polarToXY(angle, R_ZODIAC - 2);
        const inner    = polarToXY(angle, R_INNER + 2);
        const isAngular = [1, 4, 7, 10].includes(h.house);
        const nextLon  = houses[(h.house % 12)].longitude;
        const mid      = (h.longitude + ((nextLon - h.longitude + 360) % 360) / 2) % 360;
        const numPos   = polarToXY(lonToAngle(mid, asc), (R_HOUSE_IN + R_INNER) / 2);
        return (
          <g key={h.house}>
            <line
              x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
              stroke={isAngular ? "rgba(212,175,55,0.38)" : "rgba(255,255,255,0.09)"}
              strokeWidth={isAngular ? 1.2 : 0.5}
              strokeDasharray={isAngular ? undefined : "3 5"} />
            <text
              x={numPos.x} y={numPos.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="11"
              fill={isAngular ? "rgba(212,175,55,0.60)" : "rgba(255,255,255,0.22)"}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {h.house}
            </text>
          </g>
        );
      })}

      {/* ── Inner disc — dark transparent ── */}
      <circle cx={CX} cy={CY} r={R_INNER}
        fill="url(#inner-disc)"
        stroke="rgba(212,175,55,0.16)" strokeWidth={0.8} />

      {/* ── Aspect lines — subtle, muted ── */}
      {planets.flatMap((p1, i) =>
        planets.slice(i + 1).map((p2) => {
          let diff = Math.abs(p1.longitude - p2.longitude);
          if (diff > 180) diff = 360 - diff;
          let stroke = "";
          let dash: string | undefined;
          if (diff < 8)                     { stroke = "rgba(212,175,55,0.22)"; }
          else if (Math.abs(diff - 180) < 8) { stroke = "rgba(220,80,80,0.20)";  dash = "6 4"; }
          else if (Math.abs(diff - 120) < 7) { stroke = "rgba(40,190,140,0.20)"; }
          else if (Math.abs(diff - 90)  < 6) { stroke = "rgba(220,130,50,0.18)"; dash = "4 4"; }
          else if (Math.abs(diff - 60)  < 5) { stroke = "rgba(80,150,220,0.16)"; }
          if (!stroke) return null;
          const q1 = polarToXY(lonToAngle(p1.longitude, asc), R_INNER - 4);
          const q2 = polarToXY(lonToAngle(p2.longitude, asc), R_INNER - 4);
          return (
            <line key={`${p1.name}-${p2.name}`}
              x1={q1.x} y1={q1.y} x2={q2.x} y2={q2.y}
              stroke={stroke} strokeWidth={1.0} strokeDasharray={dash} />
          );
        })
      )}

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

      {/* ── Planets — dark fill, thin colored border ── */}
      {positioned.map(({ planet, angle, r }) => {
        const pos   = polarToXY(angle, r);
        const color = PLANET_COLORS[planet.name] ?? "#a78bfa";
        const tick1 = polarToXY(angle, R_HOUSE_IN - 2);
        const tick2 = polarToXY(angle, r + 17);
        return (
          <g key={planet.name} filter="url(#planet-glow)">
            {/* Connector tick */}
            <line
              x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y}
              stroke={color} strokeOpacity={0.20} strokeWidth={0.7} />
            {/* Planet circle */}
            <circle cx={pos.x} cy={pos.y} r={15}
              fill="rgba(5,4,14,0.90)"
              stroke={color} strokeWidth={1.5} strokeOpacity={0.88} />
            {/* Symbol */}
            <text
              x={pos.x} y={pos.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="14" fill={color} fontWeight="500"
              style={{ fontFamily: "serif" }}
            >
              {planet.symbol}
            </text>
            {planet.isRetrograde && (
              <text x={pos.x + 13} y={pos.y - 10} fontSize="9" fill={color} fillOpacity={0.70}>↺</text>
            )}
          </g>
        );
      })}

      {/* ── ASC axis — gold with glow ── */}
      {(() => {
        const a   = lonToAngle(asc, asc);
        const p1  = polarToXY(a, R_OUTER + 2);
        const p2  = polarToXY(a, R_INNER);
        const lbl = polarToXY(a, R_OUTER + 24);
        return (
          <g filter="url(#axis-glow)">
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#D4AF37" strokeWidth={2.0} />
            <text x={lbl.x} y={lbl.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="12" fill="#D4AF37" fontWeight="600"
              style={{ fontFamily: "'Inter',sans-serif", letterSpacing: "0.06em" }}>
              ASC
            </text>
          </g>
        );
      })()}

      {/* ── DSC — faint dashed ── */}
      {(() => {
        const a   = lonToAngle((asc + 180) % 360, asc);
        const p1  = polarToXY(a, R_OUTER + 2);
        const p2  = polarToXY(a, R_INNER);
        const lbl = polarToXY(a, R_OUTER + 24);
        return (
          <g>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="rgba(212,175,55,0.30)" strokeWidth={0.9} strokeDasharray="5 4" />
            <text x={lbl.x} y={lbl.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="11" fill="rgba(212,175,55,0.35)"
              style={{ fontFamily: "'Inter',sans-serif" }}>
              DSC
            </text>
          </g>
        );
      })()}

      {/* ── MC axis — amber with glow ── */}
      {(() => {
        const a   = lonToAngle(mc, asc);
        const p1  = polarToXY(a, R_OUTER + 2);
        const p2  = polarToXY(a, R_INNER);
        const lbl = polarToXY(a, R_OUTER + 24);
        return (
          <g filter="url(#axis-glow)">
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#f59e0b" strokeWidth={2.0} />
            <text x={lbl.x} y={lbl.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="12" fill="#f59e0b" fontWeight="600"
              style={{ fontFamily: "'Inter',sans-serif", letterSpacing: "0.06em" }}>
              MC
            </text>
          </g>
        );
      })()}

      {/* ── IC — faint dashed ── */}
      {(() => {
        const a   = lonToAngle((mc + 180) % 360, asc);
        const p1  = polarToXY(a, R_OUTER + 2);
        const p2  = polarToXY(a, R_INNER);
        const lbl = polarToXY(a, R_OUTER + 24);
        return (
          <g>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="rgba(245,158,11,0.28)" strokeWidth={0.9} strokeDasharray="5 4" />
            <text x={lbl.x} y={lbl.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="11" fill="rgba(245,158,11,0.35)"
              style={{ fontFamily: "'Inter',sans-serif" }}>
              IC
            </text>
          </g>
        );
      })()}

      {/* ── Centre dot ── */}
      <circle cx={CX} cy={CY} r={4}  fill="#D4AF37" fillOpacity={0.80} />
      <circle cx={CX} cy={CY} r={9}  fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth={0.7} />
    </svg>
  );
}
