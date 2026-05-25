"use client";

import { MapPin } from "lucide-react";
import type { ActiveLine } from "@/lib/astrocartography";
import { PLANET_EMOJI, PLANET_PL, PLANET_COLORS } from "@/lib/astrocartography";
import { getLineDescription } from "@/lib/lineDescriptions";

interface Props {
  hometownName: string;
  activeLines: ActiveLine[];
}

export default function HometownAnchor({ hometownName, activeLines }: Props) {
  const top3 = activeLines.slice(0, 3);

  return (
    <div className="mx-4 mt-3 mb-1 rounded-xl border border-amber-900/20 bg-amber-950/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-3.5 h-3.5 text-amber-500/70 shrink-0" />
        <span className="text-xs text-slate-500">
          Twoje miasto:{" "}
          <span className="text-slate-300 font-medium">{hometownName}</span>
        </span>
      </div>

      {top3.length === 0 ? (
        <p className="text-xs text-slate-500 leading-relaxed">
          W promieniu 700 km nie ma silnych linii — neutralny grunt, idealny do bycia po prostu sobą.
        </p>
      ) : (
        <>
          <p className="text-xs text-slate-500 mb-2.5">Tu w tobie pracuje:</p>
          <div className="space-y-2">
            {top3.map((line) => (
              <div key={`${line.planet}-${line.type}`} className="flex items-start gap-2.5">
                <span
                  className="text-base leading-none mt-0.5 shrink-0"
                  style={{ color: PLANET_COLORS[line.planet] }}
                >
                  {PLANET_EMOJI[line.planet]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white font-medium">
                    {PLANET_PL[line.planet]} {line.type}
                    <span className="text-slate-600 font-normal ml-2">{line.distance_km} km</span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {getLineDescription(line.planet, line.type).short}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 italic mt-3">
            Sprawdź gdzie inaczej działają twoje planety →
          </p>
        </>
      )}
    </div>
  );
}
