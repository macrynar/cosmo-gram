"use client";

import { useState, useRef } from "react";
import type { Season } from "@/lib/astro/layers";
import type { NatalChart } from "@/lib/astro-types";
import {
  PgWeatherZone,
  PgNarrZone,
  PgInterpretButton,
  PgWhenBest,
  PgWindowsList,
  useProgInterpretation,
  PROGNOZA_STYLES,
  summarizePeriodWeather,
  characterLine,
  plSezon,
  arcPath,
} from "./prognoza-shared";

type Props = {
  seasons:   Season[];
  chart:     NatalChart;
  isPremium: boolean;
  readingId: string | null;
  year:      number;
  onDayClick?: (date: string) => void;
  session?:  { access_token: string } | null;
};

const MONTH_SHORT_ARR = ["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"];

function toRad(deg: number) { return deg * Math.PI / 180; }

type ArcTip = { name: string; dates: string; desc: string; visible: boolean; x: number; y: number };

export default function YearView({ seasons, chart, isPremium, readingId, year, onDayClick, session }: Props) {
  const now     = new Date();
  const curMonth = now.getMonth(); // 0-indexed

  // Year-level weather from the active SEASONS (slow themes) — not today's sky.
  // Slow planets carry higher scores, so seasons use a larger reference max.
  const headerWeather = summarizePeriodWeather(seasons, { refMax: 150, denseAt: 3 });

  // AI interpretation — auto-restores from server cache, generated on demand (button)
  const { interp, loading: interpLoading, error: interpError, generate: fetchInterp } =
    useProgInterpretation({
      zoom:      "rok",
      date:      `${year}-06-15`,
      readingId: readingId ?? undefined,
      isPremium,
      session,
    });

  // Interpretation generated on demand (no auto-fetch)

  // Tooltip state for season arcs
  const [arcTip, setArcTip] = useState<ArcTip | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Map seasons to arc data
  const seasonArcs = seasons.slice(0, 5).map((s, idx) => {
    const radii  = [116, 108, 100, 94, 88];
    const r      = radii[idx] ?? 100;
    const start  = new Date(s.start + "T12:00:00Z");
    const end    = new Date(s.end   + "T12:00:00Z");
    // Convert dates to month fractions within the year
    const m0 = (start.getUTCFullYear() === year)
      ? start.getUTCMonth() + start.getUTCDate() / 31
      : (start.getUTCFullYear() < year ? 0 : 12);
    const m1 = (end.getUTCFullYear() === year)
      ? Math.min(12, end.getUTCMonth() + end.getUTCDate() / 31)
      : (end.getUTCFullYear() > year ? 12 : 0);
    const clampedM0 = Math.max(0, Math.min(12, m0));
    const clampedM1 = Math.max(0, Math.min(12, m1));
    const path  = clampedM0 < clampedM1 ? arcPath(r, clampedM0, clampedM1) : null;
    const color = s.favorable ? "var(--pg-deep)" : "var(--pg-tense)";
    const ASPECT_PL: Record<string, string> = {
      conjunction: "koniunkcja", opposition: "opozycja", square: "kwadrat",
      trine: "trygon", sextile: "sekstyl",
    };
    const name = `${s.transitPlanet} (${ASPECT_PL[s.aspectType] ?? s.aspectType}) → ${s.natalPoint}`;
    const dates = `${s.start.slice(0, 7)} – ${s.end.slice(0, 7)}`;
    const phaseDesc: Record<string, string> = {
      "początek": "Sezon wchodzi w orb — zmiany dopiero zaczynają się zarysowywać.",
      "środek":   "Sezon w pełni — energia jest najwyraźniejsza.",
      "domykanie":"Sezon opuszcza orb — czas integracji tego, co zostało zainicjowane.",
    };
    const desc = phaseDesc[s.phase] ?? "";
    return { r, path, color, name, dates, desc, s };
  });

  // Current month pointer
  const pointerAngle = (curMonth / 12) * 360 - 90;
  const pointerR = 112;
  const px = 150 + Math.cos(toRad(pointerAngle)) * pointerR;
  const py = 150 + Math.sin(toRad(pointerAngle)) * pointerR;

  // Season windows list
  const winItems = seasons.slice(0, 5).map(s => ({
    label:     `${s.transitPlanet} → ${s.natalPoint}`,
    character: s.favorable ? "wspierające" : "wymagające",
    favorable: s.favorable,
    dateRange: `${s.start.slice(0, 7)} – ${s.end.slice(0, 7)}`,
    desc:      s.phase === "środek" ? "Sezon w pełni" : s.phase === "początek" ? "Rozpoczyna się" : "Domykanie",
  }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROGNOZA_STYLES }} />

      <PgWeatherZone
        eyebrow={`Pogoda · Rok ${year}`}
        theme={interp?.theme ?? `Rok ${year}`}
        desc={interp?.summary ?? characterLine(headerWeather, seasons.length)}
        sub={seasons.length === 0
          ? "Brak wyraźnych sezonów w tym okresie"
          : seasons.length === 1
            ? "1 sezon — długi temat tego roku"
            : `${seasons.length} ${plSezon(seasons.length)} — długie tematy tego roku`}
        intensity={headerWeather.intensity}
      />

      <section className="pg-timeline">
        <div className="pg-tl-head">
          <b>Koło roku {year}</b>
        </div>

        <div className="pg-yearwrap" ref={wrapRef}>
          {/* Medal image — centered via margin, NOT transform (animation-safe) */}
          <img
            className="pg-yearbg"
            src="/assets/prognoza/year-wheel.png"
            alt=""
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />

          <svg className="pg-wheel" viewBox="0 0 300 300" fill="none" style={{ position: "relative", zIndex: 1 }}>
            {/* Outer ring */}
            <circle cx="150" cy="150" r="143" stroke="rgba(224,181,102,.12)" />

            {/* Season arcs */}
            {seasonArcs.map((sa, i) =>
              sa.path ? (
                <g key={i}>
                  {/* Visible arc */}
                  <path
                    d={sa.path}
                    stroke={sa.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    opacity=".75"
                  />
                  {/* Hit area */}
                  <path
                    d={sa.path}
                    stroke="transparent"
                    strokeWidth="15"
                    fill="none"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => {
                      const rect = wrapRef.current?.getBoundingClientRect();
                      if (!rect) return;
                      setArcTip({
                        name: sa.name,
                        dates: sa.dates,
                        desc: sa.desc,
                        visible: true,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }}
                    onMouseMove={(e) => {
                      const rect = wrapRef.current?.getBoundingClientRect();
                      if (!rect || !arcTip) return;
                      setArcTip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
                    }}
                    onMouseLeave={() => setArcTip(null)}
                    onClick={() => {
                      // Jump to season peak month
                      const peakDate = sa.s.exactDays[0] ?? sa.s.start;
                      onDayClick?.(peakDate);
                    }}
                  />
                </g>
              ) : null
            )}

            {/* Month ticks & labels */}
            {MONTH_SHORT_ARR.map((mm, i) => {
              const angle = (i / 12) * 360 - 90;
              const lx = 150 + Math.cos(toRad(angle)) * 124;
              const ly = 150 + Math.sin(toRad(angle)) * 124;
              const t1 = 141, t2 = 135;
              const tx1 = 150 + Math.cos(toRad(angle)) * t1;
              const ty1 = 150 + Math.sin(toRad(angle)) * t1;
              const tx2 = 150 + Math.cos(toRad(angle)) * t2;
              const ty2 = 150 + Math.sin(toRad(angle)) * t2;
              const isCur = i === curMonth;
              return (
                <g key={mm}>
                  <line
                    x1={tx1} y1={ty1} x2={tx2} y2={ty2}
                    stroke={isCur ? "var(--pg-accent)" : "var(--pg-line)"}
                    strokeWidth={isCur ? 1.5 : 1}
                  />
                  <text
                    x={lx} y={ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10.5"
                    fontWeight={isCur ? 600 : 400}
                    fill={isCur ? "var(--pg-accent)" : "var(--pg-muted)"}
                    fontFamily="General Sans, sans-serif"
                  >
                    {mm}
                  </text>
                </g>
              );
            })}

            {/* Current month pointer */}
            <line
              x1="150" y1="150"
              x2={px.toFixed(2)} y2={py.toFixed(2)}
              stroke="var(--pg-accent)"
              strokeWidth="1.5"
              opacity=".4"
            />
            <circle cx={px.toFixed(2)} cy={py.toFixed(2)} r="3.5" fill="var(--pg-accent)" />

            {/* Center overlay */}
            <circle cx="150" cy="150" r="38" fill="rgba(11,9,18,.6)" />
            <text
              x="150" y="144"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="27"
              fontWeight="700"
              fill="var(--pg-text)"
              fontFamily="General Sans, sans-serif"
            >
              {year}
            </text>
            <text
              x="150" y="166"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              letterSpacing="2"
              fill="var(--pg-deep)"
              fontFamily="General Sans, sans-serif"
            >
              {MONTH_SHORT_ARR[curMonth]?.toUpperCase()}
            </text>
          </svg>

          {/* Arc tooltip */}
          {arcTip && (
            <div
              className="pg-arctip on"
              style={{ left: arcTip.x, top: arcTip.y }}
            >
              <b>{arcTip.name}</b>
              <span>{arcTip.dates}</span>
              {arcTip.desc && <p>{arcTip.desc}</p>}
            </div>
          )}
        </div>

        <div className="pg-hint">Łuki = sezony wpływu · najedź, by zobaczyć co znaczą · aktualny miesiąc podświetlony</div>
        {!interp && (
          <PgInterpretButton
            label="Generuj interpretację roku"
            loading={interpLoading}
            error={interpError}
            isPremium={isPremium}
            onClick={fetchInterp}
          />
        )}
      </section>

      {isPremium && interp?.narr && (
        <PgNarrZone
          narr={interp.narr}
          sources={interp.sources ?? []}
          reflection={interp.reflection ?? null}
        />
      )}

      <PgWhenBest
        chart={chart}
        horizonDays={365}
        isPremium={isPremium}
        scopeLabel="tym roku"
      />

      <PgWindowsList
        title="Twoje sezony"
        items={winItems}
        isPremium={isPremium}
      />
    </>
  );
}
