"use client";

import { NatalChart, PLANET_COLORS, ZODIAC_SIGNS } from "@/lib/astro-types";

const CX = 300;
const CY = 300;

// Radii — 600×600 viewBox
const R_OUTER      = 278;
const R_ZODIAC     = 242;
const R_HOUSE_OUT  = 218;
const R_HOUSE_IN   = 188;
const R_PLANET     = 158;
const R_INNER      = 118;

const ZODIAC_ELEMENTS: Record<string, string> = {
  "♈": "#ef4444", "♌": "#ef4444", "♐": "#ef4444",
  "♉": "#84cc16", "♍": "#84cc16", "♑": "#84cc16",
  "♊": "#38bdf8", "♎": "#38bdf8", "♒": "#38bdf8",
  "♋": "#a78bfa", "♏": "#a78bfa", "♓": "#a78bfa",
};
const ZODIAC_STROKE: Record<string, string> = {
  "♈": "#f87171", "♌": "#f87171", "♐": "#f87171",
  "♉": "#a3e635", "♍": "#a3e635", "♑": "#a3e635",
  "♊": "#7dd3fc", "♎": "#7dd3fc", "♒": "#7dd3fc",
  "♋": "#c4b5fd", "♏": "#c4b5fd", "♓": "#c4b5fd",
};

/** Convert ecliptic longitude to SVG angle. ASC = 9 o'clock (π). */
function lonToAngle(lon: number, asc: number): number {
  const offset = ((lon - asc + 360) % 360);
  return Math.PI - offset * (Math.PI / 180);
}

function polarToXY(angle: number, r: number, cx = CX, cy = CY) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

interface Props { chart: NatalChart }

