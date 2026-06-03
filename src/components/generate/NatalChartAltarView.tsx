"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { NatalChart } from "@/lib/astro-types";
import NatalChartSVG from "./NatalChartSVG";

// ─── Astrology data ────────────────────────────────────────────────────────

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
  "Baran":      { symbol: "♈", element: "fire",  color: "#ef4444", glow: "rgba(239,68,68,0.38)",    description: "Ogień inicjatywy. Energia przełomu i odwagi.",              keywords: ["inicjatywa", "odwaga", "spontaniczność"] },
  "Byk":        { symbol: "♉", element: "earth", color: "#84cc16", glow: "rgba(132,204,22,0.32)",   description: "Ziemia wytrwałości. Piękno, zmysłowość i budowanie.",         keywords: ["wytrwałość", "zmysłowość", "stabilność"] },
  "Bliźnięta":  { symbol: "♊", element: "air",   color: "#38bdf8", glow: "rgba(56,189,248,0.32)",   description: "Powietrze dialogu. Ciekawość i wielość perspektyw.",           keywords: ["komunikacja", "ciekawość", "adaptacja"] },
  "Rak":        { symbol: "♋", element: "water", color: "#a78bfa", glow: "rgba(167,139,250,0.32)",  description: "Woda intuicji. Głęboka troska i emocjonalna pamięć.",          keywords: ["intuicja", "troska", "dom"] },
  "Lew":        { symbol: "♌", element: "fire",  color: "#f59e0b", glow: "rgba(245,158,11,0.38)",   description: "Ogień serca. Królewska ekspresja i twórcza siła.",             keywords: ["ekspresja", "twórczość", "lojalność"] },
  "Panna":      { symbol: "♍", element: "earth", color: "#86efac", glow: "rgba(134,239,172,0.30)",  description: "Ziemia analizy. Precyzja, służba i dążenie do doskonałości.",  keywords: ["analiza", "perfekcja", "służba"] },
  "Waga":       { symbol: "♎", element: "air",   color: "#67e8f9", glow: "rgba(103,232,249,0.30)",  description: "Powietrze harmonii. Równowaga, piękno i sprawiedliwość.",      keywords: ["harmonia", "relacje", "piękno"] },
  "Skorpion":   { symbol: "♏", element: "water", color: "#c084fc", glow: "rgba(192,132,252,0.38)",  description: "Woda transformacji. Głębia, intensywność i odrodzenie.",       keywords: ["transformacja", "głębia", "intensywność"] },
  "Strzelec":   { symbol: "♐", element: "fire",  color: "#fb923c", glow: "rgba(251,146,60,0.35)",   description: "Ogień wizji. Filozofia, wolność i poszukiwanie sensu.",         keywords: ["filozofia", "wolność", "ekspansja"] },
  "Koziorożec": { symbol: "♑", element: "earth", color: "#a3a3a3", glow: "rgba(163,163,163,0.30)",  description: "Ziemia ambicji. Dyscyplina, czas i budowanie trwałego.",       keywords: ["ambicja", "dyscyplina", "trwałość"] },
  "Wodnik":     { symbol: "♒", element: "air",   color: "#22d3ee", glow: "rgba(34,211,238,0.32)",   description: "Powietrze przebudzenia. Innowacja, wspólnota i przyszłość.",   keywords: ["innowacja", "humanitaryzm", "oryginalność"] },
  "Ryby":       { symbol: "♓", element: "water", color: "#818cf8", glow: "rgba(129,140,248,0.35)",  description: "Woda duszy. Duchowość, empatia i przekraczanie granic.",        keywords: ["duchowość", "empatia", "intuicja"] },
};

const ELEMENT_LABELS: Record<Element, string> = {
  fire: "Ogień", earth: "Ziemia", air: "Powietrze", water: "Woda",
};

// ─── Sacred geometry SVG ───────────────────────────────────────────────────

function SacredGeometry() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: 0.038 }}
    >
      <circle cx="200" cy="200" r="185" stroke="#D4AF37" strokeWidth="0.4" />
      <circle cx="200" cy="200" r="140" stroke="#D4AF37" strokeWidth="0.3" />
      <circle cx="200" cy="200" r="95"  stroke="#D4AF37" strokeWidth="0.3" />
      <circle cx="200" cy="200" r="50"  stroke="#D4AF37" strokeWidth="0.3" />
      <circle cx="200" cy="200" r="16"  stroke="#D4AF37" strokeWidth="0.45" />
      {/* Hexagram */}
      <polygon points="200,28 352,228 48,228"  stroke="#D4AF37" strokeWidth="0.32" fill="none" />
      <polygon points="200,372 48,172 352,172" stroke="#D4AF37" strokeWidth="0.32" fill="none" />
      {/* Axes */}
      <line x1="200" y1="14"  x2="200" y2="386" stroke="#D4AF37" strokeWidth="0.18" />
      <line x1="14"  y1="200" x2="386" y2="200" stroke="#D4AF37" strokeWidth="0.18" />
      <line x1="48"  y1="48"  x2="352" y2="352" stroke="#D4AF37" strokeWidth="0.14" />
      <line x1="352" y1="48"  x2="48"  y2="352" stroke="#D4AF37" strokeWidth="0.14" />
    </svg>
  );
}

