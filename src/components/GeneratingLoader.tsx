"use client";

import { useEffect, useState } from "react";

// ─── Reusable "AI tworzy interpretację" loader ──────────────────────────────
// Pełny wariant: animowana orbita planet + rotujące opisy czynności.
// Kompaktowy: mały pierścień + rotujący opis (do kart/przycisków).

const DEFAULT_PHRASES = [
  "Odczytuję pozycje planet…",
  "Mierzę kąty między ciałami niebieskimi…",
  "Analizuję aspekty i domy…",
  "Splatam wątki Twojej historii…",
  "Dobieram właściwe słowa…",
];

const LOADER_CSS = `
@keyframes gl-spin   { to { transform: rotate(360deg); } }
@keyframes gl-spinr  { to { transform: rotate(-360deg); } }
@keyframes gl-pulse  { 0%,100% { opacity:.55; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }
@keyframes gl-tw     { 0%,100% { opacity:.2; } 50% { opacity:.9; } }
.gl-ring-1 { animation: gl-spin 9s linear infinite; }
.gl-ring-2 { animation: gl-spinr 14s linear infinite; }
.gl-ring-3 { animation: gl-spin 22s linear infinite; }
.gl-core   { animation: gl-pulse 3.2s ease-in-out infinite; }
.gl-star   { animation: gl-tw 2.4s ease-in-out infinite; }
.gl-spinring { animation: gl-spin 0.9s linear infinite; }
/* transform-only — text stays at opacity 1 even if the animation is throttled/frozen */
@keyframes gl-phrase-in { from { transform: translateY(5px); } to { transform: translateY(0); } }
.gl-phrase { animation: gl-phrase-in 0.35s cubic-bezier(.22,1,.36,1); }
@media (prefers-reduced-motion: reduce) {
  .gl-ring-1,.gl-ring-2,.gl-ring-3,.gl-core,.gl-star,.gl-spinring,.gl-phrase { animation: none !important; }
}
`;

function RotatingPhrase({
  phrases,
  accent,
  size = "sm",
}: {
  phrases: string[];
  accent: string;
  size?: "sm" | "md";
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (phrases.length <= 1) return;
    const t = setInterval(() => setI(v => (v + 1) % phrases.length), 2200);
    return () => clearInterval(t);
  }, [phrases.length]);

  return (
    <div
      style={{
        // min-height reserves space for up to two wrapped lines so nothing is clipped;
        // mode="wait" means only one phrase is mounted at a time, so normal flow is safe.
        minHeight: size === "md" ? "42px" : "34px",
        maxWidth: size === "md" ? "340px" : "260px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-live="polite"
    >
      {/* key remounts the span on each change → re-triggers the CSS fade-in.
          Resting opacity is 1, so the text is always visible (no stuck-at-0 risk). */}
      <span
        key={i}
        className="gl-phrase"
        style={{
          fontSize: size === "md" ? "14px" : "13px",
          lineHeight: 1.35,
          letterSpacing: ".01em",
          color: accent,
          textAlign: "center",
        }}
      >
        {phrases[i]}
      </span>
    </div>
  );
}

export default function GeneratingLoader({
  phrases = DEFAULT_PHRASES,
  accent = "#E0B566",
  variant = "full",
  className,
}: {
  phrases?: string[];
  accent?: string;
  variant?: "full" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <div
        className={className}
        style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}
      >
        <style dangerouslySetInnerHTML={{ __html: LOADER_CSS }} />
        <span
          className="gl-spinring"
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            border: `2px solid ${accent}33`,
            borderTopColor: accent,
            flexShrink: 0,
            display: "inline-block",
          }}
        />
        <RotatingPhrase phrases={phrases} accent={`${accent}cc`} />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "26px",
        padding: "40px 16px",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: LOADER_CSS }} />

      {/* Orbital system */}
      <div style={{ position: "relative", width: "104px", height: "104px" }} aria-hidden="true">
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            inset: "-18px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}26 0%, transparent 68%)`,
          }}
        />
        {/* Rings */}
        {[
          { cls: "gl-ring-1", size: 104, border: `1px dashed ${accent}3a`, dot: true,  dotSize: 7 },
          { cls: "gl-ring-2", size: 74,  border: `1px solid ${accent}26`,  dot: true,  dotSize: 5 },
          { cls: "gl-ring-3", size: 48,  border: `1px solid ${accent}1f`,  dot: false, dotSize: 0 },
        ].map(r => (
          <div
            key={r.cls}
            className={r.cls}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: `${r.size}px`,
              height: `${r.size}px`,
              marginTop: `-${r.size / 2}px`,
              marginLeft: `-${r.size / 2}px`,
              borderRadius: "50%",
              border: r.border,
            }}
          >
            {r.dot && (
              <span
                style={{
                  position: "absolute",
                  top: `-${r.dotSize / 2}px`,
                  left: "50%",
                  marginLeft: `-${r.dotSize / 2}px`,
                  width: `${r.dotSize}px`,
                  height: `${r.dotSize}px`,
                  borderRadius: "50%",
                  background: accent,
                  boxShadow: `0 0 10px 1px ${accent}99`,
                }}
              />
            )}
          </div>
        ))}
        {/* Core */}
        <div
          className="gl-core"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "16px",
            height: "16px",
            marginTop: "-8px",
            marginLeft: "-8px",
            borderRadius: "50%",
            background: `radial-gradient(circle at 38% 32%, #fff6df, ${accent})`,
            boxShadow: `0 0 18px 3px ${accent}88`,
          }}
        />
      </div>

      <RotatingPhrase phrases={phrases} accent={`${accent}d9`} size="md" />
    </div>
  );
}
