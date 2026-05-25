"use client";

import { Loader2, X, Share2, MapPin } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ActiveLine } from "@/lib/astrocartography";
import { PLANET_PL, PLANET_EMOJI, PLANET_COLORS, LINE_PL_SHORT } from "@/lib/astrocartography";
import type { City } from "@/lib/cityDatabase";
import { track } from "@/components/PostHogProvider";

interface Props {
  city: City;
  activeLines: ActiveLine[];
  interpretation: string;
  loading: boolean;
  onClose: () => void;
  onShare?: () => void;
}

export default function CityDetails({ city, activeLines, interpretation, loading, onClose, onShare }: Props) {
  const handleShare = () => {
    track("cosmo_map_shared", { card_type: "top_5", city_slug: city.slug });
    onShare?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
            <MapPin className="w-3 h-3" />
            {city.country_pl}
          </div>
          <h2 className="text-xl font-semibold text-white font-brand">{city.name_pl}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-amber-900/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active lines chips */}
      {activeLines.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {activeLines.slice(0, 6).map((line, i) => (
            <span
              key={i}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
              style={{
                color: PLANET_COLORS[line.planet],
                borderColor: PLANET_COLORS[line.planet] + "40",
                background: PLANET_COLORS[line.planet] + "15",
              }}
            >
              {PLANET_EMOJI[line.planet]} {PLANET_PL[line.planet]} {LINE_PL_SHORT[line.type]}
              <span className="text-slate-500 font-normal">{line.distance_km}km</span>
            </span>
          ))}
          {activeLines.length === 0 && (
            <span className="text-xs text-slate-500 italic">Brak aktywnych linii w orbicie 700 km</span>
          )}
        </div>
      )}

      {/* Interpretation */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            Interpretuję energię tego miejsca…
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
            <ReactMarkdown>{interpretation}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-amber-900/20">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-300 bg-amber-900/15 border border-amber-800/30 hover:bg-amber-900/25 hover:text-amber-100 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          Udostępnij
        </button>
      </div>
    </div>
  );
}
