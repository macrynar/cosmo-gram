"use client";

import { useState } from "react";
import { Loader2, X, MapPin, Share2, Clock, Target, AlertTriangle, Plane } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ActiveLine } from "@/lib/astrocartography";
import { PLANET_PL, PLANET_EMOJI, PLANET_COLORS, LINE_PL_SHORT } from "@/lib/astrocartography";
import type { City } from "@/lib/cityDatabase";
import { track } from "@/components/PostHogProvider";
import { generateTop5Card, generateAntiMapCard, generateFullMapCard, downloadBlob } from "@/lib/mapShareCard";

interface Props {
  city: City;
  activeLines: ActiveLine[];
  interpretation: string;
  loading: boolean;
  onClose: () => void;
  scenarioLabel?: string | null;
  topCities?: Array<{ city: City; lines: ActiveLine[] }>;
}

const LINE_LABEL: Record<string, string> = {
  MC:  "szczyt nieba — kariera i wizerunek",
  IC:  "dno nieba — dom i korzenie",
  ASC: "wschód — osobowość i energia",
  DSC: "zachód — relacje i partnerstwo",
};

type CardType = "full_map" | "top_5" | "anti_map";

const CARD_OPTIONS: Array<{ type: CardType; label: string; desc: string }> = [
  { type: "full_map",  label: "🗺 Mapa mocy",       desc: "Mapa + top 3 miasta" },
  { type: "top_5",    label: "⭐ Top 5 miast",      desc: "Lista najlepszych miast" },
  { type: "anti_map", label: "⚡ Miejsca wyzwań",   desc: "Saturn & Pluton" },
];

type ParsedInterpretation = {
  main_prose: string;
  optimal_duration: string;
  what_to_do: string;
  bad_window: string;
  logistics: string;
};

function parseInterpretation(text: string): ParsedInterpretation | null {
  if (!text) return null;
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<ParsedInterpretation>;
    if (parsed.main_prose) return parsed as ParsedInterpretation;
  } catch { /* old plain-text cache */ }
  return null;
}

