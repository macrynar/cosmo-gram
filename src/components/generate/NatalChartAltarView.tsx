"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import type { NatalChart } from "@/lib/astro-types";
import { SIGN_LOCATIVE } from "@/lib/i18n/astro";
import {
  ZodiacGlyph, ElementGlyph, SIGN_ELEMENT, portraitSrc, signIndexFromLon,
} from "@/components/astro/zodiacGlyphs";
import NatalChartSVG from "./NatalChartSVG";

const SIGN_NAMES = [
  "Baran", "Byk", "Bliźnięta", "Rak", "Lew", "Panna",
  "Waga", "Skorpion", "Strzelec", "Koziorożec", "Wodnik", "Ryby",
];

const EASE = [0.22, 1, 0.36, 1] as const;

// Opis + słowa kluczowe znaku (do tooltipa hover) — kolory zawsze z tokenów.
const SIGN_INFO: Record<string, { desc: string; kw: [string, string, string] }> = {
  "Baran":      { desc: "Ogień inicjatywy. Energia przełomu i odwagi.",              kw: ["inicjatywa", "odwaga", "spontaniczność"] },
  "Byk":        { desc: "Ziemia wytrwałości. Piękno, zmysłowość i budowanie.",        kw: ["wytrwałość", "zmysłowość", "stabilność"] },
  "Bliźnięta":  { desc: "Powietrze dialogu. Ciekawość i wielość perspektyw.",         kw: ["komunikacja", "ciekawość", "adaptacja"] },
  "Rak":        { desc: "Woda intuicji. Głęboka troska i emocjonalna pamięć.",        kw: ["intuicja", "troska", "dom"] },
  "Lew":        { desc: "Ogień serca. Królewska ekspresja i twórcza siła.",           kw: ["ekspresja", "twórczość", "lojalność"] },
  "Panna":      { desc: "Ziemia analizy. Precyzja, służba i dążenie do doskonałości.", kw: ["analiza", "perfekcja", "służba"] },
  "Waga":       { desc: "Powietrze harmonii. Równowaga, piękno i sprawiedliwość.",     kw: ["harmonia", "relacje", "piękno"] },
  "Skorpion":   { desc: "Woda transformacji. Głębia, intensywność i odrodzenie.",      kw: ["transformacja", "głębia", "intensywność"] },
  "Strzelec":   { desc: "Ogień wizji. Filozofia, wolność i poszukiwanie sensu.",       kw: ["filozofia", "wolność", "ekspansja"] },
  "Koziorożec": { desc: "Ziemia ambicji. Dyscyplina, czas i budowanie trwałego.",      kw: ["ambicja", "dyscyplina", "trwałość"] },
  "Wodnik":     { desc: "Powietrze przebudzenia. Innowacja, wspólnota i przyszłość.",  kw: ["innowacja", "humanitaryzm", "oryginalność"] },
  "Ryby":       { desc: "Woda duszy. Duchowość, empatia i przekraczanie granic.",       kw: ["duchowość", "empatia", "intuicja"] },
};

type Body = "sun" | "asc" | "moon";
const BODY_EYEBROW: Record<Body, string> = { sun: "SŁOŃCE", asc: "ASCENDENT", moon: "KSIĘŻYC" };
const BODY_NAME: Record<Body, string> = { sun: "Słońce", asc: "Ascendent", moon: "Księżyc" };
const BODY_DESC: Record<Body, string> = {
  sun:  "Twoje Słońce definiuje tożsamość, wolę i drogę wyrażania siebie w świecie.",
  asc:  "Twój Ascendent to maska, którą pokazujesz światu — pierwsze wrażenie i instynktowna reakcja.",
  moon: "Twój Księżyc kryje emocjonalne sanktuarium i najgłębsze potrzeby duszy.",
};

// ─── Złoty separator ──────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-2.5 my-2">
      <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(to right, transparent, rgba(224,181,102,0.45))" }} />
      <div className="w-1 h-1 rounded-full" style={{ background: "var(--accent-deep)" }} />
      <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(to left, transparent, rgba(224,181,102,0.45))" }} />
    </div>
  );
}

// ─── Karta portretu (Słońce / ASC / Księżyc) ───────────────────────────────────

interface PortraitCardProps {
  body: Body;
  sign: string;
  degree: number;
  tipSide?: "above" | "below";
  onScroll?: () => void;
  // Mobile: tap toggles a shared inline panel instead of hovering a floating tooltip.
  mode?: "hover" | "tap";
  active?: boolean;
  onTap?: () => void;
}

