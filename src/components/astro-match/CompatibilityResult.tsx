"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { CompatibilityResult, CompatibilityCategory } from "@/app/api/astro-match/route";

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
.mx-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; text-align:left; }
@media (max-width:639px) { .mx-grid { grid-template-columns:1fr; } }
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

// ─── 8 module definitions ─────────────────────────────────────────────────────

const MODULE_DEFS = [
  { name: "Komunikacja i zrozumienie",         icon: "◇", keys: ["Komunikacja"] },
  { name: "Przyciąganie i chemia",             icon: "♡", keys: ["Przyciąganie", "Namiętność"] },
  { name: "Więź emocjonalna i bezpieczeństwo", icon: "☾", keys: ["Więź"] },
  { name: "Wartości i wspólny kierunek",       icon: "◈", keys: ["Wartości"] },
  { name: "Niezależność i bliskość",           icon: "✧", keys: ["Niezależność"] },
  { name: "Wyzwania i napięcia",               icon: "✦", keys: ["Wyzwania"] },
  { name: "Trwałość i przyszłość",             icon: "∞", keys: ["Trwałość", "Długoterminowość"] },
  { name: "Przeznaczenie i lekcja",            icon: "✷", keys: ["Przeznaczenie"] },
] as const;

function findCat(categories: CompatibilityCategory[], keys: readonly string[], fullName: string) {
  return categories.find(c =>
    c.name === fullName ||
    keys.some(k => c.name.includes(k))
  ) ?? null;
}

// Split text: first sentence → lead (Fraunces italic), rest → body
function splitLead(text: string): [string, string] {
  const m = text.match(/^([^.!?]+[.!?])\s*/);
  if (!m) return [text, ""];
  return [m[1], text.slice(m[0].length)];
}

// ─── Score count-up ───────────────────────────────────────────────────────────

