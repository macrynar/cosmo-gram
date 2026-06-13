"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WHEN_BEST_CHIPS, DOMAIN_META, type UIDomain } from "@/lib/astro/domains";
import { bestWindowForDomain, type WhenBestAnswer } from "@/lib/astro/whenBest";
import { formatTransit, ASPECT_LABEL_PL, inSign, natalGenitive } from "@/lib/i18n/astro";
import type { NatalChart } from "@/lib/astro-types";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTH_NAMES_GEN = [
  "", "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];
const MONTH_NAMES_NOM = [
  "", "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];
const MONTH_SHORT: Record<number, string> = {
  1:"sty",2:"lut",3:"mar",4:"kwi",5:"maj",6:"cze",
  7:"lip",8:"sie",9:"wrz",10:"paź",11:"lis",12:"gru",
};

function parseISO(iso: string) {
  const d = new Date(iso + "T12:00:00Z");
  return { d, day: d.getUTCDate(), month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
}

function formatExact(iso: string): string {
  const { day, month, year } = parseISO(iso);
  const nowYear = new Date().getUTCFullYear();
  return `${day} ${MONTH_NAMES_GEN[month]}${year !== nowYear ? ` ${year}` : ""}`;
}

function formatApprox(iso: string): string {
  const { month, year } = parseISO(iso);
  const nowYear = new Date().getUTCFullYear();
  return `${MONTH_NAMES_NOM[month]}${year !== nowYear ? ` ${year}` : ""}`;
}

function formatRange(start: string, end: string): string {
  const s = parseISO(start);
  const e = parseISO(end);
  if (s.month === e.month && s.year === e.year) {
    return `${s.day}–${e.day} ${MONTH_SHORT[s.month]}`;
  }
  return `${s.day} ${MONTH_SHORT[s.month]} – ${e.day} ${MONTH_SHORT[e.month]}`;
}

// ─── Answer card ──────────────────────────────────────────────────────────────

type AnswerCardProps = {
  answer:    WhenBestAnswer;
  domain:    UIDomain | "Uważaj";
  isPremium: boolean;
};

function AnswerCard({ answer, domain, isPremium }: AnswerCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!answer) {
    return (
      <p className="text-sm text-slate-500 mt-3 px-1">
        Nic wyraźnego w horyzoncie 90 dni. Sprawdź ponownie za miesiąc.
      </p>
    );
  }

  const meta = domain !== "Uważaj" ? DOMAIN_META[domain] : null;
  const dotColor = meta?.color ?? "#E0B566";

  if (answer.kind === "quiet") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 rounded-xl p-4 space-y-2"
        style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "#6BC4A0" }} />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Odpoczynek</span>
        </div>
        {isPremium ? (
          <>
            <p className="text-sm text-white font-medium">
              {formatRange(answer.start, answer.end)} — {answer.days} dni bez wymagających tranzytów.
            </p>
            <p className="text-xs text-slate-500">Dobry czas na regenerację i wyciszenie.</p>
          </>
        ) : (
          <>
            <p className="text-sm text-white font-medium">
              Spokojny czas zbliża się w{" "}
              <span className="text-amber-400">{formatApprox(answer.start)}</span>
            </p>
            <PremiumBadge />
          </>
        )}
      </motion.div>
    );
  }

  // Window result
  const w = answer.window;
  const aspect = ASPECT_LABEL_PL[w.aspectType] ?? w.aspectType;
  const mechanika = formatTransit(w);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-xl p-4 space-y-2"
      style={{ background: "rgba(255,255,255,0.04)", border: `0.5px solid ${dotColor}33` }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
        {meta && (
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: dotColor }}>
            {meta.label}
          </span>
        )}
      </div>

      {isPremium ? (
        <>
          <p className="text-sm text-white font-medium leading-snug">
            {formatRange(answer.rangeStart, answer.rangeEnd)}
            <span className="ml-2 text-amber-400 text-xs">★ peak {formatExact(answer.peakDate)}</span>
          </p>
          <p className="text-xs text-slate-400 leading-snug">
            {w.character === "wspierające"
              ? `Sprzyja: ${w.transitPlanet} ${inSign(w.transitSign)} · ${aspect} do ${natalGenitive(w.natalPoint)}.`
              : `Uważaj: ${w.transitPlanet} ${inSign(w.transitSign)} · ${aspect} do ${natalGenitive(w.natalPoint)}.`}
          </p>

          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Mechanika
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="text-xs text-slate-500 overflow-hidden"
              >
                {mechanika}
              </motion.p>
            )}
          </AnimatePresence>
        </>
      ) : (
        <>
          <p className="text-sm text-white font-medium">
            {w.character === "wspierające" ? "Sprzyja" : "Uważaj"} w{" "}
            <span className="text-amber-400">{formatApprox(answer.peakDate)}</span>
          </p>
          <PremiumBadge />
        </>
      )}
    </motion.div>
  );
}

function PremiumBadge() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <Lock className="w-3 h-3 text-amber-600/60" />
      <span>Dokładna data i szczegóły — Premium</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  chart:     NatalChart;
  isPremium: boolean;
};

export default function WhenBest({ chart, isPremium }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [answer,    setAnswer]    = useState<WhenBestAnswer>(null);
  const [computing, setComputing] = useState(false);

  function handleChip(domainKey: UIDomain | "Uważaj") {
    if (activeKey === domainKey) {
      setActiveKey(null);
      setAnswer(null);
      return;
    }

    setActiveKey(domainKey);
    setComputing(true);

    // bestWindowForDomain is synchronous (pure astronomical computation)
    try {
      const result = bestWindowForDomain(chart, domainKey);
      setAnswer(result);
    } catch {
      setAnswer(null);
    } finally {
      setComputing(false);
    }
  }

  const chips = WHEN_BEST_CHIPS.filter(c => isPremium || !c.premium);

  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Kiedy najlepiej…?
      </p>

      {/* Chip row */}
      <div className="flex flex-wrap gap-2">
        {chips.map(chip => {
          const meta     = chip.domain !== "Uważaj" ? DOMAIN_META[chip.domain] : null;
          const isActive = activeKey === chip.domain;
          const dotColor = meta?.color ?? "#E0B566";

          return (
            <button
              key={chip.domain}
              onClick={() => handleChip(chip.domain)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background:   isActive ? `${dotColor}22` : "rgba(255,255,255,0.05)",
                border:       isActive ? `1px solid ${dotColor}55` : "1px solid rgba(255,255,255,0.08)",
                color:        isActive ? dotColor : "rgb(148,163,184)",
              }}
            >
              {chip.label}
              {chip.premium && <Lock className="w-2.5 h-2.5 opacity-60" />}
            </button>
          );
        })}

        {/* Premium upsell chip if not premium */}
        {!isPremium && (
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium opacity-40 cursor-default"
            style={{
              background: "rgba(255,255,255,0.03)",
              border:     "1px dashed rgba(255,255,255,0.15)",
              color:      "rgb(100,116,139)",
            }}
          >
            Kiedy uważać <Lock className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Loading state */}
      {computing && (
        <div className="mt-3 h-8 flex items-center gap-2">
          <div className="w-3 h-3 border border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-500">Szukam…</span>
        </div>
      )}

      {/* Answer card */}
      {!computing && activeKey && (
        <AnswerCard
          answer={answer}
          domain={activeKey as UIDomain | "Uważaj"}
          isPremium={isPremium}
        />
      )}
    </div>
  );
}