export default function CityDetails({ city, activeLines, interpretation, loading, onClose, scenarioLabel, topCities }: Props) {
  const topLine = activeLines[0];
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const parsed = parseInterpretation(interpretation);
  const mainProse = parsed?.main_prose ?? interpretation;

  async function handleShare(type: CardType) {
    if (!scenarioLabel) return;
    setShareLoading(true);
    try {
      const mapped = (topCities ?? []).map(({ city: c, lines }) => ({
        city_name_pl: c.name_pl,
        city_country_pl: c.country_pl,
        lines,
        interpretation: c.slug === city.slug ? interpretation : undefined,
      }));

      const hardCities = mapped.filter(({ lines }) =>
        lines.some(l => l.planet === "Saturn" || l.planet === "Pluto")
      );

      let blob: Blob;
      if (type === "full_map") {
        blob = await generateFullMapCard(scenarioLabel, mapped);
      } else if (type === "top_5") {
        blob = await generateTop5Card(scenarioLabel, mapped);
      } else {
        blob = await generateAntiMapCard(hardCities.length > 0 ? hardCities : mapped);
      }

      const filename = `cosmo-map-${type}-${city.slug}.png`;

      if (navigator.share && navigator.canShare?.({ files: [new File([blob], filename, { type: "image/png" })] })) {
        await navigator.share({ files: [new File([blob], filename, { type: "image/png" })] });
      } else {
        downloadBlob(blob, filename);
      }

      track("cosmo_map_shared", { card_type: type, city_slug: city.slug });
      setShareOpen(false);
    } catch { /* share cancelled or failed */ } finally {
      setShareLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-start gap-4">
          {topLine && (
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 mt-0.5"
              style={{ background: PLANET_COLORS[topLine.planet] + "20", border: `1px solid ${PLANET_COLORS[topLine.planet]}35` }}
            >
              {PLANET_EMOJI[topLine.planet]}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
              <MapPin className="w-3 h-3" />
              {city.country_pl}
            </div>
            <h2 className="text-2xl font-bold text-white font-brand leading-tight">{city.name_pl}</h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-4 mt-1">
          {scenarioLabel && (
            <div className="relative">
              <button
                onClick={() => setShareOpen((v) => !v)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-900/15 transition-colors"
                title="Udostępnij"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {shareOpen && (
                <div className="absolute top-full right-0 mt-1 rounded-xl border border-amber-900/30 bg-[#0b0719]/98 backdrop-blur shadow-2xl z-50 overflow-hidden min-w-[200px]">
                  <div className="px-3 py-2 text-[10px] text-slate-500 border-b border-amber-900/20 uppercase tracking-wider">
                    Wybierz kartę
                  </div>
                  {CARD_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => handleShare(opt.type)}
                      disabled={shareLoading}
                      className="w-full text-left px-3 py-2.5 hover:bg-amber-900/20 transition-colors border-b border-amber-900/10 last:border-0 disabled:opacity-50"
                    >
                      <div className="text-sm text-slate-200">{opt.label}</div>
                      <div className="text-[11px] text-slate-500">{opt.desc}</div>
                    </button>
                  ))}
                  {shareLoading && (
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generuję…
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active planet chips */}
      {activeLines.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {activeLines.slice(0, 6).map((line, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-medium"
              style={{
                color: PLANET_COLORS[line.planet],
                borderColor: PLANET_COLORS[line.planet] + "40",
                background: PLANET_COLORS[line.planet] + "12",
              }}
            >
              <span>{PLANET_EMOJI[line.planet]}</span>
              <span>{PLANET_PL[line.planet]}</span>
              <span className="opacity-70">{LINE_PL_SHORT[line.type]}</span>
              <span
                className="text-[10px] font-normal ml-0.5 px-1.5 py-0.5 rounded-full"
                style={{ background: PLANET_COLORS[line.planet] + "20", color: PLANET_COLORS[line.planet] + "cc" }}
              >
                {line.distance_km} km
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Line type key */}
      {activeLines.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5 text-[11px] text-slate-600">
          {[...new Set(activeLines.map(l => l.type))].map(type => (
            <span key={type}>
              <span className="text-slate-500 font-medium">{LINE_PL_SHORT[type]}</span>
              {" — "}
              {LINE_LABEL[type]}
            </span>
          ))}
        </div>
      )}

      {/* AI interpretation — main prose */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-950/20 via-[#0b0918] to-violet-950/15 border border-amber-900/20 p-5 md:p-6 mb-4">
        {loading ? (
          <div className="flex items-center gap-2.5 text-sm text-slate-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <span>Analizuję energię tego miejsca…</span>
          </div>
        ) : mainProse ? (
          <div className="prose prose-invert prose-base max-w-none text-slate-200 leading-relaxed [&>p]:mb-0 [&>p+p]:mt-3">
            <ReactMarkdown>{mainProse}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic">Brak interpretacji.</p>
        )}
      </div>

      {/* Extended sections — only if structured JSON was returned */}
      {!loading && parsed && (
        <div className="space-y-3">
          {parsed.optimal_duration && (
            <div className="rounded-xl border border-amber-900/20 bg-[#0b0918]/60 px-4 py-3 flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-500/70 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] font-medium text-amber-400/70 uppercase tracking-wider mb-1">Optymalny czas pobytu</div>
                <p className="text-sm text-slate-300 leading-relaxed">{parsed.optimal_duration}</p>
              </div>
            </div>
          )}

          {parsed.what_to_do && (
            <div className="rounded-xl border border-amber-900/20 bg-[#0b0918]/60 px-4 py-3 flex items-start gap-3">
              <Target className="w-4 h-4 text-green-500/70 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] font-medium text-green-400/70 uppercase tracking-wider mb-1">Co tu robić</div>
                <p className="text-sm text-slate-300 leading-relaxed">{parsed.what_to_do}</p>
              </div>
            </div>
          )}

          {parsed.bad_window && (
            <div className="rounded-xl border border-red-900/25 bg-red-950/10 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400/70 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] font-medium text-red-400/70 uppercase tracking-wider mb-1">Kiedy NIE jechać</div>
                <p className="text-sm text-slate-300 leading-relaxed">{parsed.bad_window}</p>
              </div>
            </div>
          )}

          {parsed.logistics && (
            <div className="rounded-xl border border-slate-700/30 bg-slate-900/30 px-4 py-3 flex items-start gap-3">
              <Plane className="w-4 h-4 text-slate-400/70 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] font-medium text-slate-400/70 uppercase tracking-wider mb-1">Logistyka z Warszawy</div>
                <p className="text-sm text-slate-300 leading-relaxed">{parsed.logistics}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
