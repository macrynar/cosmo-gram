"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, Flame, Moon, Compass, Feather, Swords, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import type { CompatibilityResult, CompatibilityCategory } from "@/app/api/astro-match/route";
import SynastryWheel, { SynastryLegend, PLANET_SYMBOL, ASPECT_TYPE_LABEL } from "@/components/match/SynastryWheel";
import ModuleCard from "@/components/generate/ModuleCard";
import ModuleNav from "@/components/generate/ModuleNav";
import type { AstroModule, ModuleId } from "@/lib/schemas/astroModule";

// ─── CSS animations (injected via style tag — bypasses Turbopack CSS class issues) ──

const MATCH_STYLES = `
@keyframes mx-spin    { to { transform: rotate(360deg); } }
@keyframes mx-spinr   { to { transform: rotate(-360deg); } }
@keyframes mx-breathe { 0%,100% { transform:scale(1); } 50% { transform:scale(1.04); } }
.mx-img   { animation: mx-spin 160s linear infinite, mx-breathe 9s ease-in-out infinite; transition: opacity .5s; }
.mx-ring1 { animation: mx-spin 70s linear infinite; }
.mx-ring2 { animation: mx-spinr 95s linear infinite; }
.mx-orb1  { animation: mx-spin 30s linear infinite; }
.mx-orb2  { animation: mx-spinr 44s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .mx-img,.mx-ring1,.mx-ring2,.mx-orb1,.mx-orb2 { animation: none!important; }
}
.mx-hf    { animation: mx-spin 200s linear infinite, mx-breathe 12s ease-in-out infinite; }
.mx-hfglow{ animation: mx-breathe 7s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .mx-hf,.mx-hfglow { animation: none!important; }
}
`;

// ─── Tier mapping ─────────────────────────────────────────────────────────────

const TIERS = [
  { min: 90, label: "Splecione gwiazdy",  img: "/assets/match/bond-90-splecione.png",   bond: "#E0B566" },
  { min: 75, label: "Silne przyciąganie", img: "/assets/match/bond-75-przyciaganie.png", bond: "#E0B566" },
  { min: 60, label: "Rosnąca więź",       img: "/assets/match/bond-60-rosnaca.png",      bond: "#E0B566" },
  { min: 45, label: "Nauka przez tarcie", img: "/assets/match/bond-45-tarcie.png",       bond: "#E2654A" },
  { min:  0, label: "Dwa różne nieba",    img: "/assets/match/bond-0-rozne-nieba.png",   bond: "#E2654A" },
];

const TIER_SUMMARY: Record<string, string> = {
  "Splecione gwiazdy":  "Wasza relacja to rzadkie, magnetyczne przyciąganie — dwa nieba, które rozumieją się niemal bez słów.",
  "Silne przyciąganie": "Wasza relacja opiera się na silnym magnetycznym przyciąganiu i głębokim wzajemnym zrozumieniu.",
  "Rosnąca więź":       "Wiele was łączy, reszty trzeba się nauczyć — to więź, która rośnie gdy dacie jej przestrzeń.",
  "Nauka przez tarcie": "Spotkanie przez kontrast — uczycie się siebie nawzajem, czasem pod górę, ale zawsze coś zostaje.",
  "Dwa różne nieba":    "Dwa bardzo różne nieba — przyciąganie miesza się z tarciem, a relacja-lekcja potrafi wiele nauczyć.",
};

function tierFor(score: number) {
  return TIERS.find(t => score >= t.min) ?? TIERS[TIERS.length - 1];
}

// ─── 8 wymiarów = rozdziały (te same komponenty co kosmogram natalny) ───────────