// ─── Zodiac flank graphic (Sun or Moon side panel) ─────────────────────────

type FocusTarget = "sun" | "moon" | "chart" | null;

interface FlankProps {
  body:            "sun" | "moon";
  sign:            string;
  degree:          number;
  focused:         FocusTarget;
  onFocus:         (t: FocusTarget) => void;
}

function ZodiacFlankGraphic({ body, sign, degree, focused, onFocus }: FlankProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const data = SIGNS[sign];

  const isMine    = focused === body;
  const isOther   = focused !== null && focused !== body;
  const isSun     = body === "sun";

  const bodyGlyph = isSun ? "☉" : "☽";
  const bodyColor = isSun ? "#f59e0b" : "#94a3b8";
  const bodyLabel = isSun ? "Słońce" : "Księżyc";
  const bodyDesc  = isSun
    ? "Twoje Słońce definiuje tożsamość, wolę i drogę wyrażania siebie w świecie."
    : "Twój Księżyc kryje emocjonalne sanktuarium i najgłębsze potrzeby duszy.";

  if (!data) return null;

  return (
    <motion.div
      className="flex flex-col items-center gap-4 cursor-pointer select-none"
      animate={{
        opacity: isOther ? 0.35 : 1,
        y:       isMine  ? -8   : 0,
        scale:   isMine  ? 1.05 : 1,
      }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => { onFocus(body); setTooltipVisible(true); }}
      onHoverEnd={()   => { onFocus(null); setTooltipVisible(false); }}
    >
      {/* Circular frame */}
      <div className="relative">
        {/* Outer dashed ring (slow rotation when focused) */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: "-10px",
            border: `0.5px dashed ${data.color}22`,
          }}
          animate={{ rotate: isMine ? 360 : 0 }}
          transition={isMine
            ? { duration: 18, ease: "linear", repeat: Infinity }
            : { duration: 1.2, ease: "easeOut" }
          }
        />

        {/* Main circle */}
        <motion.div
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center relative overflow-hidden"
          animate={{
            boxShadow: isMine
              ? `0 0 45px ${data.glow}, 0 0 90px ${data.glow.replace("0.38", "0.14")}`
              : `0 0 18px ${data.glow.replace("0.38", "0.20")}, 0 0 36px ${data.glow.replace("0.38", "0.06")}`,
            borderColor: isMine ? `${data.color}70` : `${data.color}30`,
          }}
          transition={{ duration: 0.5 }}
          style={{
            background: "radial-gradient(circle at 35% 30%, rgba(18,12,40,0.92) 0%, rgba(5,4,14,0.98) 100%)",
            border: "0.5px solid",
          }}
        >
          {/* Inset breathing glow */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{
              boxShadow: [
                `inset 0 0 20px ${data.glow.replace("0.38", "0.12")}`,
                `inset 0 0 42px ${data.glow.replace("0.38", "0.28")}`,
                `inset 0 0 20px ${data.glow.replace("0.38", "0.12")}`,
              ],
            }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Zodiac symbol */}
          <span
            className="relative z-10 text-4xl sm:text-5xl leading-none"
            style={{
              fontFamily: "serif",
              color: data.color,
              filter: `drop-shadow(0 0 14px ${data.glow}) drop-shadow(0 0 4px ${data.color}55)`,
            }}
          >
            {data.symbol}
          </span>

          {/* Sun / Moon indicator */}
          <span
            className="absolute top-2 right-2 text-sm leading-none"
            style={{
              fontFamily: "serif",
              color: bodyColor,
              filter: `drop-shadow(0 0 6px ${bodyColor}80)`,
            }}
          >
            {bodyGlyph}
          </span>
        </motion.div>
      </div>

      {/* Labels */}
      <div className="text-center space-y-0.5">
        <p className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: bodyColor }}>
          {bodyLabel}
        </p>
        <p
          className="text-sm font-medium text-white"
          style={{ fontFamily: "var(--font-cormorant), serif", letterSpacing: "0.02em" }}
        >
          {sign}
        </p>
        <p className="text-[11px] text-slate-500">
          {degree}° · {ELEMENT_LABELS[data.element]}
        </p>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltipVisible && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute bottom-full mb-3 z-50 w-56 pointer-events-none left-1/2 -translate-x-1/2"
          >
            <div
              className="rounded-xl px-4 py-3 text-center"
              style={{
                background: "rgba(5,4,14,0.94)",
                border: "0.5px solid rgba(212,175,55,0.30)",
                backdropFilter: "blur(18px)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: "#D4AF37" }}>
                {bodyLabel} w {sign}
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed italic mb-2.5">
                &ldquo;{bodyDesc}&rdquo;
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">
                {data.description}
              </p>
              <div className="flex flex-wrap justify-center gap-1">
                {data.keywords.map(kw => (
                  <span
                    key={kw}
                    className="text-[9px] px-2 py-0.5 rounded-full"
                    style={{
                      background: `${data.color}14`,
                      color: data.color,
                      border: `0.5px solid ${data.color}30`,
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            {/* Arrow */}
            <div className="flex justify-center">
              <div
                className="w-2.5 h-2.5 rotate-45 -mt-[5px]"
                style={{
                  background: "rgba(5,4,14,0.94)",
                  borderRight: "0.5px solid rgba(212,175,55,0.30)",
                  borderBottom: "0.5px solid rgba(212,175,55,0.30)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Axis badge ───────────────────────────────────────────────────────────

const SIGNS_ABBR = ["Bar","Byk","Bli","Rak","Lew","Pan","Wag","Sko","Str","Koz","Wod","Ryb"];

function axisLabel(lon: number): string {
  const norm = ((lon % 360) + 360) % 360;
  const idx  = Math.floor(norm / 30);
  const deg  = Math.floor(norm % 30);
  return `${deg}° ${SIGNS_ABBR[idx]}`;
}

// ─── Gold divider ─────────────────────────────────────────────────────────

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

// ─── Main component ────────────────────────────────────────────────────────

interface Props { chart: NatalChart }

export default function NatalChartAltarView({ chart }: Props) {
  const [focused, setFocused] = useState<FocusTarget>(null);

  const sun  = chart.planets.find(p => p.name === "Słońce");
  const moon = chart.planets.find(p => p.name === "Księżyc");

  if (!sun || !moon) return <NatalChartSVG chart={chart} />;

  const chartDimmed = focused !== null && focused !== "chart";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative rounded-3xl overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 20%, rgba(22,16,50,0.65) 0%, rgba(5,4,14,0.92) 100%)",
        border: "0.5px solid rgba(212,175,55,0.20)",
        boxShadow:
          "0 0 100px rgba(5,4,14,0.70), inset 0 0 120px rgba(88,60,140,0.05)",
      }}
    >
      {/* Sacred geometry backdrop */}
      <SacredGeometry />

      {/* Ambient nebula top-center glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[220px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(88,60,140,0.14) 0%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <p
            className="text-[10px] uppercase tracking-[0.30em] mb-1"
            style={{ color: "rgba(212,175,55,0.60)" }}
          >
            Kosmogram Natalny
          </p>
          <h2
            className="text-2xl sm:text-3xl font-medium text-white"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              letterSpacing: "0.025em",
            }}
          >
            Altar Nieba
          </h2>
          <GoldDivider />
        </motion.header>

        {/* ── Altar three-column ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-6 lg:gap-14">

          {/* Sun — LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.30, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex-shrink-0"
          >
            <ZodiacFlankGraphic
              body="sun"
              sign={sun.sign}
              degree={sun.degree}
              focused={focused}
              onFocus={setFocused}
            />
          </motion.div>

          {/* Chart — CENTER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            className="flex-1 min-w-0 max-w-[360px] sm:max-w-none w-full cursor-pointer"
            animate={{
              opacity: chartDimmed ? 0.55 : 1,
              scale:   chartDimmed ? 0.97 : 1,
            }}
            transition={{ delay: focused ? 0 : 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onHoverStart={() => setFocused("chart")}
            onHoverEnd={()  => setFocused(null)}
          >
            {/* Subtle glow ring around chart on focus */}
            <motion.div
              className="relative rounded-full"
              animate={{
                boxShadow: focused === "chart"
                  ? "0 0 50px rgba(212,175,55,0.18), 0 0 100px rgba(212,175,55,0.06)"
                  : "0 0 0px transparent",
              }}
              transition={{ duration: 0.4 }}
            >
              <NatalChartSVG chart={chart} />
            </motion.div>
          </motion.div>

          {/* Moon — RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.30, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex-shrink-0"
          >
            <ZodiacFlankGraphic
              body="moon"
              sign={moon.sign}
              degree={moon.degree}
              focused={focused}
              onFocus={setFocused}
            />
          </motion.div>
        </div>

        {/* ── Footer badges ── */}
        <motion.footer
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { label: "ASC", value: axisLabel(chart.ascendant), color: "#d6b07d" },
            { label: "MC",  value: axisLabel(chart.mc),        color: "#fbbf24" },
            { label: "Słońce",  value: `${sun.degree}° ${sun.sign}`,  color: "#f59e0b" },
            { label: "Księżyc", value: `${moon.degree}° ${moon.sign}`, color: "#94a3b8" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{
                background: `${color}10`,
                border: `0.5px solid ${color}30`,
              }}
            >
              <span className="font-semibold tracking-wider text-[10px]" style={{ color }}>
                {label}
              </span>
              <span className="text-slate-400 text-[11px]">{value}</span>
            </div>
          ))}
        </motion.footer>

        {/* Interaction hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-center text-[10px] text-slate-600 mt-4"
        >
          Najedź na symbol, aby odczytać jego energię
        </motion.p>
      </div>
    </motion.div>
  );
}
