"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Lock, ChevronDown, ThumbsUp, ThumbsDown,
  Sun, Zap, Sprout, Heart, Compass, Moon, GitBranch, Star,
  type LucideIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import type { AstroModule, ModuleId } from "@/lib/schemas/astroModule";

const MODULE_ICON: Record<string, LucideIcon> = {
  core:        Sun,
  superpowers: Zap,
  childhood:   Sprout,
  love:        Heart,
  career:      Compass,
  shadows:     Moon,
  roots:       GitBranch,
  purpose:     Star,
};

function meterGradient(value: number): string {
  // monochrom złoty — w obrębie palety DS
  if (value >= 80) return "linear-gradient(to right, rgba(224,181,102,0.55), var(--accent))";
  if (value >= 55) return "linear-gradient(to right, rgba(135,127,160,0.40), var(--accent-deep))";
  return "linear-gradient(to right, var(--line), rgba(135,127,160,0.55))";
}

const LS_READ = "cosmo_modules_read";
const LS_FEEDBACK = "cosmo_modules_feedback";

function getRead(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_READ) ?? "[]"); } catch { return []; }
}

function markRead(id: string) {
  try {
    const arr = getRead();
    if (!arr.includes(id)) {
      arr.push(id);
      localStorage.setItem(LS_READ, JSON.stringify(arr));
    }
  } catch {}
}

type Feedback = "up" | "down" | null;

function loadFeedback(id: string): Feedback {
  try {
    const raw = localStorage.getItem(LS_FEEDBACK);
    const map: Record<string, Feedback> = raw ? JSON.parse(raw) : {};
    return map[id] ?? null;
  } catch { return null; }
}

function saveFeedback(id: string, val: Feedback) {
  try {
    const raw = localStorage.getItem(LS_FEEDBACK);
    const map: Record<string, Feedback> = raw ? JSON.parse(raw) : {};
    map[id] = val;
    localStorage.setItem(LS_FEEDBACK, JSON.stringify(map));
  } catch {}
}

interface Props {
  module:        AstroModule;
  isPremiumUser: boolean;
  index:         number;
  sourceChips?:  string[];
  onPaywall?:    () => void;
  iconOverride?: LucideIcon;
}

