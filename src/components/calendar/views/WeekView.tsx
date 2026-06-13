"use client";

import { useState, useEffect, useCallback } from "react";
import type { NatalChart } from "@/lib/astro-types";
import type { TransitWindow, SkyEvent } from "@/lib/astro/layers";
import type { DayData } from "@/lib/chart-engine";
import {
  PgWeatherZone,
  PgNarrZone,
  PgWhenBest,
  PgWindowsList,
  DayIcon,
  PROGNOZA_STYLES,
  summarizeWindows,
  WEEK_DAY_SHORT,
  MONTH_SHORT,
  type ProgInterpretation,
  type WeatherKind,
} from "./prognoza-shared";

const MONTH_FULL: Record<number, string> = {
  1: "Styczeń", 2: "Luty", 3: "Marzec", 4: "Kwiecień", 5: "Maj", 6: "Czerwiec",
  7: "Lipiec", 8: "Sierpień", 9: "Wrzesień", 10: "Październik", 11: "Listopad", 12: "Grudzień",
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type Props = {
  weekStart:     string;
  days:          DayData[];
  chart:         NatalChart;
  readingId:     string;
  isPremium:     boolean;
  windowDateMap: Map<string, TransitWindow[]>;
  exactDays:     Set<string>;
  skyEvents:     SkyEvent[];
  selectedDate:  string | null;
  onSelect:      (date: string) => void;
  onPrevWeek:    () => void;
  onNextWeek:    () => void;
  session?:      { access_token: string } | null;
};

const WEEKDAY_PL = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const WEATHER_LABEL: Record<WeatherKind, string> = {
  good: "sprzyja",
  tense: "napięcie",
  calm: "spokojnie",
};

export default function WeekView({
  weekStart, days, chart, readingId, isPremium,
  windowDateMap, onSelect, onPrevWeek, onNextWeek,
  session,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const weekDates: string[] = [];
  const startDate = new Date(weekStart + "T12:00:00Z");
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    weekDates.push(isoDate(d));
  }

  const startD = new Date(weekStart + "T12:00:00Z");
  const endD   = new Date(weekStart + "T12:00:00Z");
  endD.setUTCDate(endD.getUTCDate() + 6);
  const headerLabel = `${startD.getUTCDate()} ${MONTH_SHORT[startD.getUTCMonth() + 1]} – ${endD.getUTCDate()} ${MONTH_SHORT[endD.getUTCMonth() + 1]} ${endD.getUTCFullYear()}`;
  const eyebrow = `Pogoda · Tydzień`;

  // Windows for this week — computed first so week-level header uses same source as per-day icons
  const weekWindows = weekDates.flatMap(d => windowDateMap.get(d) ?? []);
  const uniqueWindows = Array.from(
    new Map(weekWindows.map(w => [`${w.transitPlanet}-${w.aspectType}-${w.natalPoint}`, w])).values()
  ).slice(0, 5);

  const { intensity, character, kind: weekKind, orbSrc } = summarizeWindows(uniqueWindows);

  // Per-day weather: use pre-computed windowDateMap (fast planets only) for natural daily variation
  const dayWeathers = weekDates.map(dateStr => {
    const wins = windowDateMap.get(dateStr);
    if (!wins || wins.length === 0) return { kind: "calm" as WeatherKind };
    const hasTense = wins.some(w => !w.favorable);
    const hasGood  = wins.some(w => w.favorable);
    return { kind: (hasTense && !hasGood ? "tense" : hasGood ? "good" : "calm") as WeatherKind };
  });

  // AI interpretation
  const [interp, setInterp] = useState<ProgInterpretation | null>(null);
  const [interpLoading, setInterpLoading] = useState(false);
  const [interpError, setInterpError] = useState(false);
  const [activeChip, setActiveChip] = useState<string | null>(null);

  const fetchInterp = useCallback(async () => {
    if (!readingId || !session || !isPremium) return;
    setInterpLoading(true);
    setInterp(null);
    setInterpError(false);
    try {
      const res = await fetch("/api/prognoza-interpretation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reading_id: readingId, zoom: "tydzien", date: weekStart }),
      });
      if (res.ok) setInterp(await res.json() as ProgInterpretation);
      else setInterpError(true);
    } catch {
      setInterpError(true);
    } finally {
      setInterpLoading(false);
    }
  }, [readingId, session, isPremium, weekStart]);

  useEffect(() => { fetchInterp(); }, [fetchInterp]);

  const winItems = uniqueWindows.map(w => ({
    label:     `${w.transitPlanet} – ${w.natalPoint}`,
    character: w.character,
    favorable: w.favorable,
    dateRange: `${w.start.slice(8, 10)}–${w.end.slice(8, 10)} ${MONTH_SHORT[parseInt(w.peak.slice(5, 7))]}`,
    desc:      w.character === "wspierające" ? "Sprzyjający czas" : "Wymagający czas",
  }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROGNOZA_STYLES }} />

      <PgWeatherZone
        eyebrow={eyebrow}
        theme={interp?.theme ?? headerLabel}
        desc={
          interp?.summary ??
          (interpLoading ? "Generuję interpretację tygodnia…" :
           interpError   ? "Interpretacja chwilowo niedostępna." :
           !isPremium    ? "Interpretacja AI dostępna w planie Plus." :
                           "Ładowanie…")
        }
        sub={uniqueWindows.length > 0 ? `${uniqueWindows.length} aktywnych okien` : "spokojny tydzień"}
        intensity={intensity}
        character={character}
        kind={weekKind}
        orbSrc={orbSrc}
      />

      <section className="pg-timeline">
        <div className="pg-tl-head">
          <b>{headerLabel}</b>
          <div className="pg-tl-nav">
            <button onClick={onPrevWeek}>‹</button>
            <button onClick={onNextWeek}>›</button>
          </div>
        </div>

        <div className="pg-week">
          {weekDates.map((dateStr, i) => {
            const d       = new Date(dateStr + "T12:00:00Z");
            const wIdx    = d.getUTCDay();
            const dn      = WEEKDAY_PL[wIdx];
            const dayNum  = d.getUTCDate();
            const isToday = dateStr === todayStr;
            const kind    = dayWeathers[i]?.kind ?? "calm";

            return (
              <div
                key={dateStr}
                className={`pg-wd${isToday ? " on" : ""}`}
                onClick={() => {
                  onSelect(dateStr);
                  // Navigate to "dziś" for this day via URL
                  const url = new URL(window.location.href);
                  url.searchParams.set("h", "today");
                  url.searchParams.set("date", dateStr);
                  window.location.href = url.toString();
                }}
              >
                <div className="pg-dn">{dn}</div>
                <div className={`pg-dd${isToday ? " today" : ""}`}>{dayNum}</div>
                <div className="pg-wic"><DayIcon kind={kind} size={24} /></div>
                <div className={`pg-wlab ${kind}`}>{WEATHER_LABEL[kind]}</div>
              </div>
            );
          })}
        </div>
        <div className="pg-hint">Kliknij dzień, by zobaczyć szczegóły · Słońce = sprzyja · Piorun = napięcie · Księżyc = spokojnie</div>
      </section>

      <PgNarrZone
        narr={interp?.narr ?? null}
        sources={interp?.sources ?? []}
        reflection={interp?.reflection ?? null}
        loading={interpLoading}
        isPremium={isPremium}
      />

      <PgWhenBest
        whenBest={interp?.whenBest ?? null}
        activeChip={activeChip}
        onChip={setActiveChip}
        isPremium={isPremium}
      />

      <PgWindowsList
        title="Okna w tym tygodniu"
        items={winItems}
        isPremium={isPremium}
      />
    </>
  );
}
