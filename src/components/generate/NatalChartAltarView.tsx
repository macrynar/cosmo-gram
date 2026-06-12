"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Sun as SunIcon, Moon as MoonIcon, Compass } from "lucide-react";
import type { NatalChart } from "@/lib/astro-types";
import { SIGN_LOCATIVE } from "@/lib/i18n/astro";
import NatalChartSVG from "./NatalChartSVG";

// ─── Astrology data ─────────────────────────────────────────────────────────

type Element = "fire" | "earth" | "air" | "water";

type SignDef = {
  symbol:      string;
  element:     Element;
  color:       string;
  glow:        string;
  description: string;
  keywords:    [string, string, string];
};

const SIGNS: Record<string, SignDef> = {
  "Baran":      { symbol: "♈", element: "fire",  color: "#ef4444", glow: "rgba(239,68,68,0.40)",    description: "Ogień inicjatywy. Energia przełomu i odwagi.",              keywords: ["inicjatywa", "odwaga", "spontaniczność"] },
  "Byk":        { symbol: "♉", element: "earth", color: "#84cc16", glow: "rgba(132,204,22,0.34)",   description: "Ziemia wytrwałości. Piękno, zmysłowość i budowanie.",         keywords: ["wytrwałość", "zmysłowość", "stabilność"] },
  "Bliźnięta":  { symbol: "♊", element: "air",   color: "#38bdf8", glow: "rgba(56,189,248,0.34)",   description: "Powietrze dialogu. Ciekawość i wielość perspektyw.",           keywords: ["komunikacja", "ciekawość", "adaptacja"] },
  "Rak":        { symbol: "♋", element: "water", color: "#a78bfa", glow: "rgba(167,139,250,0.34)",  description: "Woda intuicji. Głęboka troska i emocjonalna pamięć.",          keywords: ["intuicja", "troska", "dom"] },
  "Lew":        { symbol: "♌", element: "fire",  color: "#f59e0b", glow: "rgba(245,158,11,0.40)",   description: "Ogień serca. Królewska ekspresja i twórcza siła.",             keywords: ["ekspresja", "twórczość", "lojalność"] },
  "Panna":      { symbol: "♍", element: "earth", color: "#86efac", glow: "rgba(134,239,172,0.32)",  description: "Ziemia analizy. Precyzja, służba i dążenie do doskonałości.",  keywords: ["analiza", "perfekcja", "służba"] },
  "Waga":       { symbol: "♎", element: "air",   color: "#67e8f9", glow: "rgba(103,232,249,0.32)",  description: "Powietrze harmonii. Równowaga, piękno i sprawiedliwość.",      keywords: ["harmonia", "relacje", "piękno"] },
  "Skorpion":   { symbol: "♏", element: "water", color: "#c084fc", glow: "rgba(192,132,252,0.40)",  description: "Woda transformacji. Głębia, intensywność i odrodzenie.",       keywords: ["transformacja", "głębia", "intensywność"] },
  "Strzelec":   { symbol: "♐", element: "fire",  color: "#fb923c", glow: "rgba(251,146,60,0.36)",   description: "Ogień wizji. Filozofia, wolność i poszukiwanie sensu.",         keywords: ["filozofia", "wolność", "ekspansja"] },
  "Koziorożec": { symbol: "♑", element: "earth", color: "#a3a3a3", glow: "rgba(163,163,163,0.32)",  description: "Ziemia ambicji. Dyscyplina, czas i budowanie trwałego.",       keywords: ["ambicja", "dyscyplina", "trwałość"] },
  "Wodnik":     { symbol: "♒", element: "air",   color: "#22d3ee", glow: "rgba(34,211,238,0.34)",   description: "Powietrze przebudzenia. Innowacja, wspólnota i przyszłość.",   keywords: ["innowacja", "humanitaryzm", "oryginalność"] },
  "Ryby":       { symbol: "♓", element: "water", color: "#818cf8", glow: "rgba(129,140,248,0.36)",  description: "Woda duszy. Duchowość, empatia i przekraczanie granic.",        keywords: ["duchowość", "empatia", "intuicja"] },
};

