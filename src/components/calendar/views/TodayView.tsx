"use client";

import { useState, useCallback } from "react";
import { getTransitsForDate, getDayWeather } from "@/lib/astro/transits";
import type { NatalChart } from "@/lib/astro-types";
import type { TransitWindow, SkyEvent } from "@/lib/astro/layers";
import {
  PgWeatherZone,
  PgTimelineDay,
  PgNarrZone,
  PgWhenBest,
  PgWindowsList,
  type ProgInterpretation,
  PROGNOZA_STYLES,
  summarizeWindows,
  MONTH_SHORT,
  WEEK_DAY_FULL,
} from "./prognoza-shared";

type Props = {
  chart:           NatalChart;
  isPremium:       boolean;
  dayWindows:      TransitWindow[];   // windows active today — same source as WeekView/MonthView
  todayWindow:     TransitWindow | null;
  skyEvents:       SkyEvent[];
  upcomingWindows: TransitWindow[];
  onWindowClick:   () => void;
  readingId?:      string;
  session?:        { access_token: string } | null;
};

export default function TodayView({
  chart, isPremium, dayWindows, upcomingWindows, readingId, session,
}: Props) {
  const now      = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Weather gauge — same source as WeekView/MonthView (windowDateMap → fast planets only)
  // Slow outer planets (Uran/Neptune/Saturn) move <0.1°/day and skew daily intensity if included
  const { intensity, character, kind, orbSrc } = summarizeWindows(dayWindows);

  // Transits still used for the day timeline display and Moon element line
  const transits = getTransitsForDate(chart, now);
  const weather  = getDayWeather(transits);

  // Build day title
  const d         = now;
  const dayName   = WEEK_DAY_FULL[d.getDay()];
  const dayNum    = d.getDate();
  const monthName = MONTH_SHORT[d.getMonth() + 1];
  const eyebrow   = `Pogoda · Dziś`;
  const title     = `${dayName}, ${dayNum} ${monthName}`;

  // AI interpretation — generated on demand (button below)
  const [interp, setInterp]         = useState<ProgInterpretation | null>(null);
  const [interpLoading, setInterpLoading] = useState(false);
  const [interpError, setInterpError]     = useState(false);
  const [activeChip, setActiveChip]       = useState<string | null>(null);

  const fetchInterp = useCallback(async () => {
    if (!readingId || !session || !isPremium) return;
    setInterpLoading(true);
    setInterpError(false);
    try {
      const res = await fetch("/api/prognoza-interpretation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reading_id: readingId, zoom: "dzis", date: todayStr }),
      });
      if (res.ok) setInterp(await res.json() as ProgInterpretation);
      else setInterpError(true);
    } catch {
      setInterpError(true);
    } finally {
      setInterpLoading(false);
    }
  }, [readingId, session, isPremium, todayStr]);

  // Day timeline (top 4 transits by score — detailed view, all planets)
  const topTransits = transits.slice(0, 4);
  const PLANET_GLYPH: Record<string, string> = {
    "Słońce": "☉", "Księżyc": "☽", "Merkury": "☿", "Wenus": "♀", "Mars": "♂",
    "Jowisz": "♃", "Saturn": "♄", "Uran": "♅", "Neptun": "♆", "Pluton": "♇",
  };
  const nowHour  = now.getHours() + now.getMinutes() / 60;
  const nowPct   = Math.round((nowHour / 24) * 100);
  const dayMoments = topTransits.map((t, i) => {
    const spreadPcts = [20, 38, 58, 76];
    return {
      x:    spreadPcts[i] ?? 20 + i * 18,
      glyph: PLANET_GLYPH[t.transitPlanet] ?? t.transitPlanet[0],
      kind:  (t.favorable ? "harm" : "tense") as "harm" | "tense",
      word:  t.favorable ? "wsparcie" : "napięcie",
      desc:  `${t.transitPlanet} ${t.aspectType} ${t.natalPoint} — orb ${t.orbDegrees.toFixed(1)}°`,
    };
  });

  const winItems = upcomingWindows.slice(0, 5).map(w => ({
    label:     `${w.transitPlanet} – ${w.natalPoint}`,
    character: w.character,
    favorable: w.favorable,
    dateRange: `peak ${w.peak.slice(5, 10).replace("-", " ")}`,
    desc:      w.character === "wspierające" ? "Sprzyjający czas" : "Wymagający czas",
  }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROGNOZA_STYLES }} />

      <PgWeatherZone
        eyebrow={eyebrow}
        theme={interp?.theme ?? title}
        desc={interp?.summary ?? ""}
        sub={`☾ Księżyc · ${weather.element}`}
        intensity={intensity}
        character={character}
        kind={kind}
        orbSrc={orbSrc}
      />

      <section className="pg-timeline">
        <div className="pg-tl-head">
          <b>{title}</b>
        </div>
        <PgTimelineDay moments={dayMoments} nowPct={nowPct} />
        <div className="pg-hint">Złoto = wsparcie · terakota = napięcie · najedź po szczegół</div>
      </section>

      {isPremium && !interp && !interpLoading && (
        <section className="pg-narr">
          <button
            onClick={fetchInterp}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600,
              border: "1px solid rgba(224,181,102,.40)", background: "rgba(224,181,102,.06)",
              color: "var(--pg-deep)", cursor: "pointer", transition: ".2s",
              fontFamily: "inherit",
            }}
          >
            Generuj interpretację dnia
          </button>
          {interpError && (
            <p style={{ fontSize: 13, color: "var(--pg-tense)", marginTop: 10 }}>
              Nie udało się wygenerować — spróbuj ponownie.
            </p>
          )}
        </section>
      )}

      {isPremium && (interp || interpLoading) && (
        <PgNarrZone
          narr={interp?.narr ?? null}
          sources={interp?.sources ?? []}
          reflection={interp?.reflection ?? null}
          loading={interpLoading}
          isPremium={isPremium}
        />
      )}

      <PgWhenBest
        whenBest={interp?.whenBest ?? null}
        activeChip={activeChip}
        onChip={setActiveChip}
        isPremium={isPremium}
      />

      <PgWindowsList
        title="Nadchodzące okna"
        items={winItems}
        isPremium={isPremium}
      />
    </>
  );
}
