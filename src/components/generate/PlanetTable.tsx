"use client";

import { NatalChart, PLANET_COLORS } from "@/lib/astro-types";

interface Props {
  chart: NatalChart;
}

function houseOf(lon: number, houses: NatalChart["houses"]): number {
  for (let i = 0; i < 12; i++) {
    const cur  = houses[i].longitude;
    const next = houses[(i + 1) % 12].longitude;
    const inside = cur <= next
      ? lon >= cur && lon < next
      : lon >= cur || lon < next;
    if (inside) return houses[i].house;
  }
  return 1;
}

export default function PlanetTable({ chart }: Props) {
  const { planets, houses, ascendant, mc } = chart;
  const ascSign = Math.floor(ascendant / 30);
  const mcSign  = Math.floor(mc / 30);
  // U+FE0E (VS15) forces text (not emoji) rendering so CSS color applies
  const vs = "︎";
  const SIGNS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map(s => s + vs);
  const SIGN_NAMES = ["Baran","Byk","Bliźnięta","Rak","Lew","Panna","Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby"];

  const ascDeg = Math.floor(((ascendant % 30) + 30) % 30);
  const mcDeg  = Math.floor(((mc % 30) + 30) % 30);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-900/25">
        <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Pozycje Planet</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-amber-900/15">
              <th className="text-left px-4 py-2.5">Planeta</th>
              <th className="text-left px-4 py-2.5">Znak</th>
              <th className="text-left px-4 py-2.5">Stopień</th>
              <th className="text-left px-4 py-2.5">Dom</th>
            </tr>
          </thead>
          <tbody>
            {/* ASC row */}
            <tr className="border-b border-amber-900/10 hover:bg-amber-900/10 transition-colors">
              <td className="px-4 py-2.5 font-medium text-slate-300">
                <span className="mr-2 text-base">⬆</span>Ascendent
              </td>
              <td className="px-4 py-2.5 text-slate-300">
                <span className="text-amber-400/90">{SIGNS[ascSign]}</span> {SIGN_NAMES[ascSign]}
              </td>
              <td className="px-4 py-2.5 text-slate-400">{ascDeg}°</td>
              <td className="px-4 py-2.5 text-slate-500">—</td>
            </tr>
            {/* MC row */}
            <tr className="border-b border-amber-900/10 hover:bg-amber-900/10 transition-colors">
              <td className="px-4 py-2.5 font-medium text-amber-300">
                <span className="mr-2 text-base">⬆</span>MC
              </td>
              <td className="px-4 py-2.5 text-slate-300">
                <span className="text-amber-400/90">{SIGNS[mcSign]}</span> {SIGN_NAMES[mcSign]}
              </td>
              <td className="px-4 py-2.5 text-slate-400">{mcDeg}°</td>
              <td className="px-4 py-2.5 text-slate-500">—</td>
            </tr>
            {planets.map((p) => {
              const color = PLANET_COLORS[p.name] ?? "#a78bfa";
              const house = houseOf(p.longitude, houses);
              return (
                <tr key={p.name} className="border-b border-amber-900/10 hover:bg-amber-900/10 transition-colors last:border-0">
                  <td className="px-4 py-2.5 font-medium" style={{ color }}>
                    <span className="mr-2 text-base">{p.symbol}</span>{p.name}
                    {p.isRetrograde && <span className="ml-1 text-xs opacity-60">↺</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">
                    <span className="text-amber-400/90">{p.signSymbol + vs}</span> {p.sign}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">
                    {p.degree}°{p.minute.toString().padStart(2, "0")}′
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/20 border border-amber-800/25 text-slate-400">
                      Dom {house}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