const SIGN_NAMES = [
  "Baran","Byk","Bliźnięta","Rak","Lew","Panna",
  "Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby",
];

const ELEMENT_LABELS: Record<Element, string> = {
  fire: "Ogień", earth: "Ziemia", air: "Powietrze", water: "Woda",
};

// ─── Sacred geometry backdrop ─────────────────────────────────────────────────

function SacredGeometry() {
  return (
    <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 400" fill="none" preserveAspectRatio="xMidYMid slice"
      style={{ opacity: 0.032 }}>
      <circle cx="200" cy="200" r="185" stroke="#D4AF37" strokeWidth="0.4" />
      <circle cx="200" cy="200" r="140" stroke="#D4AF37" strokeWidth="0.3" />
      <circle cx="200" cy="200" r="95"  stroke="#D4AF37" strokeWidth="0.3" />
      <polygon points="200,28 352,228 48,228"  stroke="#D4AF37" strokeWidth="0.3" fill="none" />
      <polygon points="200,372 48,172 352,172" stroke="#D4AF37" strokeWidth="0.3" fill="none" />
      <line x1="200" y1="14"  x2="200" y2="386" stroke="#D4AF37" strokeWidth="0.18" />
      <line x1="14"  y1="200" x2="386" y2="200" stroke="#D4AF37" strokeWidth="0.18" />
    </svg>
  );
}

// ─── Gold divider ─────────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-2.5 my-1">
      <div className="h-px flex-1 max-w-[80px]"
        style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.38))" }} />
      <div className="w-1 h-1 rounded-full" style={{ background: "rgba(212,175,55,0.55)" }} />
      <div className="h-px flex-1 max-w-[80px]"
        style={{ background: "linear-gradient(to left, transparent, rgba(212,175,55,0.38))" }} />
    </div>
  );
}

// ─── Amulet card flank ────────────────────────────────────────────────────────

type FocusTarget = "sun" | "moon" | "asc" | "chart" | null;
type TooltipAlign = "center" | "left-edge" | "right-edge";
type TooltipSide  = "above" | "below";

const BODY_ICON = {
  sun:  SunIcon,
  moon: MoonIcon,
  asc:  Compass,
};

interface FlankProps {
  body:          "sun" | "moon" | "asc";
  sign:          string;
  degree:        number;
  focused:       FocusTarget;
  onFocus:       (t: FocusTarget) => void;
  tooltipAlign?: TooltipAlign;
  tooltipSide?:  TooltipSide;
  compact?:      boolean;
}

