"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Lock, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Season } from "@/lib/astro/layers";
import { PLANET_GENITIVE } from "@/lib/i18n/astro";

const ASPECT_LABEL: Record<string, string> = {
  conjunction: "koniunkcja",
  sextile:     "sekstyl",
  square:      "kwadrat",
  trine:       "trygon",
  opposition:  "opozycja",
};

const MONTH_SHORT: Record<number, string> = {
  1: "sty", 2: "lut", 3: "mar", 4: "kwi", 5: "maj", 6: "cze",
  7: "lip", 8: "sie", 9: "wrz", 10: "paź", 11: "lis", 12: "gru",
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00Z");
  const e = new Date(end   + "T12:00:00Z");
  const sM = MONTH_SHORT[s.getUTCMonth() + 1];
  const eM = MONTH_SHORT[e.getUTCMonth() + 1];
  const sY = s.getUTCFullYear();
  const eY = e.getUTCFullYear();
  if (sY === eY) return `${sM} ${sY} – ${eM} ${sY}`;
  return `${sM} ${sY} – ${eM} ${eY}`;
}

function phaseWidth(phase: Season["phase"]): string {
  if (phase === "początek")   return "25%";
  if (phase === "środek")     return "55%";
  return "85%";
}

const PHASE_LABEL: Record<Season["phase"], string> = {
  "początek":  "Początek",
  "środek":    "Środek",
  "domykanie": "Domykanie",
};

type SeasonRowProps = {
  season:     Season;
  isPremium:  boolean;
  name:       string | null;
  paragraph:  string | null;
  expanded:   boolean;
  onToggle:   () => void;
};