export default function ModuleCard({ module, isPremiumUser, index, sourceChips, onPaywall, iconOverride }: Props) {
  const isLocked = module.isPremium && !isPremiumUser;
  const Icon     = iconOverride ?? MODULE_ICON[module.id] ?? Star;

  const [isExpanded,        setIsExpanded]        = useState(true);
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(false);
  const [feedback,          setFeedback]          = useState<Feedback>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load read state on mobile
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      const alreadyRead = getRead().includes(module.id);
      setIsExpanded(alreadyRead);
      setIsMobileCollapsed(!alreadyRead);
    }
    // Load feedback state
    setFeedback(loadFeedback(module.id));
  }, [module.id]);

  // Mark as read when user scrolls to bottom of module (≥80% of content seen)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (getRead().includes(module.id)) return; // already read
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          markRead(module.id);
          document.dispatchEvent(new CustomEvent("cosmo-module-expanded", { detail: { id: module.id } }));
          obs.disconnect();
        }
      },
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [module.id]);

  function handleExpand() {
    setIsExpanded(true);
    setIsMobileCollapsed(false);
    markRead(module.id);
    document.dispatchEvent(new CustomEvent("cosmo-module-expanded", { detail: { id: module.id } }));
  }

  function handleFeedback(val: Feedback) {
    const next = feedback === val ? null : val;
    setFeedback(next);
    saveFeedback(module.id, next);
    // PostHog event — fire-and-forget
    try {
      const { posthog } = window as unknown as { posthog?: { capture: (e: string, p: object) => void } };
      posthog?.capture("module_feedback", {
        module_id:     module.id,
        prompt_version: module.promptVersion,
        sentiment:     next ?? "removed",
      });
    } catch {}
  }

  return (
    <motion.div
      id={`module-${module.id}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl"
      style={{
        background:     "rgba(11,9,18,0.65)",
        border:         `0.5px solid rgba(224,181,102,${isLocked ? "0.09" : "0.18"})`,
        backdropFilter: "blur(18px)",
      }}
    >
      {/* ── Content ── */}
      <div className={`p-5 sm:p-6 space-y-5 ${isLocked ? "blur-sm select-none pointer-events-none" : ""}`}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(224,181,102,0.70)" }} />
              <p className="text-[10px] uppercase tracking-[0.24em] font-medium" style={{ color: "rgba(224,181,102,0.60)" }}>
                {module.title}
              </p>
            </div>
            <p
              className="text-xl sm:text-2xl text-white/90 italic leading-snug"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              &ldquo;{module.quote}&rdquo;
            </p>
          </div>
          {module.confidenceScore < 80 && (
            <div
              className="shrink-0 mt-0.5 text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap"
              title={`Pewność interpretacji: ${module.confidenceScore}%. Podanie godziny urodzenia podwyższy wynik.`}
              style={{ background: "rgba(224,181,102,0.07)", color: "rgba(224,181,102,0.45)", border: "0.5px solid rgba(224,181,102,0.18)", cursor: "help" }}
            >
              {module.confidenceScore}%
            </div>
          )}
        </div>

        {/* Source chips */}
        {sourceChips && sourceChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-[0.18em]" style={{ color: "rgba(135,127,160,0.40)" }}>Na podstawie:</span>
            {sourceChips.map(chip => (
              <span
                key={chip}
                className="px-2 py-0.5 rounded text-[10px]"
                style={{ background: "rgba(135,127,160,0.06)", border: "0.5px solid rgba(135,127,160,0.14)", color: "rgba(135,127,160,0.60)" }}
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Gold divider */}
        <div className="h-px" style={{ background: "linear-gradient(to right, transparent, rgba(224,181,102,0.18), transparent)" }} />

        {/* Visual Meters */}
        <div className="space-y-3.5">
          {module.visualMeters.map((meter, i) => {
            return (
              <div key={i}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-xs text-slate-400">{meter.label}</span>
                  <span className="text-[10px] tabular-nums" style={{ color: "rgba(224,181,102,0.50)" }}>{meter.value}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${meter.value}%` }}
                    transition={{ duration: 0.8, delay: index * 0.07 + i * 0.1 + 0.35, ease: "easeOut" }}
                    style={{ background: meterGradient(meter.value) }}
                  />
                </div>
                <p className="text-[10px] text-slate-600 mt-1 italic">{meter.archetype}</p>
              </div>
            );
          })}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {module.tags.map(tag => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
              style={{ background: "rgba(224,181,102,0.07)", border: "0.5px solid rgba(224,181,102,0.26)", color: "#E9DCC0" }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Content (markdown) — collapsible on mobile */}
        {(!isMobileCollapsed || isExpanded) && (
          <div
            className="text-sm text-slate-300 leading-relaxed space-y-3"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p:      ({ children }) => <p className="mt-0">{children}</p>,
                strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
              }}
            >
              {module.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Czytaj dalej — mobile only, when collapsed */}
        {isMobileCollapsed && !isExpanded && (
          <button
            onClick={handleExpand}
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: "rgba(224,181,102,0.70)" }}
          >
            <ChevronDown className="w-3.5 h-3.5" />
            czytaj dalej
          </button>
        )}

        {/* Scroll sentinel — fires when user reaches bottom of content (marks as read) */}
        <div ref={sentinelRef} aria-hidden className="h-px" />

        {/* Footer: feedback + chat bridge — visible when expanded */}
        {(!isMobileCollapsed || isExpanded) && (
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "rgba(224,181,102,0.08)" }}>
            {/* Feedback */}
            <div className="flex items-center gap-3">
              <span className="text-[10px]" style={{ color: "rgba(135,127,160,0.40)" }}>Trafione?</span>
              <button
                onClick={() => handleFeedback("up")}
                className="flex items-center gap-1 transition-opacity"
                style={{ opacity: feedback === "down" ? 0.3 : 1 }}
                title="Tak, trafiło"
              >
                <ThumbsUp className="w-3.5 h-3.5" style={{ color: feedback === "up" ? "rgba(224,181,102,0.85)" : "rgba(135,127,160,0.40)" }} />
              </button>
              <button
                onClick={() => handleFeedback("down")}
                className="flex items-center gap-1 transition-opacity"
                style={{ opacity: feedback === "up" ? 0.3 : 1 }}
                title="Nie trafiło"
              >
                <ThumbsDown className="w-3.5 h-3.5" style={{ color: feedback === "down" ? "#E2654A" : "rgba(135,127,160,0.40)" }} />
              </button>
            </div>

            {/* Chat bridge */}
            <Link
              href={`/app/chat?context=${encodeURIComponent(`Chcę pogłębić temat: ${module.title}`)}`}
              className="text-[10px] transition-colors"
              style={{ color: "rgba(135,127,160,0.45)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(224,181,102,0.70)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(135,127,160,0.45)"; }}
            >
              Pogłęb w Cosmo Chat →
            </Link>
          </div>
        )}

      </div>

      {/* ── Premium lock overlay ── */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer"
          style={{ background: "rgba(11,9,18,0.82)", backdropFilter: "blur(6px)" }}
          onClick={onPaywall}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(224,181,102,0.12)", border: "0.5px solid rgba(224,181,102,0.38)" }}
          >
            <Lock className="w-4 h-4" style={{ color: "#E0B566" }} />
          </div>
          <p
            className="text-base font-medium"
            style={{ color: "#E9DCC0", fontFamily: "var(--font-fraunces), serif" }}
          >
            {module.title}
          </p>
          <p className="text-xs text-slate-500">Dostępne w planie Plus</p>
          <div
            className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(224,181,102,0.12)", border: "0.5px solid rgba(224,181,102,0.35)", color: "#E0B566" }}
          >
            Odblokuj →
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