const MODULE_DEFS = [
  { id: "kom",    short: "Komunikacja",  name: "Komunikacja i zrozumienie",         icon: MessageCircle, keys: ["Komunikacja"],                  hook: "Rozmowa, która czasem łączy, czasem mija się o włos" },
  { id: "prz",    short: "Chemia",       name: "Przyciąganie i chemia",             icon: Flame,         keys: ["Przyciąganie", "Namiętność"],   hook: "Magnetyzm, który czujecie, zanim padnie pierwsze słowo" },
  { id: "wiez",   short: "Więź",         name: "Więź emocjonalna i bezpieczeństwo", icon: Moon,          keys: ["Więź"],                         hook: "Poczucie bycia „u siebie” przy drugiej osobie" },
  { id: "wart",   short: "Wartości",     name: "Wartości i wspólny kierunek",       icon: Compass,       keys: ["Wartości"],                     hook: "To, co naprawdę budujecie razem" },
  { id: "niez",   short: "Niezależność", name: "Niezależność i bliskość",           icon: Feather,       keys: ["Niezależność"],                 hook: "Ile wolności, ile „my”" },
  { id: "wyzw",   short: "Wyzwania",     name: "Wyzwania i napięcia",               icon: Swords,        keys: ["Wyzwania"],                     hook: "Punkty zapalne, które uczą najwięcej" },
  { id: "trw",    short: "Trwałość",     name: "Trwałość i przyszłość",             icon: InfinityIcon,  keys: ["Trwałość", "Długoterminowość"], hook: "Co spaja Was na długo" },
  { id: "przezn", short: "Przeznaczenie",name: "Przeznaczenie i lekcja",            icon: Sparkles,      keys: ["Przeznaczenie"],                hook: "Po co się spotkaliście" },
];

const LOCKED_FILLER =
  "Pełna interpretacja Astrei dla tego wymiaru — jak działa między Wami na co dzień, gdzie jest Wasza siła, a gdzie pole do pracy, z konkretnymi wskazówkami opartymi na aspektach Waszej pary.";

function findCat(categories: CompatibilityCategory[], keys: readonly string[], fullName: string) {
  return categories.find(c =>
    c.name === fullName ||
    keys.some(k => c.name.includes(k))
  ) ?? null;
}

// Split text: first sentence → lead (Fraunces italic), rest → body.
// Astrea czasem owija lead w markdownową kursywę (*…* / _…_); cytat renderujemy jako
// czysty tekst, więc markery trzeba zdjąć (inaczej widać gołą gwiazdkę na początku).
function stripEmphasis(s: string): string {
  return s.replace(/^[\s*_]+/, "").replace(/[\s*_]+$/, "");
}

function splitLead(text: string): [string, string] {
  const clean = text.trim();
  const m = clean.match(/^([^.!?]+[.!?])\s*/);
  const rawLead = m ? m[1] : clean;
  let body = m ? clean.slice(m[0].length) : "";
  if (/^[*_]/.test(rawLead)) body = body.replace(/^[\s*_]+/, ""); // osierocony domykający marker
  return [stripEmphasis(rawLead), body];
}

// ─── Score count-up ───────────────────────────────────────────────────────────

function useCountUp(target: number, animate: boolean, startDelay = 0) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    if (!animate) return;            // statycznie zwracamy target — bez setState w efekcie
    const begin = Date.now() + startDelay;
    const dur = 1300;
    const tick = () => {
      const now = Date.now();
      if (now < begin) { rafRef.current = requestAnimationFrame(tick); return; }
      const t = Math.min((now - begin) / dur, 1);
      setVal(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, animate, startDelay]);
  return animate ? val : target;
}

// ─── Particle micro-animation wokół koła (twinkle + orbit) ──────────────────────

type Drift = { a: number; r: number; sp: number; rad: number; tw: number; tws: number; dr: number };
type Orbit = { a: number; r: number; sp: number; rad: number };