function useCountUp(target: number, animate: boolean) {
  const [val, setVal] = useState(animate ? 0 : target);
  const rafRef = useRef(0);
  useEffect(() => {
    if (!animate) { setVal(target); return; }
    const start = Date.now();
    const dur = 1200;
    const tick = () => {
      const t = Math.min((Date.now() - start) / dur, 1);
      setVal(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, animate]);
  return val;
}

// ─── Module card ──────────────────────────────────────────────────────────────

function ModuleCard({
  def, cat, locked, onPaywall, delay = 0,
}: {
  def: typeof MODULE_DEFS[number];
  cat: CompatibilityCategory | null;
  locked: boolean;
  onPaywall?: () => void;
  delay?: number;
}) {
  const [lead, body] = cat ? splitLead(cat.interpretation) : ["", ""];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "relative",
        border: "1px solid #2B2540",
        borderRadius: "20px",
        background: "#14101F",
        padding: "22px",
        minHeight: "200px",
        overflow: "hidden",
      }}
    >
      {/* Content — blurred when locked */}
      <div style={locked ? { filter: "blur(7px)", opacity: .5, userSelect: "none", pointerEvents: "none" } : {}}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h3 style={{
            fontSize: "15px", fontWeight: 600, color: "#F4F1EA",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ color: "#E0B566" }}>{def.icon}</span>
            {def.name}
          </h3>
          {cat && (
            <span style={{ fontSize: "13px", color: "#877FA0", whiteSpace: "nowrap" }}>
              <b style={{ color: "#E0B566", fontSize: "16px", fontVariantNumeric: "tabular-nums" }}>{cat.score}</b>/100
            </span>
          )}
        </div>

        {/* Score bar */}
        {cat && (
          <div style={{
            height: "6px", borderRadius: "999px",
            background: "rgba(182,175,198,.08)",
            marginBottom: "16px", overflow: "hidden",
          }}>
            <motion.div
              style={{
                height: "100%", borderRadius: "999px",
                background: "linear-gradient(to right,rgba(224,181,102,.6),#FFAE3D)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${cat.score}%` }}
              transition={{ delay: delay + 0.2, duration: 0.7, ease: "easeOut" }}
            />
          </div>
        )}

        {/* Lead — Fraunces italic */}
        {lead && (
          <p style={{
            fontFamily: "'Fraunces', serif", fontStyle: "italic",
            fontSize: "15px", color: "#E9DCC0",
            lineHeight: 1.55, marginBottom: "10px",
          }}>
            {lead}
          </p>
        )}

        {/* Body */}
        {body && (
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: "#B6AFC6" }}>{body}</p>
        )}

        {/* Fallback when no cat data */}
        {!cat && (
          <p style={{ fontSize: "14px", color: "#B6AFC6", fontStyle: "italic" }}>
            Analiza dostępna po wygenerowaniu nowego matcha.
          </p>
        )}

        {/* Insight */}
        {cat?.insight && (
          <div style={{
            marginTop: "12px", fontSize: "13px", lineHeight: 1.55,
            color: "#E0B566", borderTop: "1px solid #2B2540", paddingTop: "12px",
          }}>
            → {cat.insight}
          </div>
        )}
      </div>

      {/* Lock overlay */}
      {locked && (
        <div
          onClick={onPaywall}
          style={{
            position: "absolute", inset: 0, cursor: "pointer",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "8px",
          }}
        >
          <div style={{
            width: "42px", height: "42px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid #2B2540", background: "rgba(224,181,102,.08)",
          }}>
            <Lock size={18} style={{ color: "#E0B566" }} />
          </div>
          <b style={{ fontSize: "15px", fontWeight: 600, color: "#F4F1EA", textAlign: "center", padding: "0 16px" }}>
            {def.name}
          </b>
          <span style={{ fontSize: "12.5px", color: "#877FA0" }}>Dostępne w planie Plus</span>
          <button
            onClick={e => { e.stopPropagation(); onPaywall?.(); }}
            style={{
              marginTop: "6px", padding: "8px 18px",
              borderRadius: "999px", border: "1px solid #E0B566",
              color: "#E9DCC0", fontSize: "13px",
              background: "transparent", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Odblokuj →
          </button>
        </div>
      )}
    </motion.div>
  );
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
};

export default function CompatibilityResultView({
  result, person1Name, person2Name,
  isPremiumUser = false, onPaywall,
  animate = true, selectedMatchId, onShare,
}: Props) {
  const tier    = tierFor(result.overallScore);
  const label1  = person1Name || "Osoba 1";
  const label2  = person2Name || "Osoba 2";
  const summary = result.summary || TIER_SUMMARY[tier.label] || "";
  const score   = useCountUp(result.overallScore, animate);

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
          position: "relative", width: "min(420px,86vw)",
          aspectRatio: "1", margin: "0 auto 14px",
        }}>
          {/* Background graphic */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={tier.img}
              className="mx-img"
              src={tier.img}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%", opacity: .92 }}
            />
          </div>
          {/* Ring 1 */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="mx-ring1" style={{
              position: "absolute", width: "70%", height: "70%",
              borderRadius: "50%", border: "1px solid rgba(224,181,102,.16)",
            }} />
          </div>
          {/* Ring 2 */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="mx-ring2" style={{
              position: "absolute", width: "54%", height: "54%",
              borderRadius: "50%", border: "1px dashed rgba(43,37,64,.9)",
            }} />
          </div>
          {/* Orbit 1 */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="mx-orb1" style={{ position: "absolute", width: "84%", height: "84%", borderRadius: "50%" }}>
              <b style={{
                position: "absolute", top: "-4px", left: "50%",
                width: "8px", height: "8px", marginLeft: "-4px",
                borderRadius: "50%", background: tier.bond,
                boxShadow: `0 0 12px 2px ${tier.bond}`, display: "block",
              }} />
            </div>
          </div>
          {/* Orbit 2 */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="mx-orb2" style={{ position: "absolute", width: "64%", height: "64%", borderRadius: "50%" }}>
              <b style={{
                position: "absolute", top: "-3px", left: "50%",
                width: "6px", height: "6px", marginLeft: "-3px",
                borderRadius: "50%", background: tier.bond,
                boxShadow: `0 0 8px 1px ${tier.bond}`, display: "block",
              }} />
            </div>
          </div>
          {/* Scrim */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            width: "64%", height: "64%", transform: "translate(-50%,-50%)",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(11,9,18,.82) 0, rgba(11,9,18,.45) 48%, transparent 70%)",
          }} />
          {/* Score */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%,-50%)", textAlign: "center",
          }}>
            <div style={{
              fontSize: "64px", fontWeight: 700, lineHeight: 1,
              letterSpacing: "-.02em", color: "#F4F1EA",
              fontVariantNumeric: "tabular-nums",
            }}>
              {score}
            </div>
            <div style={{ fontSize: "14px", color: "#877FA0", marginTop: "2px" }}>/ 100</div>
          </div>
        </div>

        {/* Tier label */}
        <div style={{
          fontFamily: "'Fraunces', serif", fontStyle: "italic",
          fontSize: "22px", color: "#E9DCC0", margin: "8px 0 14px",
        }}>
          {tier.label}
        </div>

        {/* Summary */}
        <p style={{ maxWidth: "620px", margin: "0 auto 26px", color: "#B6AFC6", fontSize: "15.5px", lineHeight: 1.7 }}>
          {summary}
        </p>

        {/* ── 8 module cards ── */}
        <div className="mx-grid">
          {MODULE_DEFS.map((def, i) => {
            const cat    = findCat(result.categories, def.keys, def.name);
            const isFirst = i === 0;
            const locked  = !isFirst && !isPremiumUser;
            return (
              <ModuleCard
                key={def.name}
                def={def}
                cat={cat}
                locked={locked}
                onPaywall={onPaywall}
                delay={animate ? 0.05 + i * 0.06 : 0}
              />
            );
          })}
        </div>

        {/* ── Paywall ── */}
        {!isPremiumUser && (
          <motion.div
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.4 }}
            style={{
              marginTop: "26px", border: "1px solid #2B2540", borderRadius: "20px",
              padding: "24px", textAlign: "center",
              background: "radial-gradient(ellipse at 50% 0%, rgba(94,72,162,.12), transparent 70%), #14101F",
            }}
          >
            <p style={{ color: "#B6AFC6", fontSize: "15px", marginBottom: "16px" }}>
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
        {selectedMatchId && onShare && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
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
          </div>
        )}
      </div>
    </div>
  );
}