function SeasonRow({ season, isPremium, name, paragraph, expanded, onToggle }: SeasonRowProps) {
  const transitLabel = `${season.transitPlanet} (${ASPECT_LABEL[season.aspectType] ?? season.aspectType}) → ${PLANET_GENITIVE[season.natalPoint] ?? season.natalPoint}`;
  const displayName  = name ?? `Sezon: ${transitLabel}`;
  const range        = formatDateRange(season.start, season.end);

  const phaseColor = season.favorable
    ? "rgba(212,175,55,0.70)"
    : "rgba(180,100,30,0.70)";

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.08)" }}>
      {/* Collapsed summary line */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-slate-200 truncate block">{displayName}</span>
          <span className="text-xs text-slate-500">{transitLabel} · {range}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-500">{PHASE_LABEL[season.phase]}</span>
          {expanded
            ? <ChevronUp  className="w-3.5 h-3.5 text-slate-600" />
            : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Phase progress bar */}
              <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: phaseWidth(season.phase), background: phaseColor }}
                />
              </div>

              {/* Paragraph — premium only */}
              {isPremium ? (
                paragraph ? (
                  <p className="text-sm text-slate-300 leading-relaxed">{paragraph}</p>
                ) : (
                  <p className="text-xs text-slate-500 italic">Generuję opis…</p>
                )
              ) : (
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg"
                  style={{ background: "rgba(212,175,55,0.04)", border: "0.5px solid rgba(212,175,55,0.14)" }}>
                  <Lock className="w-3.5 h-3.5 text-amber-500/40 shrink-0" />
                  <p className="text-xs text-slate-500">
                    Znaczenie sezonu dostępne w{" "}
                    <a href="/pricing" className="text-amber-400 hover:text-amber-300">Premium</a>
                  </p>
                </div>
              )}

              {/* Exact days */}
              {season.exactDays.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-500 mr-1">◆ Dni dokładności:</span>
                  {season.exactDays.map(d => {
                    const dt = new Date(d + "T12:00:00Z");
                    return (
                      <span key={d} className="px-1.5 py-0.5 rounded text-[11px] font-medium text-amber-300/80"
                        style={{ background: "rgba(212,175,55,0.10)" }}>
                        {dt.getUTCDate()} {MONTH_SHORT[dt.getUTCMonth() + 1]}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type SeasonMeta = { name: string | null; paragraph: string | null };

type Props = {
  seasons:         Season[];
  isPremium:       boolean;
  readingId:       string | null;
  defaultExpanded: boolean;        // true on first visit / new season / phase change
};

export default function SeasonsCard({ seasons, isPremium, readingId, defaultExpanded }: Props) {
  const [cardExpanded,    setCardExpanded]    = useState(defaultExpanded);
  const [expandedKey,     setExpandedKey]     = useState<string | null>(null);
  const [showAll,         setShowAll]         = useState(false);
  const [seasonMeta,      setSeasonMeta]      = useState<Record<string, SeasonMeta>>({});
  const fetchedKeys = useRef(new Set<string>());

  const displaySeasons = showAll ? seasons : seasons.slice(0, 3);

  // Expand first season by default when card first opens
  useEffect(() => {
    if (defaultExpanded && seasons.length > 0 && !expandedKey) {
      const firstKey = `${seasons[0].transitPlanet}-${seasons[0].aspectType}-${seasons[0].natalPoint}`;
      setExpandedKey(firstKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultExpanded, seasons.length]);

  // Fetch cached season names/paragraphs from API when a row expands
  useEffect(() => {
    if (!expandedKey || !readingId || !isPremium) return;
    if (fetchedKeys.current.has(expandedKey)) return;
    fetchedKeys.current.add(expandedKey);

    const season = seasons.find(s =>
      `${s.transitPlanet}-${s.aspectType}-${s.natalPoint}` === expandedKey
    );
    if (!season) return;

    fetch(`/api/season-content?reading_id=${readingId}&transit_key=${expandedKey}&phase=${encodeURIComponent(season.phase)}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { name: string; paragraph: string } | null) => {
        if (data) {
          setSeasonMeta(prev => ({ ...prev, [expandedKey]: { name: data.name, paragraph: data.paragraph } }));
        }
      })
      .catch(() => {});
  }, [expandedKey, readingId, isPremium, seasons]);

  if (seasons.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(5,4,14,0.55)", border: "0.5px solid rgba(212,175,55,0.14)", backdropFilter: "blur(18px)" }}>

      {/* Header */}
      <button
        onClick={() => {
          const next = !cardExpanded;
          setCardExpanded(next);
          if (next) {
            import("posthog-js").then(({ default: ph }) =>
              ph?.capture("season_expanded", { season_count: seasons.length })
            );
          }
        }}
        className="w-full flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: cardExpanded ? "0.5px solid rgba(212,175,55,0.10)" : undefined }}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" style={{ color: "#D4AF37" }} />
          <span className="text-xs font-semibold text-slate-300 tracking-wide">Twoje sezony</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium text-slate-500"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            {seasons.length}
          </span>
        </div>
        {cardExpanded
          ? <ChevronUp  className="w-3.5 h-3.5 text-slate-600" />
          : <div className="text-xs text-slate-500 flex items-center gap-1">
              <span className="max-w-[200px] truncate">{seasons[0] ? `${seasons[0].transitPlanet} → ${PLANET_GENITIVE[seasons[0].natalPoint] ?? seasons[0].natalPoint}` : ""}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
            </div>}
      </button>

      <AnimatePresence initial={false}>
        {cardExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-2">
              {displaySeasons.map(s => {
                const key = `${s.transitPlanet}-${s.aspectType}-${s.natalPoint}`;
                const meta = seasonMeta[key] ?? { name: null, paragraph: null };
                return (
                  <SeasonRow
                    key={key}
                    season={s}
                    isPremium={isPremium}
                    name={meta.name}
                    paragraph={meta.paragraph}
                    expanded={expandedKey === key}
                    onToggle={() => setExpandedKey(prev => prev === key ? null : key)}
                  />
                );
              })}

              {!showAll && seasons.length > 3 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1 transition-colors"
                >
                  Pokaż wszystkie ({seasons.length - 3} więcej)
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
