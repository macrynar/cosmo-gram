"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const { planets, houses, ascendant, mc } = chart;
  const ascSign = Math.floor(ascendant / 30);
  const mcSign  = Math.floor(mc / 30);
  const vs = "︎";
  const SIGNS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map(s => s + vs);
  const SIGN_NAMES = ["Baran","Byk","Bliźnięta","Rak","Lew","Panna","Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby"];

  const ascDeg = Math.floor(((ascendant % 30) + 30) % 30);
  const mcDeg  = Math.floor(((mc % 30) + 30) % 30);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(5,4,14,0.65)",
        border: "0.5px solid rgba(212,175,55,0.18)",
        backdropFilter: "blur(18px)",
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ borderBottom: open ? "0.5px solid rgba(212,175,55,0.14)" : "none" }}
      >
        <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Pozycje Planet</h3>
        <ChevronDown
          className="w-4 h-4 text-slate-500 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-xs text-slate-600 uppercase tracking-wider"
              style={{ borderBottom: "0.5px solid rgba(212,175,55,0.10)" }}
            >
              <th className="text-left px-4 py-2.5">Planeta</th>
              <th className="text-left px-4 py-2.5">Znak</th>
              <th className="text-left px-4 py-2.5">Stopień</th>
              <th className="text-left px-4 py-2.5">Dom</th>
            </tr>
          </thead>
          <tbody>
            {/* ASC row */}
            <tr
              className="transition-colors duration-200"
              style={{ borderBottom: "0.5px solid rgba(212,175,55,0.08)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.05)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <td className="px-4 py-2.5 font-medium text-slate-300">
                <span className="mr-2 text-base">⬆</span>Ascendent
              </td>
              <td className="px-4 py-2.5 text-slate-300">
                <span style={{ color: "#D4AF37" }}>{SIGNS[ascSign]}</span> {SIGN_NAMES[ascSign]}
              </td>
              <td className="px-4 py-2.5 text-slate-400">{ascDeg}°</td>
              <td className="px-4 py-2.5 text-slate-600">—</td>
            </tr>
            {/* MC row */}
            <tr
              className="transition-colors duration-200"
              style={{ borderBottom: "0.5px solid rgba(212,175,55,0.08)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.05)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <td className="px-4 py-2.5 font-medium" style={{ color: "#F3E5AB" }}>
                <span className="mr-2 text-base">⬆</span>MC
              </td>
              <td className="px-4 py-2.5 text-slate-300">
                <span style={{ color: "#D4AF37" }}>{SIGNS[mcSign]}</span> {SIGN_NAMES[mcSign]}
              </td>
              <td className="px-4 py-2.5 text-slate-400">{mcDeg}°</td>
              <td className="px-4 py-2.5 text-slate-600">—</td>
            </tr>
            {planets.map((p) => {
              const color = PLANET_COLORS[p.name] ?? "#a78bfa";
              const house = houseOf(p.longitude, houses);
              return (
                <tr
                  key={p.name}
                  className="transition-colors duration-200 last:border-0"
                  style={{ borderBottom: "0.5px solid rgba(212,175,55,0.08)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <td className="px-4 py-2.5 font-medium" style={{ color }}>
                    <span className="mr-2 text-base">{p.symbol}</span>{p.name}
                    {p.isRetrograde && <span className="ml-1 text-xs opacity-60">↺</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">
                    <span style={{ color: "#D4AF37" }}>{p.signSymbol + vs}</span> {p.sign}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">
                    {p.degree}°{p.minute.toString().padStart(2, "0")}′
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-slate-400"
                      style={{
                        background: "rgba(212,175,55,0.08)",
                        border: "0.5px solid rgba(212,175,55,0.18)",
                      }}
                    >
                      Dom {house}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}
    </div>
  );
}
