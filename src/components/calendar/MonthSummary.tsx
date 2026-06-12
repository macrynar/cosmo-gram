"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, Sparkles, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { skyEventText, type SkyEvent } from "@/lib/astro/layers";

const MONTH_NAMES_PL = [
  "", "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];

const MONTH_NAMES_GEN = [
  "", "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];

const MONTH_SHORT: Record<number, string> = {
  1: "sty", 2: "lut", 3: "mar", 4: "kwi", 5: "maj", 6: "cze",
  7: "lip", 8: "sie", 9: "wrz", 10: "paź", 11: "lis", 12: "gru",
};

const CATEGORY_SYMBOL: Record<string, string> = {
  "miłość":        "♥",
  "kariera":       "↑",
  "energia":       "◆",
  "komunikacja":   "~",
  "transformacja": "●",
  "intuicja":      "◇",
};

type WindowEntry = {
  key:       string;
  phrase:    string;
  start:     string;
  peak:      string;
  end:       string;
  character: string;
  category:  string;
  sentence:  string | null;
};

type Props = {
  year:           number;
  month:          number;
  isPremium:      boolean;
  readingId:      string | null;
  skyEvents:      SkyEvent[];    // retrogrades + eclipses for the month
  onWindowClick?: (peakDate: string) => void;
};

export default function MonthSummary({ year, month, isPremium, readingId, skyEvents, onWindowClick }: Props) {
  const { session } = useAuth();
  const [windows, setWindows]     = useState<WindowEntry[]>([]);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [expanded, setExpanded]   = useState(true);
  const prevKey = useRef("");

  const monthKey = `${year}-${month}-${readingId ?? ""}`;

  useEffect(() => {
    if (prevKey.current === monthKey) return;
    prevKey.current = monthKey;
    if (!session || !readingId) return;

    setWindows([]); setSynthesis(null); setLoading(true);

    const params = new URLSearchParams({ year: String(year), month: String(month), reading_id: readingId });
    fetch(`/api/monthly-summary?${params}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async r => {
        if (!r.ok) return;
        const d = await r.json();
        setWindows(d.windows ?? []);
        setSynthesis(d.synthesis ?? null);
        import("posthog-js").then(({ default: ph }) =>
          ph?.capture("month_summary_viewed", { year, month, is_premium: isPremium, window_count: (d.windows ?? []).length })
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey, session]);

  function formatRange(start: string, end: string): string {
    const s = new Date(start + "T12:00:00Z");
    const e = new Date(end   + "T12:00:00Z");
    const sDay = s.getUTCDate();
    const eDay = e.getUTCDate();
    const eMon = MONTH_NAMES_GEN[e.getUTCMonth() + 1];
    if (s.getUTCMonth() === e.getUTCMonth()) return `${sDay}–${eDay} ${eMon}`;
    const sMon = MONTH_NAMES_GEN[s.getUTCMonth() + 1];
    return `${sDay} ${sMon}–${eDay} ${eMon}`;
  }

  function formatPeak(peak: string): string {
    const d = new Date(peak + "T12:00:00Z");
    return `peak ${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth() + 1]}`;
  }

  // Sky events for the month (retrogrades and eclipses)
  const monthSkyEvents = skyEvents.filter(e => {
    const d = new Date(e.date + "T12:00:00Z");
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  });

  const hasContent = !loading && (windows.length > 0 || monthSkyEvents.length > 0);

  if (!session) return null;
  if (!loading && !hasContent) return null;

  const monthLabel = `Twój ${MONTH_NAMES_PL[month]}`;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(5,4,14,0.55)", border: "0.5px solid rgba(212,175,55,0.14)", backdropFilter: "blur(18px)" }}>

      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: expanded ? "0.5px solid rgba(212,175,55,0.10)" : undefined }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: "#D4AF37" }} />
          <span className="text-xs font-semibold text-slate-300 tracking-wide capitalize">{monthLabel}</span>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
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
            <div className="px-5 py-4 space-y-3">
              {loading ? (
                <div className="flex justify-center py-4">
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(212,175,55,0.25)", borderTopColor: "#D4AF37" }} />
                </div>
              ) : (
                <>
                  {/* Fast transit windows — chronological */}
                  {windows.map(w => (
                    <button
                      key={w.key}
                      onClick={() => {
                        import("posthog-js").then(({ default: ph }) => ph?.capture("window_clicked", { key: w.key, peak: w.peak }));
                        onWindowClick?.(w.peak);
                      }}
                      className="w-full text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-0.5 w-5 h-5 rounded-md shrink-0 flex items-center justify-center text-[11px] font-bold"
                          style={{
                            background: w.character === "wspierające"
                              ? "rgba(212,175,55,0.15)"
                              : "rgba(180,100,30,0.15)",
                            color: w.character === "wspierające" ? "#D4AF37" : "#C07030",
                          }}
                        >
                          {CATEGORY_SYMBOL[w.category] ?? "·"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-xs font-medium text-amber-400/70">
                              {formatRange(w.start, w.end)}
                              <span className="text-amber-500/50"> · {formatPeak(w.peak)}</span>
                            </span>
                            <span className="text-xs text-slate-400 leading-snug group-hover:text-slate-300 transition-colors">
                              {w.phrase}
                            </span>
                          </div>
                          {isPremium && w.sentence ? (
                            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{w.sentence}</p>
                          ) : !isPremium ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Lock className="w-2.5 h-2.5 text-slate-600" />
                              <span className="text-[11px] text-slate-600">Znaczenie —{" "}
                                <a href="/pricing" className="text-amber-500/50 hover:text-amber-400 transition-colors">w Premium</a>
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Sky events section — "Niebo dla wszystkich" */}
                  {monthSkyEvents.length > 0 && (
                    <>
                      {windows.length > 0 && (
                        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-slate-500" />
                          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Niebo dla wszystkich</p>
                        </div>
                        {monthSkyEvents.map((e, i) => {
                          const d = new Date(e.date + "T12:00:00Z");
                          const dateLabel = `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth() + 1]}`;
                          const text = skyEventText(e);
                          const isEclipse = e.type === "solar_eclipse" || e.type === "lunar_eclipse";
                          return (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-xs font-medium shrink-0 mt-0.5"
                                style={{ color: isEclipse ? "rgba(253,224,71,0.70)" : "rgba(212,175,55,0.55)" }}>
                                {isEclipse ? "◎" : "℞"} {dateLabel}
                              </span>
                              <div className="min-w-0">
                                <span className="text-xs text-slate-400">{text}</span>
                                {isPremium && e.natalHouse && (
                                  <span className="text-xs text-slate-500 ml-1">· Twój {e.natalHouse}. dom</span>
                                )}
                                {!isPremium && (
                                  <span className="text-[11px] text-slate-600 ml-1">
                                    · dom{" "}
                                    <a href="/pricing" className="text-amber-500/50 hover:text-amber-400">w Premium</a>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Synthesis */}
                  {isPremium && synthesis && (
                    <>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
                      <p className="text-xs text-slate-500 italic leading-relaxed">{synthesis}</p>
                    </>
                  )}

                  {/* Density line — visible to all, always last */}
                  {windows.length > 0 && (
                    <>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />
                      <p className="text-[11px] text-center" style={{ color: "rgba(100,116,139,0.40)" }}>
                        {windows.length >= 5
                          ? "Gęsty miesiąc — wiele aktywnych energii naraz."
                          : windows.length === 1
                          ? "Spokojny miesiąc — jedno wyraźne okno."
                          : windows.length <= 2
                          ? "Spokojny miesiąc — mało aktywnych tranzytów."
                          : `${windows.length} okna tranzytowe — umiarkowana intensywność.`}
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