export default function NatalChartSVG({ chart }: Props) {
  const { planets, houses, ascendant: asc, mc } = chart;

  function getPositions() {
    const items = planets.map((p) => ({ planet: p, angle: lonToAngle(p.longitude, asc), r: R_PLANET }));
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        let diff = items[j].angle - items[i].angle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        if (Math.abs(diff) < 0.24) items[j].r = R_PLANET - 34;
      }
    }
    return items;
  }
  const positioned = getPositions();

  return (
    <svg viewBox="0 0 600 600" className="w-full max-w-[560px] drop-shadow-2xl" aria-label="Kosmogram natalny">
      <defs>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0c0a08" />
          <stop offset="100%" stopColor="#03010d" />
        </radialGradient>
        <radialGradient id="inner-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#100d09" />
          <stop offset="100%" stopColor="#060407" />
        </radialGradient>
      </defs>

      {/* Background */}
      <circle cx={CX} cy={CY} r={R_OUTER + 8} fill="url(#bg-grad)" />

      {/* Zodiac segments */}
      {ZODIAC_SIGNS.map((sign) => {
        const fill   = ZODIAC_ELEMENTS[sign.symbol] ?? "#b9894c";
        const stroke = ZODIAC_STROKE[sign.symbol]   ?? "#a78bfa";
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
            <path d={pathD} fill={fill} fillOpacity={0.14} stroke={stroke} strokeOpacity={0.45} strokeWidth={0.6} />
            <text x={sym.x} y={sym.y} textAnchor="middle" dominantBaseline="central"
              fontSize="17" fill={stroke} fillOpacity={0.95} style={{ fontFamily: "serif" }}>
              {sign.symbol}
            </text>
          </g>
        );
      })}

      {/* Degree ticks every 10° */}
      {Array.from({ length: 36 }, (_, i) => {
        const a = lonToAngle(i * 10, asc);
        const outer = polarToXY(a, R_OUTER);
        const inner = polarToXY(a, R_OUTER - (i % 3 === 0 ? 12 : 6));
        return <line key={i} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
          stroke="rgba(185,137,76,0.30)" strokeWidth={i % 3 === 0 ? 1.2 : 0.5} />;
      })}

      {/* Ring borders */}
      <circle cx={CX} cy={CY} r={R_OUTER}     fill="none" stroke="#b9894c" strokeWidth={1.8} />
      <circle cx={CX} cy={CY} r={R_ZODIAC}    fill="none" stroke="#7a5530" strokeWidth={1.2} />
      <circle cx={CX} cy={CY} r={R_HOUSE_OUT} fill="none" stroke="#3d2510" strokeWidth={0.8} />
      <circle cx={CX} cy={CY} r={R_HOUSE_IN}  fill="none" stroke="#1e1008" strokeWidth={0.6} />

      {/* House cusps */}
      {houses.map((h) => {
        const angle = lonToAngle(h.longitude, asc);
        const outer = polarToXY(angle, R_ZODIAC - 2);
        const inner = polarToXY(angle, R_INNER + 2);
        const isAngular = [1, 4, 7, 10].includes(h.house);
        const nextLon = houses[(h.house % 12)].longitude;
        const mid = (h.longitude + ((nextLon - h.longitude + 360) % 360) / 2) % 360;
        const numPos = polarToXY(lonToAngle(mid, asc), (R_HOUSE_IN + R_INNER) / 2);
        return (
          <g key={h.house}>
            <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
              stroke={isAngular ? "#d6b07d" : "#2a1508"}
              strokeWidth={isAngular ? 1.8 : 0.7}
              strokeDasharray={isAngular ? undefined : "3 3"} />
            <text x={numPos.x} y={numPos.y} textAnchor="middle" dominantBaseline="central"
              fontSize="12" fill={isAngular ? "#d6b07d" : "#475569"}
              fontWeight={isAngular ? "bold" : "normal"}
              style={{ fontFamily: "'Inter', sans-serif" }}>
              {h.house}
            </text>
          </g>
        );
      })}

      {/* Inner disc */}
      <circle cx={CX} cy={CY} r={R_INNER} fill="url(#inner-grad)" stroke="#7a5530" strokeWidth={1.5} />

      {/* Aspect lines */}
      {planets.flatMap((p1, i) =>
        planets.slice(i + 1).map((p2) => {
          let diff = Math.abs(p1.longitude - p2.longitude);
          if (diff > 180) diff = 360 - diff;
          let stroke = ""; let dash: string | undefined;
          if (diff < 8)                    { stroke = "rgba(196,181,253,0.40)"; }
          else if (Math.abs(diff-180) < 8) { stroke = "rgba(248,113,113,0.35)"; dash = "6 3"; }
          else if (Math.abs(diff-120) < 7) { stroke = "rgba(52,211,153,0.32)"; }
          else if (Math.abs(diff-90)  < 6) { stroke = "rgba(251,146,60,0.30)";  dash = "4 4"; }
          else if (Math.abs(diff-60)  < 5) { stroke = "rgba(96,165,250,0.25)"; }
          if (!stroke) return null;
          const q1 = polarToXY(lonToAngle(p1.longitude, asc), R_INNER - 4);
          const q2 = polarToXY(lonToAngle(p2.longitude, asc), R_INNER - 4);
          return (
            <line key={`${p1.name}-${p2.name}`}
              x1={q1.x} y1={q1.y} x2={q2.x} y2={q2.y}
              stroke={stroke} strokeWidth={1.3} strokeDasharray={dash} />
          );
        })
      )}

      {/* Planet position dots on house ring */}
      {planets.map((p) => {
        const pos = polarToXY(lonToAngle(p.longitude, asc), R_HOUSE_OUT - 6);
        const color = PLANET_COLORS[p.name] ?? "#a78bfa";
        return <circle key={`dot-${p.name}`} cx={pos.x} cy={pos.y} r={3} fill={color} fillOpacity={0.8} />;
      })}

      {/* Planets */}
      {positioned.map(({ planet, angle, r }) => {
        const pos   = polarToXY(angle, r);
        const color = PLANET_COLORS[planet.name] ?? "#a78bfa";
        const tick1 = polarToXY(angle, R_HOUSE_IN - 2);
        const tick2 = polarToXY(angle, r + 17);
        return (
          <g key={planet.name}>
            <line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y}
              stroke={color} strokeOpacity={0.25} strokeWidth={0.9} />
            {/* Soft aura */}
            <circle cx={pos.x} cy={pos.y} r={19} fill={color} fillOpacity={0.05} />
            {/* Planet circle */}
            <circle cx={pos.x} cy={pos.y} r={15}
              fill="#0a0705" stroke={color} strokeWidth={2}
              style={{ filter: `drop-shadow(0 0 5px ${color}60)` }} />
            {/* Symbol */}
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
              fontSize="15" fill={color} fontWeight="600"
              style={{ fontFamily: "serif", filter: `drop-shadow(0 0 3px ${color}80)` }}>
              {planet.symbol}
            </text>
            {planet.isRetrograde && (
              <text x={pos.x + 14} y={pos.y - 10} fontSize="9" fill={color} fillOpacity={0.9}>↺</text>
            )}
          </g>
        );
      })}

      {/* ASC axis */}
      {(() => {
        const a = lonToAngle(asc, asc);
        const p1 = polarToXY(a, R_OUTER);
        const p2 = polarToXY(a, R_INNER);
        const lbl = polarToXY(a, R_OUTER + 24);
        return (<g>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#d6b07d" strokeWidth={2.5} />
          <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="central"
            fontSize="13" fill="#e8d7bf" fontWeight="bold" style={{ fontFamily: "'Inter',sans-serif" }}>ASC</text>
        </g>);
      })()}
      {/* DSC */}
      {(() => {
        const a = lonToAngle((asc + 180) % 360, asc);
        const p1 = polarToXY(a, R_OUTER);
        const p2 = polarToXY(a, R_INNER);
        const lbl = polarToXY(a, R_OUTER + 24);
        return (<g>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#7a5530" strokeWidth={1.2} strokeDasharray="5 3" />
          <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="central"
            fontSize="12" fill="#7a5530" fontWeight="bold" style={{ fontFamily: "'Inter',sans-serif" }}>DSC</text>
        </g>);
      })()}
      {/* MC axis */}
      {(() => {
        const a = lonToAngle(mc, asc);
        const p1 = polarToXY(a, R_OUTER);
        const p2 = polarToXY(a, R_INNER);
        const lbl = polarToXY(a, R_OUTER + 24);
        return (<g>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#f59e0b" strokeWidth={2.5} />
          <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="central"
            fontSize="13" fill="#fbbf24" fontWeight="bold" style={{ fontFamily: "'Inter',sans-serif" }}>MC</text>
        </g>);
      })()}
      {/* IC */}
      {(() => {
        const a = lonToAngle((mc + 180) % 360, asc);
        const p1 = polarToXY(a, R_OUTER);
        const p2 = polarToXY(a, R_INNER);
        const lbl = polarToXY(a, R_OUTER + 24);
        return (<g>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#b45309" strokeWidth={1.2} strokeDasharray="5 3" />
          <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="central"
            fontSize="12" fill="#b45309" fontWeight="bold" style={{ fontFamily: "'Inter',sans-serif" }}>IC</text>
        </g>);
      })()}

      {/* Centre */}
      <circle cx={CX} cy={CY} r={5} fill="#d6b07d" />
      <circle cx={CX} cy={CY} r={9} fill="none" stroke="#d6b07d" strokeWidth={1} strokeOpacity={0.35} />
    </svg>
  );
}