function PortraitCard({ body, sign, degree, tipSide = "below", onScroll, mode = "hover", active = false, onTap }: PortraitCardProps) {
  const [tip, setTip] = useState(false);
  const element = SIGN_ELEMENT[sign] ?? "";
  const info = SIGN_INFO[sign];
  const isTap = mode === "tap";
  return (
    <div className="p3-wrap"
      onMouseEnter={isTap ? undefined : () => setTip(true)}
      onMouseLeave={isTap ? undefined : () => setTip(false)}>
      <button type="button"
        onClick={isTap ? onTap : onScroll}
        onFocus={isTap ? undefined : () => setTip(true)}
        onBlur={isTap ? undefined : () => setTip(false)}
        className={`p3-card group block w-full text-center${active ? " p3-card-active" : ""}`}
        aria-expanded={isTap ? active : undefined}
        aria-label={isTap
          ? `${BODY_EYEBROW[body]} w znaku ${sign}, ${degree} stopni — pokaż opis`
          : `${BODY_EYEBROW[body]} w znaku ${sign}, ${degree} stopni — przejdź do interpretacji`}>
        <div className="p3-portrait relative w-full aspect-square overflow-hidden rounded-xl">
          <Image src={portraitSrc(sign)} alt={`Portret znaku ${sign}`} fill
            sizes="(max-width: 640px) 30vw, 200px" style={{ objectFit: "cover" }} />
        </div>
        <div className="p3-eyebrow">{BODY_EYEBROW[body]}</div>
        <div className="p3-sign">{sign}</div>
        <div className="p3-meta">
          {degree}° ·{" "}
          <ElementGlyph element={element} size={13}
            style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 2 }} />
          {element}
        </div>
      </button>

      {/* Desktop floating tooltip (hover/focus). Mobile uses the inline panel below the row. */}
      {!isTap && info && (
        <div className={`p3-tip ${tipSide}`} role="tooltip"
          style={{ opacity: tip ? 1 : 0, visibility: tip ? "visible" : "hidden",
            transform: tip ? "translateY(0)" : `translateY(${tipSide === "below" ? "-4px" : "4px"})` }}>
          <p className="p3-tip-eyebrow">{BODY_NAME[body]} w {SIGN_LOCATIVE[sign] ?? sign}</p>
          <p className="p3-tip-quote">„{BODY_DESC[body]}”</p>
          <p className="p3-tip-desc">{info.desc}</p>
          <div className="p3-tip-kw">{info.kw.map(k => <span key={k}>{k}</span>)}</div>
        </div>
      )}
    </div>
  );
}

// Mobile-only: full-width detail panel shown under the three cards when one is tapped.
// Avoids the clipped floating tooltip and the accidental scroll-to-interpretation.
function MobileSignDetail({ body, sign }: { body: Body; sign: string }) {
  const info = SIGN_INFO[sign];
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.24, ease: EASE }}
      className="p3-mobile-panel"
      role="region"
    >
      <p className="p3-tip-eyebrow">{BODY_NAME[body]} w {SIGN_LOCATIVE[sign] ?? sign}</p>
      <p className="p3-tip-quote">„{BODY_DESC[body]}”</p>
      {info && <p className="p3-tip-desc">{info.desc}</p>}
      {info && <div className="p3-tip-kw">{info.kw.map(k => <span key={k}>{k}</span>)}</div>}
    </motion.div>
  );
}

function AscUnknownCard() {
  return (
    <div className="p3-card-static w-full text-center flex flex-col items-center justify-center"
      style={{ minHeight: 180 }}>
      <div className="p3-eyebrow" style={{ marginTop: 0 }}>ASCENDENT</div>
      <p className="text-[11px] leading-tight px-3" style={{ color: "var(--text-muted)" }}>
        Nieznana godzina urodzenia — bez Ascendentu, MC i domów.
      </p>
    </div>
  );
}

// ─── Chip osi/luminarza ─────────────────────────────────────────────────────

