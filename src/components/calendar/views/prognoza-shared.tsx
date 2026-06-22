"use client";

/**
 * Prognoza shared components & styles.
 * All CSS is injected via dangerouslySetInnerHTML (Turbopack-safe, pg-* prefix).
 */

import GeneratingLoader from "@/components/GeneratingLoader";
import { orbOpacity, intensityLabel, intensityOrb } from "@/lib/astro/periodWeather";

// ─── Design tokens → CSS string ──────────────────────────────────────────────

export const PROGNOZA_STYLES = `
:root {
  --pg-bg:#0B0912;--pg-elevated:#14101F;--pg-text:#F4F1EA;--pg-sec:#B6AFC6;
  --pg-muted:#877FA0;--pg-accent:#FFAE3D;--pg-deep:#E0B566;--pg-voice:#E9DCC0;
  --pg-line:#2B2540;--pg-tense:#E2654A;--pg-ease:cubic-bezier(.22,1,.36,1);
}

/* ── WEATHER ZONE ── */
.pg-weather {
  position:relative;border:1px solid var(--pg-line);border-radius:22px;overflow:hidden;
  padding:24px;margin-bottom:16px;
  background:radial-gradient(ellipse at 50% 0%,rgba(26,21,48,.5),var(--pg-bg) 75%),var(--pg-elevated);
}
.pg-eyebrow {
  font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--pg-deep);
}
.pg-mood-badge {
  float:right;font-size:11px;letter-spacing:.12em;text-transform:uppercase;
  padding:5px 12px;border-radius:999px;border:1px solid var(--pg-line);
}
.pg-mood-badge.harm { color:var(--pg-deep);background:rgba(224,181,102,.08); }
.pg-mood-badge.tense { color:var(--pg-tense);background:rgba(226,101,74,.08); }
.pg-theme {
  font-family:'Fraunces',serif;font-weight:500;font-size:22px;line-height:1.25;
  color:var(--pg-voice);margin:10px 0 8px;
}
.pg-desc { font-size:13.5px;color:var(--pg-muted);margin:0 0 6px; }
.pg-sub { font-size:13px;color:var(--pg-muted); }
.pg-orb {
  position:absolute;right:-4px;top:50%;margin-top:-112px;width:224px;height:224px;
  border-radius:50%;object-fit:cover;opacity:.6;pointer-events:none;z-index:0;
  mix-blend-mode:screen;
  -webkit-mask-image:radial-gradient(circle,#000 40%,transparent 72%);
  mask-image:radial-gradient(circle,#000 40%,transparent 72%);
  animation:pg-spin 70s linear infinite, pg-pulse 6.5s ease-in-out infinite;
}
/* Gentle breathing — animates the scale property (independent of the spin's
   transform), so motion stays visible even on the symmetric minimal orb. */
@keyframes pg-pulse { 0%,100% { scale:1; } 50% { scale:1.06; } }
.pg-weather > *:not(.pg-orb) { position:relative;z-index:1; }
@keyframes pg-spin { to { transform:rotate(360deg); } }
@media (prefers-reduced-motion:reduce) {
  .pg-orb,.pg-yearbg { animation:none !important; }
}
.pg-spin-ring {
  display:inline-block;width:15px;height:15px;border-radius:50%;
  border:2px solid rgba(224,181,102,.2);border-top-color:var(--pg-deep);
  animation:pg-spin .75s linear infinite;vertical-align:middle;margin-right:8px;flex-shrink:0;
}
.pg-loading-row { display:flex;align-items:center;gap:0;color:var(--pg-muted);font-size:13px; }

.pg-gauge { display:inline-flex;align-items:center;gap:11px;margin-top:16px;position:relative;z-index:1; }
.pg-gauge-label { font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--pg-muted); }
.pg-bars { display:flex;gap:4px; }
.pg-bars i { width:15px;height:6px;border-radius:3px;background:var(--pg-line);transition:.3s var(--pg-ease); }
.pg-bars i.on { background:var(--pg-accent); }
.pg-char { font-size:11px;font-weight:500;color:var(--pg-deep); }

/* ── TIMELINE ZONE ── */
.pg-timeline {
  border:1px solid var(--pg-line);border-radius:22px;padding:22px;margin-bottom:16px;
  background:var(--pg-elevated);
}
.pg-tl-head {
  display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;
}
.pg-tl-head b { font-size:15px;color:var(--pg-text); }
.pg-tl-nav { display:flex;gap:8px; }
.pg-tl-nav button {
  width:30px;height:30px;border-radius:50%;border:1px solid var(--pg-line);
  background:transparent;color:var(--pg-muted);cursor:pointer;
}
.pg-hint { font-size:12px;color:var(--pg-muted);margin-top:12px;text-align:center; }

/* Interpretation CTA — sits inside the forecast module */
.pg-interp-cta { margin-top:18px;padding-top:16px;border-top:1px solid var(--pg-line); }
.pg-interp-btn {
  display:inline-flex;align-items:center;gap:8px;padding:11px 20px;border-radius:12px;
  font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;
  border:1px solid rgba(224,181,102,.40);background:rgba(224,181,102,.06);
  color:var(--pg-deep);transition:.2s var(--pg-ease);
}
.pg-interp-btn:hover { background:rgba(224,181,102,.12);border-color:var(--pg-deep); }
.pg-interp-err { font-size:13px;color:var(--pg-tense);margin-top:10px; }
a.pg-interp-lock { display:block;text-decoration:none; }
a.pg-interp-lock span { display:block;color:var(--pg-sec);font-size:14px;margin-bottom:2px; }
a.pg-interp-lock small { color:var(--pg-muted);font-size:12px; }
a.pg-interp-lock:hover span { color:var(--pg-voice); }

/* Day timeline */
.pg-daytl { position:relative;height:104px;margin-top:4px; }
.pg-daytl .track {
  position:absolute;left:8px;right:8px;top:40px;height:2px;border-radius:2px;
  background:linear-gradient(90deg,rgba(43,37,64,.4),rgba(94,72,162,.35),rgba(255,174,61,.28),rgba(43,37,64,.4));
}
.pg-daytl .now-line {
  position:absolute;top:18px;height:46px;width:2px;background:var(--pg-accent);z-index:2;
}
.pg-daytl .now-line::after {
  content:'teraz';position:absolute;top:-16px;left:50%;transform:translateX(-50%);
  font-size:10px;color:var(--pg-accent);
}
.pg-moment {
  position:absolute;top:23px;transform:translateX(-50%);text-align:center;cursor:default;
}
.pg-moment .disc {
  width:36px;height:36px;border-radius:50%;border:1.5px solid var(--pg-deep);
  background:var(--pg-elevated);display:flex;align-items:center;justify-content:center;
  color:var(--pg-voice);font-size:16px;box-shadow:0 0 14px rgba(224,181,102,.18);
  margin:0 auto;
}
.pg-moment.tense .disc { border-color:var(--pg-tense);box-shadow:0 0 14px rgba(226,101,74,.2); }
.pg-moment .lbl { font-size:10.5px;color:var(--pg-muted);margin-top:7px;white-space:nowrap; }
.pg-moment .lbl b { color:var(--pg-deep); }
.pg-moment.tense .lbl b { color:var(--pg-tense); }
.pg-moment .tip {
  position:absolute;bottom:48px;left:50%;transform:translateX(-50%);width:180px;
  padding:9px 11px;border-radius:10px;background:var(--pg-elevated);border:1px solid var(--pg-line);
  font-size:11.5px;line-height:1.45;color:var(--pg-sec);opacity:0;
  transition:.2s var(--pg-ease);pointer-events:none;z-index:3;
}
.pg-moment:hover .tip { opacity:1; }

/* Week grid */
.pg-week { display:grid;grid-template-columns:repeat(7,1fr);gap:8px; }
.pg-wd {
  border:1px solid var(--pg-line);border-radius:14px;padding:12px 6px;
  text-align:center;cursor:pointer;transition:.2s var(--pg-ease);
}
.pg-wd:hover { border-color:var(--pg-deep); }
.pg-wd.on { border-color:var(--pg-deep);background:rgba(224,181,102,.06); }
.pg-dn { font-size:11px;color:var(--pg-muted); }
.pg-dd { font-size:18px;font-weight:600;margin:4px 0 6px;color:var(--pg-text); }
.pg-dd.today { color:var(--pg-accent); }
.pg-wic { display:flex;justify-content:center;margin:5px 0 3px;min-height:26px; }
.pg-wlab { font-size:10px; }
.pg-wlab.good { color:var(--pg-accent); }
.pg-wlab.tense { color:var(--pg-tense); }
.pg-wlab.calm { color:var(--pg-muted); }

/* Month grid */
.pg-month { display:grid;grid-template-columns:repeat(7,1fr);gap:6px; }
.pg-mh { font-size:11px;color:var(--pg-muted);text-align:center;padding-bottom:4px; }
.pg-mc {
  aspect-ratio:1.1;border:1px solid transparent;border-radius:12px;padding:8px;
  cursor:pointer;position:relative;font-size:14px;color:var(--pg-sec);
  transition:.2s var(--pg-ease);
}
.pg-mc.act { border-color:var(--pg-line); }
.pg-mc.act:hover { border-color:var(--pg-deep); }
.pg-mc.today { border-color:var(--pg-deep);color:var(--pg-voice); }
.pg-dnum { position:absolute;top:7px;left:9px;font-size:13px;color:var(--pg-sec); }
.pg-mc.today .pg-dnum { color:var(--pg-voice); }
.pg-mic { position:absolute;left:50%;top:56%;transform:translate(-50%,-50%);display:flex; }
.pg-legend {
  display:flex;flex-wrap:wrap;gap:14px;justify-content:center;
  margin-top:14px;font-size:11.5px;color:var(--pg-muted);
}

/* Year wheel */
.pg-yearwrap { position:relative;display:flex;justify-content:center;padding:6px 0; }
.pg-yearbg {
  position:absolute;left:50%;top:50%;margin-left:-92px;margin-top:-92px;
  width:184px;height:184px;border-radius:50%;object-fit:cover;opacity:.95;
  pointer-events:none;animation:pg-spin 90s linear infinite;
  box-shadow:0 0 0 1px var(--pg-line),0 0 50px rgba(255,174,61,.08);
}
.pg-wheel { width:300px;height:300px; }
.pg-arctip {
  position:absolute;z-index:5;pointer-events:none;width:212px;padding:11px 13px;
  border-radius:12px;background:var(--pg-elevated);border:1px solid var(--pg-line);
  box-shadow:0 12px 40px rgba(0,0,0,.5);opacity:0;visibility:hidden;
  transform:translate(-50%,calc(-100% - 14px));transition:opacity .18s var(--pg-ease);
}
.pg-arctip.on { opacity:1;visibility:visible; }
.pg-arctip b { display:block;font-size:13px;color:var(--pg-text); }
.pg-arctip span { font-size:11.5px;color:var(--pg-deep);font-variant-numeric:tabular-nums; }
.pg-arctip p { font-size:12px;color:var(--pg-muted);line-height:1.5;margin-top:6px; }

/* ── NARR ZONE ── */
.pg-narr {
  border:1px solid var(--pg-line);border-radius:22px;padding:24px;
  margin-bottom:16px;background:var(--pg-elevated);
}
.pg-narr p { color:var(--pg-sec);font-size:15.5px;line-height:1.7;margin-bottom:12px; }
.pg-src { display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:2px 0 14px; }
.pg-src-label { font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--pg-muted); }
.pg-src-chip {
  font-size:11.5px;color:var(--pg-deep);border:1px solid var(--pg-line);
  border-radius:999px;padding:3px 10px;background:rgba(224,181,102,.05);
}
.pg-refl {
  margin-top:6px;border:1px solid var(--pg-line);border-radius:16px;
  padding:16px 18px;background:rgba(224,181,102,.04);
}
.pg-refl-head {
  font-size:11px;letter-spacing:.2em;text-transform:uppercase;
  color:var(--pg-deep);margin-bottom:8px;
}
.pg-refl p {
  font-family:'Fraunces',serif;font-style:italic;color:var(--pg-voice);
  font-size:15px;line-height:1.6;margin:0;
}
.pg-skeleton { opacity:.5;font-style:italic;color:var(--pg-muted);font-size:13px; }

/* ── WHEN BEST ── */
.pg-best {
  border:1px solid var(--pg-line);border-radius:22px;padding:22px;
  margin-bottom:16px;background:var(--pg-elevated);
}
.pg-best-head {
  font-size:11px;letter-spacing:.2em;text-transform:uppercase;
  color:var(--pg-deep);margin-bottom:14px;
}
.pg-chips { display:flex;flex-wrap:wrap;gap:9px; }
.pg-chip {
  padding:9px 16px;border-radius:999px;border:1px solid var(--pg-line);
  background:rgba(182,175,198,.03);color:var(--pg-sec);font-size:13.5px;
  cursor:pointer;transition:.2s var(--pg-ease);
}
.pg-chip:hover,.pg-chip.on {
  border-color:var(--pg-deep);color:var(--pg-voice);background:rgba(224,181,102,.06);
}
.pg-answer { margin-top:14px;font-size:14.5px;color:var(--pg-sec);min-height:22px; }
.pg-answer b { color:var(--pg-voice); }
.pg-answer .when { color:var(--pg-deep);font-variant-numeric:tabular-nums; }

/* ── WINDOWS ZONE ── */
.pg-windows {
  border:1px solid var(--pg-line);border-radius:22px;padding:22px;
  background:var(--pg-elevated);margin-bottom:16px;
}
.pg-win-head {
  font-size:11px;letter-spacing:.2em;text-transform:uppercase;
  color:var(--pg-muted);margin-bottom:6px;
}
.pg-win-item {
  display:flex;gap:14px;padding:14px 0;border-top:1px solid var(--pg-line);
}
.pg-win-item:first-of-type { border-top:none; }
.pg-win-rail { width:3px;border-radius:3px;flex:0 0 auto;background:var(--pg-deep); }
.pg-win-item.tense .pg-win-rail { background:var(--pg-tense); }
.pg-win-body b { font-size:14.5px;color:var(--pg-text); }
.pg-win-meta { font-size:12.5px;color:var(--pg-deep);font-variant-numeric:tabular-nums;margin-left:8px; }
.pg-win-item.tense .pg-win-meta { color:var(--pg-tense); }
.pg-win-body p { font-size:13.5px;color:var(--pg-muted);line-height:1.55;margin-top:4px; }
.pg-win-when { margin-left:auto;flex:0 0 auto;font-size:11px;color:var(--pg-muted);font-variant-numeric:tabular-nums; }

/* ── UPSELL ── */
.pg-upsell {
  border:1px solid rgba(255,174,61,.20);border-radius:22px;padding:20px;
  background:var(--pg-elevated);margin-bottom:16px;text-align:center;
  cursor:pointer;transition:.2s var(--pg-ease);
}
.pg-upsell:hover { background:rgba(255,255,255,.03); }
.pg-upsell p { color:var(--pg-sec);font-size:14px;margin-bottom:4px; }
.pg-upsell small { color:var(--pg-muted);font-size:12px; }

@media (max-width:640px) {
  .pg-week { grid-template-columns:repeat(7,1fr);gap:4px; }
  .pg-wd { padding:8px 3px; }
  .pg-dd { font-size:15px; }
  /* Smaller, corner-anchored orb so it stays clear of the title/desc text */
  .pg-orb { width:140px;height:140px;margin-top:0;top:-12px;right:-26px; }
}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const MONTH_SHORT: Record<number, string> = {
  1: "sty", 2: "lut", 3: "mar", 4: "kwi", 5: "maj", 6: "cze",
  7: "lip", 8: "sie", 9: "wrz", 10: "paź", 11: "lis", 12: "gru",
};

export const MONTH_FULL: Record<number, string> = {
  1: "Styczeń", 2: "Luty", 3: "Marzec", 4: "Kwiecień", 5: "Maj", 6: "Czerwiec",
  7: "Lipiec", 8: "Sierpień", 9: "Wrzesień", 10: "Październik", 11: "Listopad", 12: "Grudzień",
};

export const WEEK_DAY_SHORT = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
export const WEEK_DAY_FULL  = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

export type WeatherKind = "good" | "tense" | "calm";

// Unified period-weather model lives in a pure (React-free) module so it can be
// unit-tested; re-exported here for the view components that already import it.
export {
  summarizePeriodWeather,
  characterLine,
  plOkno,
  plSezon,
  type PeriodWeather,
  type PeriodTone,
} from "@/lib/astro/periodWeather";

// ─── SVG Day Icons ────────────────────────────────────────────────────────────

function rad(deg: number) { return deg * Math.PI / 180; }

export function DayIcon({ kind, size = 22 }: { kind: WeatherKind; size?: number }) {
  if (kind === "good") {
    const rays = [0, 45, 90, 135, 180, 225, 270, 315].map(d => {
      const a = rad(d);
      const x1 = (12 + Math.cos(a) * 6.5).toFixed(1);
      const y1 = (12 + Math.sin(a) * 6.5).toFixed(1);
      const x2 = (12 + Math.cos(a) * 9).toFixed(1);
      const y2 = (12 + Math.sin(a) * 9).toFixed(1);
      return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} />;
    });
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3.8" fill="var(--pg-accent)" />
        <g stroke="var(--pg-accent)" strokeWidth="1.6" strokeLinecap="round">{rays}</g>
      </svg>
    );
  }
  if (kind === "tense") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M13 2.5 L5.5 13.2 H11 L9 21.5 L18.8 9.2 H12.8 Z" fill="var(--pg-tense)" />
      </svg>
    );
  }
  // calm — crescent moon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3.4a8.6 8.6 0 1 0 8.6 8.6 6.7 6.7 0 0 1-8.6-8.6z" fill="var(--pg-muted)" />
    </svg>
  );
}

// ─── Shared AI interpretation type ───────────────────────────────────────────

export type ProgInterpretation = {
  theme:      string;
  summary:    string;
  narr:       string;
  sources:    string[];
  reflection: string;
  whenBest:   Record<string, string>;
  cached?:    boolean;
};

// ─── Zone: Weather ────────────────────────────────────────────────────────────

type WeatherZoneProps = {
  eyebrow:   string;
  theme:     string;
  desc:      string;
  sub:       string;
  intensity: number;
};

export function PgWeatherZone({ eyebrow, theme, desc, sub, intensity }: WeatherZoneProps) {
  return (
    <section className="pg-weather">
      <img
        className="pg-orb"
        src={intensityOrb(intensity)}
        alt=""
        style={{ opacity: orbOpacity(intensity) }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
      <div className="pg-eyebrow">{eyebrow}</div>
      <h2 className="pg-theme">{theme}</h2>
      {desc && <p className="pg-desc">{desc}</p>}
      <div className="pg-sub">{sub}</div>
      <div className="pg-gauge">
        <span className="pg-gauge-label">intensywność</span>
        <div className="pg-bars">
          {[1,2,3,4,5].map(n => <i key={n} className={n <= intensity ? "on" : ""} />)}
        </div>
        <span className="pg-char">{intensityLabel(intensity)}</span>
      </div>
    </section>
  );
}

// ─── Zone: Timeline — Day ─────────────────────────────────────────────────────

type DayMoment = {
  x:     number;
  glyph: string;
  kind:  "harm" | "tense";
  word:  string;
  desc:  string;
};

export function PgTimelineDay({ moments, nowPct }: { moments: DayMoment[]; nowPct: number }) {
  return (
    <div className="pg-daytl">
      <div className="track" />
      <div className="now-line" style={{ left: `${nowPct}%` }} />
      {moments.map((m, i) => (
        <div key={i} className={`pg-moment ${m.kind}`} style={{ left: `${m.x}%` }}>
          <div className="tip">{m.desc}</div>
          <div className="disc">{m.glyph}</div>
          <div className="lbl"><b>{m.word}</b></div>
        </div>
      ))}
    </div>
  );
}

// ─── Zone: Narration ─────────────────────────────────────────────────────────

// Interpretation call-to-action — lives INSIDE the forecast module (timeline),
// so there's never a lonely card with just a button. Handles all four states:
// premium idle (button), loading (loader), error, and free (locked upsell).
type InterpretButtonProps = {
  label:     string;
  loading:   boolean;
  error:     boolean;
  isPremium: boolean;
  onClick:   () => void;
};

export function PgInterpretButton({ label, loading, error, isPremium, onClick }: InterpretButtonProps) {
  if (!isPremium) {
    return (
      <a href="/pricing" className="pg-interp-cta pg-interp-lock">
        <span>Odblokuj pełną interpretację okresu</span>
        <small>Aktywuj Premium →</small>
      </a>
    );
  }
  return (
    <div className="pg-interp-cta">
      {loading ? (
        <div className="pg-loading-row">
          <GeneratingLoader
            variant="compact"
            phrases={[
              "Astrea analizuje Twój czas…",
              "Odczytuję tranzyty planet…",
              "Sprawdzam, co aktywuje Twój kosmogram…",
              "Splatam interpretację okresu…",
            ]}
          />
        </div>
      ) : (
        <button className="pg-interp-btn" onClick={onClick}>{label}</button>
      )}
      {error && !loading && (
        <p className="pg-interp-err">Nie udało się wygenerować — spróbuj ponownie.</p>
      )}
    </div>
  );
}

// Generated interpretation result — its own card, only when there's content.
type NarrProps = {
  narr:       string;
  sources:    string[];
  reflection: string | null;
};

export function PgNarrZone({ narr, sources, reflection }: NarrProps) {
  return (
    <section className="pg-narr">
      <div dangerouslySetInnerHTML={{ __html: narr }} />
      {sources.length > 0 && (
        <div className="pg-src">
          <span className="pg-src-label">na podstawie</span>
          {sources.map((s, i) => (
            <span key={i} className="pg-src-chip">{s}</span>
          ))}
        </div>
      )}
      {reflection && (
        <div className="pg-refl">
          <div className="pg-refl-head">Na ten okres</div>
          <p>{reflection}</p>
        </div>
      )}
    </section>
  );
}

// ─── Zone: When Best ─────────────────────────────────────────────────────────

const CHIPS = ["Nowy biznes", "Miłość", "Pieniądze", "Ważna rozmowa", "Odpoczynek"];

type WhenBestProps = {
  whenBest:   Record<string, string> | null;
  activeChip: string | null;
  onChip:     (k: string) => void;
  isPremium:  boolean;
};

export function PgWhenBest({ whenBest, activeChip, onChip, isPremium }: WhenBestProps) {
  const answer = (activeChip && whenBest?.[activeChip]) ?? null;
  return (
    <section className="pg-best">
      <div className="pg-best-head">Kiedy najlepiej…?</div>
      <div className="pg-chips">
        {CHIPS.map(k => (
          <button
            key={k}
            className={`pg-chip${activeChip === k ? " on" : ""}`}
            onClick={() => onChip(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="pg-answer">
        {!isPremium && <span>Aktywuj Premium, by zobaczyć najlepsze okna.</span>}
        {isPremium && !activeChip && <span>Wybierz obszar, a Astrea wskaże najlepsze okno.</span>}
        {isPremium && answer && (
          <span>Najlepsze okno na <b>{activeChip?.toLowerCase()}</b>: <span className="when">{answer}</span></span>
        )}
        {isPremium && activeChip && !answer && <span>Brak wyraźnego okna w tym widoku.</span>}
      </div>
    </section>
  );
}

// ─── Zone: Windows list ───────────────────────────────────────────────────────

type WinItem = {
  label:     string;
  character: string;
  favorable: boolean;
  dateRange: string;
  desc:      string;
};

type WindowsListProps = {
  title:     string;
  items:     WinItem[];
  isPremium: boolean;
};

export function PgWindowsList({ title, items, isPremium }: WindowsListProps) {
  if (!isPremium) return null;
  return (
    <section className="pg-windows">
      <div className="pg-win-head">{title}</div>
      {items.length === 0 && (
        <p className="pg-skeleton">Brak aktywnych okien w tym okresie.</p>
      )}
      {items.map((item, i) => (
        <div key={i} className={`pg-win-item${item.favorable ? "" : " tense"}`}>
          <div className="pg-win-rail" />
          <div className="pg-win-body">
            <b>{item.label}</b>
            <span className="pg-win-meta">{item.character}</span>
            <p>{item.desc}</p>
          </div>
          <div className="pg-win-when">{item.dateRange}</div>
        </div>
      ))}
    </section>
  );
}

// ─── Year Wheel helpers ───────────────────────────────────────────────────────

export function arcPath(r: number, m0: number, m1: number, cx = 150, cy = 150): string {
  const a0 = (m0 / 12) * 360 - 90;
  const a1 = (m1 / 12) * 360 - 90;
  const toRad = (deg: number) => deg * Math.PI / 180;
  const x0 = cx + Math.cos(toRad(a0)) * r;
  const y0 = cy + Math.sin(toRad(a0)) * r;
  const x1 = cx + Math.cos(toRad(a1)) * r;
  const y1 = cy + Math.sin(toRad(a1)) * r;
  const lg = (a1 - a0) > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${lg} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}