function WheelParticles({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try { ctx = cv.getContext("2d"); } catch { /* brak canvas */ }
    if (!ctx) return;
    const c = ctx;
    let raf = 0;
    let dim = { w: 0, h: 0 };

    const size = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, r.width * dpr);
      cv.height = Math.max(1, r.height * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      dim = { w: r.width, h: r.height };
    };
    size();

    const R = () => Math.min(dim.w, dim.h) / 2;
    const cx = () => dim.w / 2, cy = () => dim.h / 2;
    const N = window.matchMedia("(max-width:640px)").matches ? 18 : 32;
    const drift: Drift[] = [], orbit: Orbit[] = [];
    for (let i = 0; i < N; i++) drift.push({
      a: Math.random() * 6.28, r: 0.16 + Math.random() * 0.9,
      sp: (Math.random() * 0.0005 + 0.00015) * (Math.random() < 0.5 ? -1 : 1),
      rad: Math.random() * 1.3 + 0.5, tw: Math.random() * 6.28,
      tws: Math.random() * 0.02 + 0.008, dr: (Math.random() - 0.5) * 0.0007,
    });
    for (let i = 0; i < 6; i++) orbit.push({
      a: Math.random() * 6.28, r: 0.5 + i * 0.082,
      sp: (0.0009 - i * 0.00009) * (i % 2 ? -1 : 1), rad: i < 2 ? 2.2 : 1.6,
    });

    const dot = (x: number, y: number, rd: number, al: number) => {
      c.beginPath();
      c.fillStyle = "rgba(255,201,120," + al + ")";
      c.shadowColor = "rgba(255,174,61,.7)";
      c.shadowBlur = rd * 4;
      c.arc(x, y, rd, 0, 6.2832);
      c.fill();
      c.shadowBlur = 0;
    };

    if (reduce) {
      c.clearRect(0, 0, dim.w, dim.h);
      drift.slice(0, 12).forEach(p => dot(cx() + Math.cos(p.a) * p.r * R(), cy() + Math.sin(p.a) * p.r * R(), p.rad, 0.28));
      return;
    }

    const frame = () => {
      c.clearRect(0, 0, dim.w, dim.h);
      const rr = R();
      drift.forEach(p => {
        p.a += p.sp; p.r += p.dr; if (p.r < 0.15 || p.r > 1.02) p.dr *= -1; p.tw += p.tws;
        const al = (0.16 + Math.abs(Math.sin(p.tw)) * 0.5) * 0.62;
        dot(cx() + Math.cos(p.a) * p.r * rr, cy() + Math.sin(p.a) * p.r * rr, p.rad, al);
      });
      orbit.forEach(p => {
        p.a += p.sp;
        dot(cx() + Math.cos(p.a) * p.r * rr, cy() + Math.sin(p.a) * p.r * rr, p.rad, 0.85);
      });
      raf = requestAnimationFrame(frame);
    };
    frame();

    let t: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => { if (t) clearTimeout(t); t = setTimeout(size, 200); };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      if (t) clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [reduce]);

  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 3, pointerEvents: "none" }} />;
}

// ─── Adapter: wymiar Match → AstroModule (kształt karty natalnej) ───────────────

function meterArchetype(v: number): string {
  if (v >= 80) return "silna strona";
  if (v >= 60) return "solidny fundament";
  if (v >= 45) return "obszar do pracy";
  return "lekcja na teraz";
}