function AxisChip({ label, sign, degree }: { label: string; sign: string; degree: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--line)" }}>
      <ZodiacGlyph sign={sign} size={14} style={{ color: "var(--accent-deep)" }} />
      <span className="font-semibold tracking-wider text-[10px]" style={{ color: "var(--accent-deep)" }}>{label}</span>
      <span className="text-[11px]" style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
        {degree}° {sign}
      </span>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

interface Props { chart: NatalChart }

export default function NatalChartAltarView({ chart }: Props) {
  const rm = useReducedMotion();
  const [mobileTip, setMobileTip] = useState<Body | null>(null);
  const sun = chart.planets.find(p => p.name === "Słońce");
  const moon = chart.planets.find(p => p.name === "Księżyc");
  if (!sun || !moon) return <NatalChartSVG chart={chart} />;

  const timeUnknown = chart.birthData.timeUnknown;
  const ascNorm = ((chart.ascendant % 360) + 360) % 360;
  const ascSign = SIGN_NAMES[signIndexFromLon(ascNorm)];
  const ascDegree = Math.floor(ascNorm % 30);
  const mcNorm = ((chart.mc % 360) + 360) % 360;
  const mcSign = SIGN_NAMES[signIndexFromLon(mcNorm)];
  const mcDegree = Math.floor(mcNorm % 30);

  const scrollToInterpretation = () =>
    document.getElementById("interpretacja")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const toggleMobileTip = (b: Body) => setMobileTip(prev => (prev === b ? null : b));
  const mobileTipSign: Record<Body, string> = { asc: ascSign, sun: sun.sign, moon: moon.sign };

  const enter = (delay: number, axis: "x" | "y" = "y", from = 16) =>
    rm
      ? { initial: false as const }
      : { initial: { opacity: 0, [axis]: from }, animate: { opacity: 1, [axis]: 0 },
          transition: { delay, duration: 0.6, ease: EASE } };

  return (
    <div className="relative rounded-3xl"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, rgba(26,21,48,0.55) 0%, var(--bg-base) 70%)",
        border: "1px solid var(--line)",
      }}>
      {/* ambient aurora — ledwo widoczna, pod treścią (zaokrąglona, nie przycina tooltipów) */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{
        borderRadius: 24,
        background:
          "radial-gradient(80% 60% at 70% 12%, rgba(94,72,162,0.18) 0%, transparent 60%), radial-gradient(60% 50% at 18% 85%, rgba(38,99,138,0.12) 0%, transparent 60%)",
      }} />

      <div className="relative z-10 px-5 py-7 sm:px-8 sm:py-9">


        {/* ════ DESKTOP — krzyż: Słońce góra, ASC lewo, koło środek, Księżyc prawo ════ */}
        <div className="hidden sm:grid" style={{
          gridTemplateColumns: "176px minmax(0,1fr) 176px",
          gridTemplateRows: "auto auto", columnGap: 28, rowGap: 24, alignItems: "center", justifyItems: "center",
        }}>
          <motion.div {...enter(0.22, "y", -16)} style={{ gridColumn: 2, gridRow: 1, width: 176 }}>
            <PortraitCard body="sun" sign={sun.sign} degree={sun.degree} tipSide="below" onScroll={scrollToInterpretation} />
          </motion.div>

          <motion.div {...enter(0.3, "x", -20)} style={{ gridColumn: 1, gridRow: 2, width: 176 }}>
            {!timeUnknown
              ? <PortraitCard body="asc" sign={ascSign} degree={ascDegree} tipSide="above" onScroll={scrollToInterpretation} />
              : <AscUnknownCard />}
          </motion.div>

          <motion.div {...enter(0.12)} className="w-full relative" style={{ gridColumn: 2, gridRow: 2 }}>
            <WheelWithBackdrop chart={chart} />
          </motion.div>

          <motion.div {...enter(0.3, "x", 20)} style={{ gridColumn: 3, gridRow: 2, width: 176 }}>
            <PortraitCard body="moon" sign={moon.sign} degree={moon.degree} tipSide="above" onScroll={scrollToInterpretation} />
          </motion.div>
        </div>

        {/* ════ MOBILE — trzy karty NAD kołem (tap → panel opisu pod rzędem) ════ */}
        <div className="sm:hidden space-y-6">
          <motion.div {...enter(0.18)}>
            <div className="grid grid-cols-3 gap-1.5">
              {!timeUnknown
                ? <PortraitCard body="asc" sign={ascSign} degree={ascDegree} mode="tap" active={mobileTip === "asc"} onTap={() => toggleMobileTip("asc")} />
                : <AscUnknownCard />}
              <PortraitCard body="sun" sign={sun.sign} degree={sun.degree} mode="tap" active={mobileTip === "sun"} onTap={() => toggleMobileTip("sun")} />
              <PortraitCard body="moon" sign={moon.sign} degree={moon.degree} mode="tap" active={mobileTip === "moon"} onTap={() => toggleMobileTip("moon")} />
            </div>
            <AnimatePresence initial={false} mode="wait">
              {mobileTip && !(mobileTip === "asc" && timeUnknown) && (
                <MobileSignDetail key={mobileTip} body={mobileTip} sign={mobileTipSign[mobileTip]} />
              )}
            </AnimatePresence>
          </motion.div>
          <motion.div {...enter(0.28)} className="relative">
            <WheelWithBackdrop chart={chart} />
          </motion.div>
        </div>

        {/* ── Chipy osi/luminarzy ── */}
        <motion.div {...enter(0.5)} className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          {!timeUnknown && <AxisChip label="ASC" sign={ascSign} degree={ascDegree} />}
          {!timeUnknown && <AxisChip label="MC" sign={mcSign} degree={mcDegree} />}
          <AxisChip label="SŁOŃCE" sign={sun.sign} degree={sun.degree} />
          <AxisChip label="KSIĘŻYC" sign={moon.sign} degree={moon.degree} />
        </motion.div>

        {/* ── Microcopy ── */}
        <p className="mt-4 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
          <span className="hidden sm:inline">Najedź na kartę lub planetę po dodatkowe informacje · kliknij planetę po aspekty</span>
          <span className="sm:hidden">Dotknij karty po opis znaku · dotknij planety po aspekty</span>
        </p>
      </div>

      <style>{`
        .p3-wrap { position: relative; }
        .p3-card { cursor: pointer; background: var(--bg-elevated); border: 1px solid var(--line);
          border-radius: 16px; padding: 16px; transition: border-color .25s var(--ease-out), box-shadow .3s var(--ease-out); }
        .p3-card:hover { border-color: var(--accent-deep); box-shadow: 0 0 48px rgba(255,174,61,0.14); }
        .p3-card:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .p3-card-active { border-color: var(--accent-deep) !important; box-shadow: 0 0 32px rgba(255,174,61,0.16); background: rgba(224,181,102,0.07); }
        .p3-portrait { border: 1px solid var(--line-soft); }
        .p3-portrait img { transition: transform .3s var(--ease-out); }
        .p3-card:hover .p3-portrait img { transform: scale(1.02); }
        .p3-eyebrow { margin-top: 14px; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--accent-deep); }
        .p3-sign { margin-top: 5px; font-weight: 600; font-size: 21px; letter-spacing: -.01em; color: var(--text-primary); }
        .p3-meta { margin-top: 3px; font-size: 14px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
        .p3-card-static { background: var(--bg-elevated); border: 1px dashed var(--line); border-radius: 16px; padding: 16px; }

        .p3-tip { position: absolute; left: 50%; margin-left: -120px; width: 240px; z-index: 60;
          pointer-events: none; text-align: center; padding: 14px 16px; border-radius: 14px;
          background: var(--bg-elevated); border: 1px solid var(--line);
          box-shadow: 0 12px 48px rgba(0,0,0,0.55);
          transition: opacity .22s var(--ease-out), transform .22s var(--ease-out); }
        .p3-tip.above { bottom: calc(100% + 12px); }
        .p3-tip.below { top: calc(100% + 12px); }
        .p3-tip-eyebrow { font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: var(--accent-deep); margin-bottom: 8px; }
        .p3-tip-quote { font-family: var(--font-fraunces), serif; font-style: italic; font-size: 13px; line-height: 1.45; color: var(--voice); margin-bottom: 8px; }
        .p3-tip-desc { font-size: 11.5px; line-height: 1.5; color: var(--text-muted); margin-bottom: 10px; }
        .p3-tip-kw { display: flex; flex-wrap: wrap; justify-content: center; gap: 5px; }
        .p3-tip-kw span { font-size: 9.5px; padding: 2px 8px; border-radius: 999px;
          color: var(--accent-deep); border: 1px solid var(--line); background: rgba(224,181,102,0.06); }

        .p3-mobile-panel { margin-top: 12px; text-align: center; padding: 14px 16px; border-radius: 14px;
          background: var(--bg-elevated); border: 1px solid var(--line); box-shadow: 0 8px 32px rgba(0,0,0,0.40); }
        .p3-mobile-panel .p3-tip-desc { margin-bottom: 10px; }

        @media (max-width: 639px) {
          .p3-card { padding: 8px; }
          .p3-eyebrow { font-size: 9px; letter-spacing: .09em; margin-top: 8px; }
          .p3-sign { font-size: 14px; margin-top: 3px; overflow-wrap: break-word; word-break: break-word; }
          .p3-meta { font-size: 11px; margin-top: 2px; }
        }
      `}</style>
    </div>
  );
}

// ─── Koło + tło ──────────────────────────────────────────────────────────────

function WheelWithBackdrop({ chart }: { chart: NatalChart }) {
  return (
    <div className="relative w-full">
      {/* Dekoracyjne tło koła — opcjonalne: brak pliku = znika bez błędu */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/landing/wheel-backdrop.png" alt="" aria-hidden="true"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{
          transform: "translate(-50%, -50%)", width: "92%", maxWidth: 520, aspectRatio: "1",
          borderRadius: "50%", opacity: 0.9, objectFit: "cover",
        }} />
      <div className="relative">
        <NatalChartSVG chart={chart} />
      </div>
    </div>
  );
}
