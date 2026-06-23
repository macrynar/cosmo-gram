"use client";

import type { NatalChart } from "@/lib/astro-types";
import type { TransitWindow, SkyEvent } from "@/lib/astro/layers";
import type { DayData } from "@/lib/chart-engine";
import {
  PgWeatherZone,
  PgNarrZone,
  PgInterpretButton,
  PgWhenBest,
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

const MONTH_FULL: Record<number, string> = {
  1: "Styczeń", 2: "Luty", 3: "Marzec", 4: "Kwiecień", 5: "Maj", 6: "Czerwiec",
  7: "Lipiec", 8: "Sierpień", 9: "Wrzesień", 10: "Październik", 11: "Listopad", 12: "Grudzień",
};

type Props = {
  year:                number;
  month:               number;
  days:                DayData[];
  chart:               NatalChart;
  readingId:           string;
  isPremium:           boolean;
  fastWindows:         TransitWindow[];
  windowDateMap:       Map<string, TransitWindow[]>;
  exactDays:           Set<string>;
  moonSignChangeDates: Set<string>;
  skyEvents:           SkyEvent[];
  selectedDate:        string | null;
  onSelect:            (date: string) => void;
  onPrevMonth:         () => void;
  onNextMonth:         () => void;
  timeUnknown:         boolean;
  session?:            { access_token: string } | null;
};

const GRID_HEADERS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

export default function MonthView({
  year, month, chart, readingId, isPremium,
  fastWindows, windowDateMap, onSelect, onPrevMonth, onNextMonth,
  session,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const monthName  = MONTH_FULL[month];
  const eyebrow    = `Pogoda · ${monthName}`;
  const daysInMonth = new Date(year, month, 0).getDate();

  // Month-level weather from fastWindows — same source as per-day icons → consistent header + grid
  const headerWeather = summarizePeriodWeather(fastWindows, { refMax: 90, denseAt: 6 });
  const favCount   = fastWindows.filter(w => w.favorable).length;
  const unfavCount = fastWindows.length - favCount;
  const monthSub =
    fastWindows.length === 0 ? "Spokojny miesiąc — dobry na regenerację" :
    unfavCount === 0         ? `${fastWindows.length} ${plOkno(fastWindows.length)} · same sprzyjające` :
    favCount === 0           ? `${fastWindows.length} ${plOkno(fastWindows.length)} · same wymagające` :
                               `${fastWindows.length} ${plOkno(fastWindows.length)} · ${favCount} sprzyjające, ${unfavCount} wymagające`;

  // Per-day weather: use pre-computed windowDateMap (fast planets only) for natural daily variation.
  // Slow outer planets (Uran/Neptun/Saturn) move <0.1°/day and would dominate every day the same way
  // if computed directly via getTransitsForDate.
  const dayWeatherMap = new Map<number, WeatherKind>();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const wins    = windowDateMap.get(dateStr);
    if (!wins || wins.length === 0) {
      dayWeatherMap.set(d, "calm");
    } else {
      const hasTense = wins.some(w => !w.favorable);
      const hasGood  = wins.some(w => w.favorable);
      dayWeatherMap.set(d, hasTense && !hasGood ? "tense" : hasGood ? "good" : "calm");
    }
  }

  // AI interpretation — auto-restores from server cache, generated on demand (button)
  const { interp, loading: interpLoading, error: interpError, generate: fetchInterp } =
    useProgInterpretation({
      zoom:      "miesiac",
      date:      `${year}-${String(month).padStart(2, "0")}-01`,
      readingId,
      isPremium,
      session,
    });

  // Grid offset: first day of month (ISO — 0=Sun, 1=Mon...) → offset so week starts Mon
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const offset   = firstDay === 0 ? 6 : firstDay - 1; // Mon=0..Sun=6

  const winItems = fastWindows.slice(0, 6).map(w => ({
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
        theme={interp?.theme ?? `${monthName} ${year}`}
        desc={interp?.summary ?? characterLine(headerWeather, fastWindows.length)}
        sub={monthSub}
        intensity={headerWeather.intensity}
      />

      <section className="pg-timeline">
        <div className="pg-tl-head">
          <b>{monthName} {year}</b>
          <div className="pg-tl-nav">
            <button onClick={onPrevMonth}>‹</button>
            <button onClick={onNextMonth}>›</button>
          </div>
        </div>

        <div className="pg-month">
          {GRID_HEADERS.map(h => (
            <div key={h} className="pg-mh">{h}</div>
          ))}

          {/* Empty cells for offset */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`offset-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const d       = idx + 1;
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const kind    = dayWeatherMap.get(d) ?? "calm";

            return (
              <div
                key={d}
                className={`pg-mc act${isToday ? " today" : ""}`}
                onClick={() => {
                  onSelect(dateStr);
                  const url = new URL(window.location.href);
                  url.searchParams.set("h", "today");
                  url.searchParams.set("date", dateStr);
                  window.location.href = url.toString();
                }}
              >
                <span className="pg-dnum">{d}</span>
                <span className="pg-mic"><DayIcon kind={kind} size={18} /></span>
              </div>
            );
          })}
        </div>

        <div className="pg-legend">
          <span><DayIcon kind="good" size={14} /> dzień sprzyjający</span>
          <span><DayIcon kind="tense" size={14} /> dzień napięty</span>
          <span><DayIcon kind="calm" size={14} /> spokojny</span>
        </div>
        <div className="pg-hint">Kliknij dzień → szczegóły dnia</div>
        {!interp && (
          <PgInterpretButton
            label="Generuj interpretację miesiąca"
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
        horizonDays={90}
        isPremium={isPremium}
        scopeLabel="najbliższych miesiącach"
      />

      <PgWindowsList
        title={`Okna w ${monthName.toLowerCase()}`}
        items={winItems}
        isPremium={isPremium}
      />
    </>
  );
}