function buildMatchModule(
  def: typeof MODULE_DEFS[number],
  cat: CompatibilityCategory | null,
  isPremium: boolean,
): AstroModule {
  // Free dostaje {name, score} bez treści dla zablokowanych → interpretation jest pusta.
  const hasContent = !!cat?.interpretation;
  const [lead, body] = hasContent ? splitLead(cat!.interpretation) : ["", ""];
  const score = cat?.score ?? 0;
  // cytat (nagłówek rozdziału) — czysty tekst: bez markerów markdown i kropki na końcu
  const quote = (hasContent ? lead || def.hook : def.hook).replace(/[*_]/g, "").replace(/[.…\s]+$/, "");
  const content = hasContent
    ? `${body || lead}${cat!.insight ? `\n\n**→ ${cat!.insight}**` : ""}`
    : LOCKED_FILLER;
  return {
    id:            def.id as ModuleId,
    title:         def.name,
    quote,
    content,
    tactics:       [],
    tags:          [],
    visualMeters:  [{ label: "Zgodność", value: score, archetype: cat ? meterArchetype(score) : "—", category: "emotion" }],
    confidenceScore: 100,
    isPremium,
    cacheKey:      `match-${def.id}`,
    promptVersion: "match-v1",
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

type Props = {
  result:          CompatibilityResult;
  person1Name:     string;
  person2Name:     string;
  isPremiumUser?:  boolean;
  onPaywall?:      () => void;
  animate?:        boolean;
  selectedMatchId?: string | null;
  onShare?:        () => void;
  onNewMatch?:     () => void;
};

export default function CompatibilityResultView({
  result, person1Name, person2Name,
  isPremiumUser = false, onPaywall,
  animate = true, selectedMatchId, onShare,
}: Props) {
  const reduce  = useReducedMotion();
  const anim    = animate && !reduce;       // reduced-motion → stan końcowy bez ruchu
  const tier    = tierFor(result.overallScore);
  const label1  = person1Name || "Osoba 1";
  const label2  = person2Name || "Osoba 2";
  const summary = result.summary || TIER_SUMMARY[tier.label] || "";
  const score   = useCountUp(result.overallScore, anim, anim ? 350 : 0);

  // Realne koło tylko gdy mamy dane (stare zapisy sprzed redesignu → stara dekoracja)
  const hasWheel =
    !!result.aspects?.length &&
    !!result.planetPositions?.a?.length &&
    !!result.planetPositions?.b?.length;

  // Najsilniejszy aspekt (aspekty są posortowane wg importance malejąco)
  const topA = result.aspects?.[0];
  const topAspectLabel = topA
    ? `${PLANET_SYMBOL[topA.planet_a] ?? topA.planet_a} ${topA.planet_a} ↔ ${PLANET_SYMBOL[topA.planet_b] ?? topA.planet_b} ${topA.planet_b} · ${ASPECT_TYPE_LABEL[topA.type] ?? topA.type}`
    : null;

  // 8 wymiarów → moduły w kształcie kart natalnych. Za darmo NAJMOCNIEJSZY wymiar
  // (mocniejszy hook FOMO); pozostałe zablokowane (z widoczną liczbą). Blokada wg
  // pozycji najmocniejszego, nie obecności treści → brak wycieku przy starych zapisach.
  const dimCats  = MODULE_DEFS.map(def => findCat(result.categories, def.keys, def.name));
  const freeIdx  = dimCats.reduce((mi, c, i) => ((c?.score ?? 0) > (dimCats[mi]?.score ?? 0) ? i : mi), 0);
  const matchModules = MODULE_DEFS.map((def, i) => buildMatchModule(def, dimCats[i], i !== freeIdx));
  const allIds     = MODULE_DEFS.map(d => d.id);
  const visibleIds = isPremiumUser ? allIds : [allIds[freeIdx]];
  const shortNames = Object.fromEntries(MODULE_DEFS.map(d => [d.id, d.short]));

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: MATCH_STYLES }} />

      {/* ── Bond hero ── */}
      <div style={{
        position: "relative", border: "1px solid #2B2540", borderRadius: "28px",
        overflow: "hidden", padding: "30px 24px 40px",
        background: "radial-gradient(ellipse at 50% 0%, rgba(26,21,48,.55), #0B0912 72%)",
        textAlign: "center", marginBottom: "0",
      }}>
        <div style={{ fontSize: "11px", letterSpacing: ".3em", textTransform: "uppercase", color: "#877FA0", marginBottom: "4px" }}>
          Kompatybilność
        </div>
        <div style={{ fontSize: "14px", color: "#B6AFC6", marginBottom: "18px" }}>
          <b style={{ color: "#F4F1EA" }}>{label1}</b>
          <span style={{ color: "#E0B566", margin: "0 8px" }}>×</span>
          <b style={{ color: "#F4F1EA" }}>{label2}</b>
        </div>

        {/* ── Bond visual ── */}
        <div style={{
          position: "relative", width: "min(440px,90vw)",
          aspectRatio: "1", margin: "0 auto 6px",
        }}>
          {hasWheel ? (
            <>
              {/* Glow — radialny amber */}
              <div className="mx-hfglow" style={{
                position: "absolute", inset: "-6%", borderRadius: "50%", pointerEvents: "none",
                background: "radial-gradient(circle, rgba(255,174,61,.14) 0, rgba(255,174,61,.05) 42%, transparent 66%)",
              }} />
              {/* Tło więzi (klimat, nie dane) — istniejąca grafika bond-*.png */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={tier.img}
                className="mx-hf"
                src={tier.img}
                alt=""
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                style={{
                  position: "absolute", inset: "3%", width: "94%", height: "94%",
                  objectFit: "cover", borderRadius: "50%", opacity: .5,
                  filter: "saturate(112%)", zIndex: 1,
                }}
              />
              {/* Koło synastrii (bohater) */}
              <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
                <SynastryWheel
                  planetsA={result.planetPositions!.a}
                  planetsB={result.planetPositions!.b}
                  aspects={result.aspects!}
                  nameA={label1}
                  nameB={label2}
                  animate={anim}
                  bare
                />
              </div>
              {/* Particle micro-anim */}
              <WheelParticles reduce={!!reduce} />
              {/* Scrim — czytelność score na liniach */}
              <div style={{
                position: "absolute", left: "50%", top: "50%",
                width: "66%", height: "66%", transform: "translate(-50%,-50%)",
                borderRadius: "50%", pointerEvents: "none", zIndex: 4,
                background: "radial-gradient(circle, rgba(11,9,18,.95) 0, rgba(11,9,18,.72) 38%, rgba(11,9,18,.28) 62%, transparent 80%)",
              }} />
              {/* Score overlay (HTML) */}
              <div style={{
                position: "absolute", left: "50%", top: "50%",
                transform: "translate(-50%,-50%)", textAlign: "center",
                zIndex: 5, pointerEvents: "none",
              }}>
                <div style={{
                  fontSize: "clamp(52px,13vw,68px)", fontWeight: 700, lineHeight: 1,
                  letterSpacing: "-.02em", color: "#fff",
                  fontVariantNumeric: "tabular-nums",
                  textShadow: "0 0 28px rgba(255,174,61,.45)",
                }}>
                  {score}
                </div>
                <div style={{ fontSize: "13px", color: "#877FA0", marginTop: "2px" }}>/ 100</div>
              </div>
            </>
          ) : (
            <>
              {/* Fallback: stare zapisy bez aspects/planetPositions → dekoracja */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={tier.img} className="mx-img" src={tier.img} alt=""
                  style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%", opacity: .92 }} />
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="mx-ring1" style={{ position: "absolute", width: "70%", height: "70%", borderRadius: "50%", border: "1px solid rgba(224,181,102,.16)" }} />
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="mx-ring2" style={{ position: "absolute", width: "54%", height: "54%", borderRadius: "50%", border: "1px dashed rgba(43,37,64,.9)" }} />
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="mx-orb1" style={{ position: "absolute", width: "84%", height: "84%", borderRadius: "50%" }}>
                  <b style={{ position: "absolute", top: "-4px", left: "50%", width: "8px", height: "8px", marginLeft: "-4px", borderRadius: "50%", background: tier.bond, boxShadow: `0 0 12px 2px ${tier.bond}`, display: "block" }} />
                </div>
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="mx-orb2" style={{ position: "absolute", width: "64%", height: "64%", borderRadius: "50%" }}>
                  <b style={{ position: "absolute", top: "-3px", left: "50%", width: "6px", height: "6px", marginLeft: "-3px", borderRadius: "50%", background: tier.bond, boxShadow: `0 0 8px 1px ${tier.bond}`, display: "block" }} />
                </div>
              </div>
              <div style={{ position: "absolute", left: "50%", top: "50%", width: "64%", height: "64%", transform: "translate(-50%,-50%)", borderRadius: "50%", background: "radial-gradient(circle, rgba(11,9,18,.82) 0, rgba(11,9,18,.45) 48%, transparent 70%)" }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <div style={{ fontSize: "64px", fontWeight: 700, lineHeight: 1, letterSpacing: "-.02em", color: "#F4F1EA", fontVariantNumeric: "tabular-nums" }}>{score}</div>
                <div style={{ fontSize: "14px", color: "#877FA0", marginTop: "2px" }}>/ 100</div>
              </div>
            </>
          )}
        </div>

        {/* Legenda (pod kołem) */}
        {hasWheel && (
          <motion.div
            initial={anim ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: anim ? 0.65 : 0, duration: 0.5 }}
            style={{ margin: "6px 0 2px" }}
          >
            <SynastryLegend nameA={label1} nameB={label2} />
          </motion.div>
        )}

        {/* Tier label */}
        <motion.div
          initial={anim ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: anim ? 0.7 : 0, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Fraunces', serif", fontStyle: "italic",
            fontSize: "clamp(20px,4.5vw,24px)", color: "#E9DCC0", margin: "10px 0 8px",
          }}
        >
          {tier.label}
        </motion.div>

        {/* Najsilniejszy aspekt */}
        {topAspectLabel && (
          <motion.div
            initial={anim ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: anim ? 0.9 : 0, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}
          >
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px",
              color: "#E0B566", border: "1px solid #2B2540", background: "rgba(224,181,102,.06)",
              borderRadius: "999px", padding: "6px 14px",
            }}>
              <span style={{ opacity: .7 }}>Wasz najsilniejszy aspekt:</span> {topAspectLabel}
            </span>
          </motion.div>
        )}

        {/* Summary */}
        <motion.p
          initial={anim ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: anim ? 1.05 : 0, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ maxWidth: "620px", margin: "0 auto 26px", color: "#B6AFC6", fontSize: "15.5px", lineHeight: 1.7 }}
        >
          {summary}
        </motion.p>

      </div>{/* ── koniec hero card ── */}

      {/* ── 8 wymiarów = rozdziały (DOKŁADNIE komponenty kosmogramu natalnego) ── */}
      <div style={{ marginTop: "30px" }}>
        <motion.div
          initial={anim ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: anim ? 1.3 : 0, duration: 0.5 }}
          className="text-center mb-2"
        >
          <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "rgba(224,181,102,0.45)" }}>
            8 wymiarów Waszej więzi
          </p>
        </motion.div>

        <ModuleNav visibleIds={visibleIds} allIds={allIds} shortNames={shortNames} />

        <div className="flex flex-col gap-5 max-w-[70ch] mx-auto">
          {matchModules.map((mod, i) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              isPremiumUser={isPremiumUser}
              index={i}
              iconOverride={MODULE_DEFS[i].icon}
              onPaywall={onPaywall}
              lockedScore={dimCats[i]?.score}
            />
          ))}
        </div>
      </div>

      {/* ── Paywall ── */}
      {!isPremiumUser && (
        <motion.div
          initial={anim ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: anim ? 2.1 : 0, duration: 0.4 }}
          style={{
            marginTop: "26px", border: "1px solid #2B2540", borderRadius: "20px",
            padding: "24px", textAlign: "center",
            background: "radial-gradient(ellipse at 50% 0%, rgba(94,72,162,.12), transparent 70%), #14101F",
          }}
        >
          <p style={{ color: "#B6AFC6", fontSize: "15px", marginBottom: "16px", maxWidth: "560px", marginInline: "auto" }}>
            Odblokuj <span style={{ color: "#E9DCC0" }}>7 modułów pełnej analizy synastrii</span> — przyciąganie, więź emocjonalną, wartości, niezależność, wyzwania, przyszłość i przeznaczenie — w planie Plus.
          </p>
          <button
            onClick={onPaywall}
            style={{
              display: "inline-block", padding: "13px 28px", borderRadius: "999px",
              background: "linear-gradient(135deg,#FFC56B 0%,#FFAE3D 45%,#F08F2E 100%)",
              color: "#201405", fontWeight: 600, border: "none",
              cursor: "pointer", boxShadow: "0 0 40px rgba(255,174,61,.18)",
              fontSize: "15px", fontFamily: "inherit",
            }}
          >
            Przejdź na Plus →
          </button>
        </motion.div>
      )}

      {/* ── Share ── */}
      {selectedMatchId && (
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
          {onShare && (
            <button
              onClick={onShare}
              style={{
                display: "inline-flex", gap: "8px", alignItems: "center",
                padding: "11px 22px", borderRadius: "999px",
                border: "1px solid #2B2540", background: "transparent",
                color: "#E9DCC0", fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E0B566"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2B2540"; }}
            >
              ⤴ Udostępnij wynik
            </button>
          )}
        </div>
      )}
    </div>
  );
}
