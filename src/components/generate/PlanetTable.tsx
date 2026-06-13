"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { NatalChart } from "@/lib/astro-types";
import { ZodiacGlyph, signIndexFromLon } from "@/components/astro/zodiacGlyphs";

const FE0E = "︎";
const SIGN_NAMES = ["Baran", "Byk", "Bliźnięta", "Rak", "Lew", "Panna", "Waga", "Skorpion", "Strzelec", "Koziorożec", "Wodnik", "Ryby"];

interface Props { chart: NatalChart }

function houseOf(lon: number, houses: NatalChart["houses"]): number {
  for (let i = 0; i < 12; i++) {
    const cur = houses[i].longitude;
    const next = houses[(i + 1) % 12].longitude;
    const inside = cur <= next ? lon >= cur && lon < next : lon >= cur || lon < next;
    if (inside) return houses[i].house;
  }
  return 1;
}

function SignCell({ sign }: { sign: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <ZodiacGlyph sign={sign} size={15} style={{ color: "var(--accent-deep)" }} />
      <span style={{ color: "var(--text-secondary)" }}>{sign}</span>
    </span>
  );
}

export default function PlanetTable({ chart }: Props) {
  const [open, setOpen] = useState(false);
  const { planets, houses, ascendant, mc } = chart;
  const hasHouses = Array.isArray(houses) && houses.length === 12 && !chart.birthData.timeUnknown;

  const ascSign = SIGN_NAMES[signIndexFromLon(ascendant)];
  const mcSign = SIGN_NAMES[signIndexFromLon(mc)];
  const ascDeg = Math.floor(((ascendant % 30) + 30) % 30);
  const mcDeg = Math.floor(((mc % 30) + 30) % 30);

  const cellMuted = { color: "var(--text-muted)" };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--line)" }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ borderBottom: open ? "1px solid var(--line)" : "none" }}>
        <h3 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
          Pozycje planet
        </h3>
        <ChevronDown className="w-4 h-4 transition-transform duration-300"
          style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--line)" }}>
                <th className="text-left px-4 py-2.5">Planeta</th>
                <th className="text-left px-4 py-2.5">Znak</th>
                <th className="text-left px-4 py-2.5">Stopień</th>
                <th className="text-left px-4 py-2.5">Dom</th>
              </tr>
            </thead>
            <tbody>
              {hasHouses && (
                <>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: "var(--accent-deep)" }}>Ascendent</td>
                    <td className="px-4 py-2.5"><SignCell sign={ascSign} /></td>
                    <td className="px-4 py-2.5" style={cellMuted}>{ascDeg}°</td>
                    <td className="px-4 py-2.5" style={cellMuted}>—</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: "var(--accent-deep)" }}>MC</td>
                    <td className="px-4 py-2.5"><SignCell sign={mcSign} /></td>
                    <td className="px-4 py-2.5" style={cellMuted}>{mcDeg}°</td>
                    <td className="px-4 py-2.5" style={cellMuted}>—</td>
                  </tr>
                </>
              )}
              {planets.map((p) => (
                <tr key={p.name} className="last:border-0" style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>
                    <span className="mr-2 text-base" style={{ color: "var(--voice)" }}>{p.symbol + FE0E}</span>
                    {p.name}
                    {p.isRetrograde && <span className="ml-1 text-xs" style={cellMuted}>℞</span>}
                  </td>
                  <td className="px-4 py-2.5"><SignCell sign={p.sign} /></td>
                  <td className="px-4 py-2.5" style={cellMuted}>
                    {p.degree}°{p.minute.toString().padStart(2, "0")}′
                  </td>
                  <td className="px-4 py-2.5">
                    {hasHouses ? (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(224,181,102,0.07)", border: "1px solid var(--line)", color: "var(--text-muted)" }}>
                        Dom {houseOf(p.longitude, houses)}
                      </span>
                    ) : <span style={cellMuted}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
