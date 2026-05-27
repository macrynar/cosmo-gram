"use client";

import { useState, useEffect, useRef } from "react";
import { X, MapPin, Loader2, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { CuratedCity } from "@/lib/curatedCities";
import { getCuratedCity } from "@/lib/curatedCities";
import type { ActiveLine } from "@/lib/astrocartography";
import { PLANET_PL } from "@/lib/astrocartography";
import { PLANET_LINE_COLORS, PLANET_GLYPHS } from "@/lib/mapColors";

const FLAG: Record<string, string> = {
  GR: "🇬🇷", ID: "🇮🇩", IT: "🇮🇹", PT: "🇵🇹", MU: "🇲🇺", CR: "🇨🇷", MX: "🇲🇽",
  MA: "🇲🇦", PL: "🇵🇱", FR: "🇫🇷", CZ: "🇨🇿", US: "🇺🇸", AR: "🇦🇷", ES: "🇪🇸",
  AT: "🇦🇹", GB: "🇬🇧", SG: "🇸🇬", JP: "🇯🇵", AE: "🇦🇪", DE: "🇩🇪", HK: "🇭🇰",
  CH: "🇨🇭", IN: "🇮🇳", IL: "🇮🇱", PE: "🇵🇪", BT: "🇧🇹", ZA: "🇿🇦", LB: "🇱🇧",
  BA: "🇧🇦", UA: "🇺🇦", GE: "🇬🇪", IS: "🇮🇸",
};

const LINE_PL: Record<string, string> = { MC: "MC", IC: "IC", ASC: "AC", DSC: "DC" };

type Narrative = {
  card_teaser: string;
  why_place: string;
  why_for_you: string;
  what_youll_feel: string;
  similar_slugs: string[];
};

interface Props {
  city: CuratedCity;
  intentionId: string;
  activeLines: ActiveLine[];
  accessToken?: string;
  readingId?: string;
  onClose: () => void;
  onShowOnMap?: () => void;
  onCityChange?: (city: CuratedCity, lines: ActiveLine[]) => void;
}

export default function PlaceFullNarrative({
  city,
  intentionId,
  activeLines,
  accessToken,
  readingId,
  onClose,
  onShowOnMap,
  onCityChange,
}: Props) {
  const [narrative, setNarrative] = useState<Narrative | null>(null);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNarrative(null);
    setImgError(false);
    fetchNarrative();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city.slug, intentionId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function fetchNarrative() {
    if (!accessToken || !readingId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cosmo-map-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          city_slug: city.slug,
          intention_id: intentionId,
          reading_id: readingId,
          active_lines: activeLines,
        }),
      });
      const data = await res.json() as { narrative?: Narrative; error?: string };
      if (data.narrative) setNarrative(data.narrative);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  const similarCities = (narrative?.similar_slugs ?? [])
    .map((s) => getCuratedCity(s))
    .filter(Boolean) as CuratedCity[];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#0b0719] border-l border-slate-700/40 overflow-y-auto shadow-2xl flex flex-col"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero photo */}
        <div className="relative h-56 bg-slate-800 shrink-0">
          {!imgError ? (
            <img
              src={city.photo_url}
              alt={city.name_pl}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {FLAG[city.country_code] ?? "🌍"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0719] to-transparent" />
        </div>

        {/* Content */}
        <div className="px-6 pb-8 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl">{FLAG[city.country_code] ?? "🌍"}</span>
              <h2 className="text-2xl font-bold text-white">{city.name_pl}</h2>
              <span className="text-slate-500 text-sm">{city.country_pl}</span>
            </div>
            {narrative?.card_teaser && (
              <p className="text-amber-300 text-sm font-medium italic">{narrative.card_teaser}</p>
            )}
          </div>

          {/* Active lines badges */}
          {activeLines.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeLines.slice(0, 5).map((line, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    color: PLANET_LINE_COLORS[line.planet],
                    borderColor: PLANET_LINE_COLORS[line.planet] + "60",
                    backgroundColor: PLANET_LINE_COLORS[line.planet] + "15",
                  }}
                >
                  {PLANET_GLYPHS[line.planet]} {PLANET_PL[line.planet]} {LINE_PL[line.type]}
                  <span className="text-slate-500 font-normal">{line.distance_km} km</span>
                </span>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generoję interpretację…
            </div>
          )}

          {!loading && !narrative && !accessToken && (
            <div className="text-slate-500 text-sm p-4 border border-slate-700/40 rounded-xl">
              <p className="font-medium text-slate-400 mb-1">{city.cultural_blurb}</p>
              <p className="text-xs mt-3 text-slate-600">Zaloguj się aby zobaczyć pełną astrologiczną narrację.</p>
            </div>
          )}

          {/* Narrative sections */}
          {narrative && (
            <div className="space-y-5">
              <Section title="Dlaczego to miejsce" text={narrative.why_place} />
              <Section title="Dlaczego dla Ciebie" text={narrative.why_for_you} highlight />
              <Section title="Jak to może wyglądać" text={narrative.what_youll_feel} />
            </div>
          )}

          {/* Similar places */}
          {similarCities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Podobny rezonans</h4>
              <div className="space-y-2">
                {similarCities.map((similar) => (
                  <button
                    key={similar.slug}
                    onClick={() => onCityChange?.(similar, [])}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-700/30 hover:border-amber-700/40 transition-colors text-left"
                  >
                    <span className="text-xl">{FLAG[similar.country_code] ?? "🌍"}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{similar.name_pl}</div>
                      <div className="text-xs text-slate-500">{similar.country_pl}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {onShowOnMap && (
            <button
              onClick={onShowOnMap}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Zobacz na mapie
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, text, highlight }: { title: string; text: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "border-amber-900/30 bg-amber-950/10" : "border-slate-700/30 bg-slate-800/20"}`}>
      <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${highlight ? "text-amber-400" : "text-slate-500"}`}>
        {title}
      </h4>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="text-slate-300 text-sm leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="text-slate-100 font-semibold">{children}</strong>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
