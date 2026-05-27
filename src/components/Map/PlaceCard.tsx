"use client";

import { useState, useEffect } from "react";
import type { CuratedCity } from "@/lib/curatedCities";
import type { ActiveLine } from "@/lib/astrocartography";
import { PLANET_LINE_COLORS, PLANET_GLYPHS } from "@/lib/mapColors";
import { PLANET_PL } from "@/lib/astrocartography";

const LINE_PL: Record<string, string> = { MC: "MC", IC: "IC", ASC: "AC", DSC: "DC" };

const FLAG: Record<string, string> = {
  GR: "🇬🇷", ID: "🇮🇩", IT: "🇮🇹", PT: "🇵🇹", MU: "🇲🇺", CR: "🇨🇷", MX: "🇲🇽",
  MA: "🇲🇦", PL: "🇵🇱", FR: "🇫🇷", CZ: "🇨🇿", US: "🇺🇸", AR: "🇦🇷", ES: "🇪🇸",
  AT: "🇦🇹", GB: "🇬🇧", SG: "🇸🇬", JP: "🇯🇵", AE: "🇦🇪", DE: "🇩🇪", HK: "🇭🇰",
  CH: "🇨🇭", IN: "🇮🇳", IL: "🇮🇱", PE: "🇵🇪", BT: "🇧🇹", ZA: "🇿🇦", LB: "🇱🇧",
  BA: "🇧🇦", UA: "🇺🇦", GE: "🇬🇪", IS: "🇮🇸",
};

function useWikipediaPhoto(slug: string, nameEn: string, fallbackUrl: string): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const key = `wp_${slug}`;
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) { setUrl(cached); return; }
    } catch {}

    setUrl(null);
    const controller = new AbortController();
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nameEn)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        const photo = (data.originalimage?.source ?? data.thumbnail?.source) as string | undefined;
        const resolved = photo && !photo.includes("Flag_of_") ? photo : (fallbackUrl || null);
        if (resolved) {
          try { sessionStorage.setItem(key, resolved); } catch {}
          setUrl(resolved);
        }
      })
      .catch(() => { if (fallbackUrl) setUrl(fallbackUrl); });
    return () => controller.abort();
  }, [slug, nameEn, fallbackUrl]);

  return url;
}

interface Props {
  city: CuratedCity;
  strongestLine: ActiveLine | null;
  teaser?: string;
  onClick: () => void;
}

export default function PlaceCard({ city, strongestLine, teaser, onClick }: Props) {
  const photoUrl = useWikipediaPhoto(city.slug, city.name_en, city.photo_url);
  const [imgError, setImgError] = useState(false);

  const lineColor = strongestLine ? PLANET_LINE_COLORS[strongestLine.planet] : "#888";
  const lineLabel = strongestLine
    ? `${PLANET_GLYPHS[strongestLine.planet]} ${PLANET_PL[strongestLine.planet]} ${LINE_PL[strongestLine.type]}`
    : null;

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl overflow-hidden border border-slate-700/30 bg-slate-800/30 hover:border-amber-700/40 hover:bg-slate-800/50 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      {/* Photo */}
      <div className="relative aspect-[3/2] overflow-hidden bg-slate-800">
        {photoUrl && !imgError ? (
          <img
            src={photoUrl}
            alt={city.name_pl}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-indigo-950 flex items-center justify-center">
            <span className="text-4xl font-bold text-slate-600 select-none">{city.name_pl[0]}</span>
          </div>
        )}
        {strongestLine && (
          <div
            className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-sm bg-black/50"
            style={{ color: lineColor, borderColor: lineColor, borderWidth: 1 }}
          >
            {lineLabel}
            <span className="text-slate-400 font-normal">{strongestLine.distance_km} km</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-base">{FLAG[city.country_code] ?? "🌍"}</span>
          <span className="font-semibold text-white text-sm">{city.name_pl}</span>
        </div>
        <div className="text-xs text-slate-500 mb-2">{city.country_pl}</div>
        {teaser && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-1">{teaser}</p>
        )}
      </div>
    </button>
  );
}
