"use client";

import type { NatalChart } from "@/lib/astro-types";
import type { TransitWindow, SkyEvent } from "@/lib/astro/layers";
import type { DayData } from "@/lib/chart-engine";
import DayPanel from "@/components/calendar/DayPanel";
import {
  PgWeatherZone,
  PgNarrZone,
  PgInterpretButton,
  PgWindowsList,
  DayIcon,
  useProgInterpretation,
  PROGNOZA_STYLES,
  summarizePeriodWeather,
  characterLine,
  plOkno,
  MONTH_SHORT,
  type WeatherKind,
} from "./prognoza-shared";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type Props = {
  weekStart:     string;
  days:          DayData[];
  year:          number;
  month:         number;
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
  weekStart, days, year, month, chart, readingId, isPremium,
  windowDateMap, exactDays, skyEvents, selectedDate, onSelect,
  onPrevWeek, onNextWeek, session,
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

  // Windows for this week
  const weekWindows = weekDates.flatMap(d => windowDateMap.get(d) ?? []);
  const uniqueWindows = Array.from(
    new Map(weekWindows.map(w => [`${w.transitPlanet}-${w.aspectType}-${w.natalPoint}`, w])).values()
  ).slice(0, 5);

  const headerWeather = summarizePeriodWeather(uniqueWindows);

  // Per-day weather from windowDateMap (same source as icons — consistent)
  const dayWeathers = weekDates.map(dateStr => {
    const wins = windowDateMap.get(dateStr);
    if (!wins || wins.length === 0) return { kind: "calm" as WeatherKind };
    const hasTense = wins.some(w => !w.favorable);
    const hasGood  = wins.some(w => w.favorable);
    return { kind: (hasTense && !hasGood ? "tense" : hasGood ? "good" : "calm") as WeatherKind };
  });

  // AI interpretation — auto-restores from server cache, generated on demand (button)
  const { interp, loading: interpLoading, error: interpError, generate: fetchInterp } =
    useProgInterpretation({ zoom: "tydzien", date: weekStart, readingId, isPremium, session });

  // DayPanel helpers
  function getDayDataForDate(dateStr: string): DayData | undefined {
    const d = new Date(dateStr + "T12:00:00Z");
    if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month) return undefined;
    return days[d.getUTCDate() - 1];
  }

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
        desc={interp?.summary ?? characterLine(headerWeather, uniqueWindows.length)}
        sub={uniqueWindows.length === 0
          ? "Spokojny tydzień — brak wyraźnych okien"
          : `${uniqueWindows.length} ${plOkno(uniqueWindows.length)} w tym tygodniu`}
        intensity={headerWeather.intensity}
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
            const isSelected = dateStr === selectedDate;
            const kind    = dayWeathers[i]?.kind ?? "calm";

            return (
              <div
                key={dateStr}
                className={`pg-wd${isToday ? " on" : ""}${isSelected ? " on" : ""}`}
                onClick={() => onSelect(dateStr)}
                style={isSelected ? { borderColor: "var(--pg-deep)", background: "rgba(224,181,102,.08)" } : undefined}
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
        {!interp && (
          <PgInterpretButton
            label="Generuj interpretację tygodnia"
            loading={interpLoading}
            error={interpError}
            isPremium={isPremium}
            onClick={fetchInterp}
          />
        )}
      </section>

      {/* Day panel — shown inline when day selected */}
      {selectedDate && weekDates.includes(selectedDate) && (
        <DayPanel
          date={selectedDate}
          dayData={getDayDataForDate(selectedDate)}
          chart={chart}
          readingId={readingId}
          isPremium={isPremium}
          activeWindow={windowDateMap.get(selectedDate)?.[0]}
          isExactDay={exactDays.has(selectedDate)}
          skyEvents={skyEvents}
          onClose={() => onSelect(selectedDate)}
        />
      )}

      {isPremium && interp?.narr && (
        <PgNarrZone
          narr={interp.narr}
          sources={interp.sources ?? []}
          reflection={interp.reflection ?? null}
        />
      )}

      <PgWindowsList
        title="Okna w tym tygodniu"
        items={winItems}
        isPremium={isPremium}
      />
    </>
  );
}