function AmuletFlank({
  body, sign, degree, focused, onFocus,
  tooltipAlign = "center",
  tooltipSide  = "above",
  compact = false,
}: FlankProps) {
  const [tipVisible, setTipVisible] = useState(false);
  const data = SIGNS[sign];
  if (!data) return null;

  const BodyIcon  = BODY_ICON[body];
  const isMine    = focused === body;
  const isOther   = focused !== null && focused !== body;
  const bodyColor = body === "sun" ? "#f59e0b" : body === "moon" ? "#94a3b8" : "#d6b07d";
  const bodyLabel = body === "sun" ? "Słońce" : body === "moon" ? "Księżyc" : "Ascendent";
  const bodyDesc  = body === "sun"
    ? "Twoje Słońce definiuje tożsamość, wolę i drogę wyrażania siebie w świecie."
    : body === "moon"
    ? "Twój Księżyc kryje emocjonalne sanktuarium i najgłębsze potrzeby duszy."
    : "Twój Ascendent to maska, którą pokazujesz światu — pierwsze wrażenie i instynktowna reakcja.";

  const tipVertical = tooltipSide === "below" ? "top-full mt-3" : "bottom-full mb-3";
  const tipClass =
    tooltipAlign === "left-edge"  ? `absolute ${tipVertical} left-0 z-50 w-56 pointer-events-none` :
    tooltipAlign === "right-edge" ? `absolute ${tipVertical} right-0 z-50 w-56 pointer-events-none` :
    `absolute ${tipVertical} left-1/2 -translate-x-1/2 z-50 w-56 pointer-events-none`;

  const cardW = compact ? "w-20" : "w-24 sm:w-28";

  return (
    <motion.div
      className="flex flex-col items-center gap-3 cursor-pointer select-none relative"
      animate={{
        opacity: isOther ? 0.30 : 1,
        y:       isMine  ? -5   : 0,
        scale:   isMine  ? 1.04 : 1,
      }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => { onFocus(body); setTipVisible(true); }}
      onHoverEnd={()   => { onFocus(null); setTipVisible(false); }}
    >
      {/* ── Amulet card ── */}
      <motion.div
        className={`${cardW} aspect-square flex flex-col items-center justify-center gap-2.5 rounded-2xl transition-shadow duration-500`}
        animate={{
          boxShadow: isMine
            ? `0 0 28px rgba(212,175,55,0.16), 0 0 60px rgba(212,175,55,0.07), inset 0 0 0 0.5px rgba(212,175,55,0.50)`
            : `inset 0 0 0 0.5px rgba(212,175,55,0.20)`,
        }}
        transition={{ duration: 0.4 }}
        style={{
          background: "rgba(5,4,14,0.50)",
          backdropFilter: "blur(16px)",
          border: "0.5px solid rgba(212,175,55,0.20)",
        }}
      >
        {/* Lucide icon — thin stroke, gold tinted */}
        <BodyIcon
          className={compact ? "w-5 h-5" : "w-6 h-6"}
          strokeWidth={1}
          style={{
            color: bodyColor,
            filter: `drop-shadow(0 0 6px ${bodyColor}55)`,
          }}
        />

        {/* Zodiac symbol — larger, sign color with glow */}
        <span
          className={compact ? "text-2xl leading-none" : "text-3xl leading-none"}
          style={{
            fontFamily: "serif",
            color: data.color,
            filter: `drop-shadow(0 0 10px ${data.glow}) drop-shadow(0 0 4px ${data.color}44)`,
          }}
        >
          {data.symbol}
        </span>
      </motion.div>

      {/* ── Labels ── */}
      <div className="text-center space-y-0.5">
        <p className="text-[10px] uppercase tracking-[0.20em] font-medium" style={{ color: bodyColor }}>
          {bodyLabel}
        </p>
        <p className="text-sm font-medium text-white"
          style={{ fontFamily: "var(--font-cormorant), serif", letterSpacing: "0.02em" }}>
          {sign}
        </p>
        <p className="text-[11px] text-slate-500">
          {degree}° · {ELEMENT_LABELS[data.element]}
        </p>
      </div>

      {/* ── Tooltip ── */}
      <AnimatePresence>
        {tipVisible && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={tipClass}
          >
            <div className="rounded-xl px-4 py-3 text-center"
              style={{
                background: "rgba(5,4,14,0.94)",
                border: "0.5px solid rgba(212,175,55,0.30)",
                backdropFilter: "blur(18px)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.60)",
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: "#D4AF37" }}>
                {bodyLabel} w {SIGN_LOCATIVE[sign] ?? sign}
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed italic mb-2.5">
                &ldquo;{bodyDesc}&rdquo;
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">
                {data.description}
              </p>
              <div className="flex flex-wrap justify-center gap-1">
                {data.keywords.map(kw => (
                  <span key={kw} className="text-[9px] px-2 py-0.5 rounded-full"
                    style={{ background: `${data.color}14`, color: data.color, border: `0.5px solid ${data.color}30` }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            {/* Arrow */}
            {tooltipSide === "below" ? (
              <div className={`flex ${tooltipAlign === "left-edge" ? "justify-start pl-6" : tooltipAlign === "right-edge" ? "justify-end pr-6" : "justify-center"} order-first`}>
                <div className="w-2.5 h-2.5 rotate-45 mb-[-5px]"
                  style={{
                    background: "rgba(5,4,14,0.94)",
                    borderLeft: "0.5px solid rgba(212,175,55,0.30)",
                    borderTop:  "0.5px solid rgba(212,175,55,0.30)",
                  }} />
              </div>
            ) : (
              <div className={`flex ${tooltipAlign === "left-edge" ? "justify-start pl-6" : tooltipAlign === "right-edge" ? "justify-end pr-6" : "justify-center"}`}>
                <div className="w-2.5 h-2.5 rotate-45 -mt-[5px]"
                  style={{
                    background:   "rgba(5,4,14,0.94)",
                    borderRight:  "0.5px solid rgba(212,175,55,0.30)",
                    borderBottom: "0.5px solid rgba(212,175,55,0.30)",
                  }} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Axis label helper ────────────────────────────────────────────────────────

const SIGN_GLYPHS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
function axisLabel(lon: number): string {
  const norm = ((lon % 360) + 360) % 360;
  return `${Math.floor(norm % 30)}° ${SIGN_GLYPHS[Math.floor(norm / 30)]}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { chart: NatalChart }

export default function NatalChartAltarView({ chart }: Props) {
  const [focused, setFocused] = useState<FocusTarget>(null);

  const sun  = chart.planets.find(p => p.name === "Słońce");
  const moon = chart.planets.find(p => p.name === "Księżyc");
  if (!sun || !moon) return <NatalChartSVG chart={chart} />;

  const timeUnknown = chart.birthData.timeUnknown;

  const ascNorm      = ((chart.ascendant % 360) + 360) % 360;
  const ascSign      = SIGN_NAMES[Math.floor(ascNorm / 30)];
  const ascDegree    = Math.floor(ascNorm % 30);

  const chartDimmed  = focused !== null && focused !== "chart";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative rounded-3xl"
      style={{
        background: "radial-gradient(ellipse at 50% 20%, rgba(22,16,50,0.60) 0%, rgba(5,4,14,0.92) 100%)",
        border: "0.5px solid rgba(212,175,55,0.20)",
        boxShadow: "0 0 100px rgba(5,4,14,0.70), inset 0 0 120px rgba(88,60,140,0.04)",
      }}
    >
      <SacredGeometry />

      {/* Nebula glow */}
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(88,60,140,0.14) 0%, transparent 70%)", filter: "blur(2px)" }} />

      <div className="relative z-10 px-5 py-7 sm:px-8 sm:py-9">

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-7"
        >
          <p className="text-[10px] uppercase tracking-[0.30em] mb-1"
            style={{ color: "rgba(212,175,55,0.60)" }}>
            Kosmogram Natalny
          </p>
          <h2 className="text-2xl sm:text-3xl font-medium text-white"
            style={{ fontFamily: "var(--font-cormorant), serif", letterSpacing: "0.025em" }}>
            Altar Nieba
          </h2>
          <GoldDivider />
        </motion.header>

        {/* ════════════════════════════════════════════════════
            DESKTOP  — 3-column grid (symmetric cross)
            col: [140px]  [1fr]   [140px]
            row1: [empty]  [Sun]   [empty]
            row2: [ASC  ]  [Chart] [Moon ]
        ════════════════════════════════════════════════════ */}
        <div
          className="hidden sm:grid"
          style={{
            gridTemplateColumns: "140px minmax(0,1fr) 140px",
            gridTemplateRows: "auto auto",
            columnGap: "24px",
            rowGap: "20px",
            alignItems: "center",
            justifyItems: "center",
          }}
        >
          {/* Col 2, row 1: Słońce — GÓRA (center) */}
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{ gridColumn: 2, gridRow: 1 }}
          >
            <AmuletFlank
              body="sun"
              sign={sun.sign}
              degree={sun.degree}
              focused={focused}
              onFocus={setFocused}
              tooltipAlign="center"
              tooltipSide="below"
            />
          </motion.div>

          {/* Col 1, row 2: ASC — LEWO */}
          {!timeUnknown ? (
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ gridColumn: 1, gridRow: 2 }}
            >
              <AmuletFlank
                body="asc"
                sign={ascSign}
                degree={ascDegree}
                focused={focused}
                onFocus={setFocused}
                tooltipAlign="left-edge"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ gridColumn: 1, gridRow: 2 }}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl text-center"
            >
              <Compass className="w-5 h-5" style={{ color: "rgba(148,163,184,0.30)" }} />
              <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.35)" }}>Ascendent</p>
              <p className="text-[10px] leading-tight" style={{ color: "rgba(148,163,184,0.45)" }}>Nieznana godzina urodzenia</p>
            </motion.div>
          )}

          {/* Col 2, row 2: Chart — ŚRODEK */}
          <motion.div
            initial={{ opacity: 0, scale: 0.90 }}
            className="w-full cursor-pointer"
            animate={{ opacity: chartDimmed ? 0.50 : 1, scale: chartDimmed ? 0.97 : 1 }}
            transition={{ delay: focused ? 0 : 0.10, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ gridColumn: 2, gridRow: 2 }}
            onHoverStart={() => setFocused("chart")}
            onHoverEnd={() => setFocused(null)}
          >
            <motion.div
              animate={{
                filter: focused === "chart"
                  ? "drop-shadow(0 0 28px rgba(212,175,55,0.18))"
                  : "drop-shadow(0 0 0px transparent)",
              }}
              transition={{ duration: 0.4 }}
            >
              <NatalChartSVG chart={chart} />
            </motion.div>
          </motion.div>

          {/* Col 3, row 2: Księżyc — PRAWO (symetria z ASC) */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ gridColumn: 3, gridRow: 2 }}
          >
            <AmuletFlank
              body="moon"
              sign={moon.sign}
              degree={moon.degree}
              focused={focused}
              onFocus={setFocused}
              tooltipAlign="right-edge"
            />
          </motion.div>
        </div>

        {/* ── MOBILE: Chart → flanks row below ── */}
        <div className="sm:hidden space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: chartDimmed ? 0.50 : 1, scale: 1 }}
            transition={{ delay: 0.10, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <NatalChartSVG chart={chart} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.30, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start justify-around gap-1 px-1"
          >
            {!timeUnknown && (
              <AmuletFlank body="asc" sign={ascSign} degree={ascDegree}
                focused={focused} onFocus={setFocused} compact />
            )}
            <AmuletFlank body="sun" sign={sun.sign} degree={sun.degree}
              focused={focused} onFocus={setFocused} compact />
            <AmuletFlank body="moon" sign={moon.sign} degree={moon.degree}
              focused={focused} onFocus={setFocused} compact />
          </motion.div>
        </div>

        {/* ── Footer badges ── */}
        <motion.footer
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 flex flex-wrap items-center justify-center gap-2.5"
        >
          {[
            ...(!timeUnknown ? [
              { label: "ASC", value: axisLabel(chart.ascendant), color: "#d6b07d" },
              { label: "MC",  value: axisLabel(chart.mc),        color: "#fbbf24" },
            ] : []),
            { label: "Słońce",  value: `${sun.degree}° ${sun.sign}`,   color: "#f59e0b" },
            { label: "Księżyc", value: `${moon.degree}° ${moon.sign}`,  color: "#94a3b8" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{ background: `${color}10`, border: `0.5px solid ${color}28` }}>
              <span className="font-semibold tracking-wider text-[10px]" style={{ color }}>{label}</span>
              <span className="text-slate-400 text-[11px]">{value}</span>
            </div>
          ))}
        </motion.footer>

      </div>
    </motion.div>
  );
}
