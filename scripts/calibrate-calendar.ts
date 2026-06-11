#!/usr/bin/env tsx
/**
 * Skrypt kalibracyjny kalendarza — uruchamiaj ręcznie przy zmianie wag tranzytów.
 * Wynik: progi absolutne do src/lib/astro/calendarLimits.ts
 *
 * Użycie: npx tsx scripts/calibrate-calendar.ts
 */

import { getWindowsForMonth } from "../src/lib/astro/windows";
import { longitudeToSign } from "../src/lib/astro-types";
import type { NatalChart, Planet, HouseCusp } from "../src/lib/astro-types";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// ─── Planet symbols (for adapter) ──────────────────────────────────────────

const PLANET_SYMBOLS: Record<string, string> = {
  "Słońce":  "☉", "Księżyc": "☽", "Merkury": "☿", "Wenus": "♀", "Mars":   "♂",
  "Jowisz":  "♃", "Saturn":  "♄", "Uran":   "♅", "Neptun": "♆", "Pluton": "♇",
};

// ─── Fixture → NatalChart adapter ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptFixture(raw: any): NatalChart {
  const planets: Planet[] = (raw.planets as Array<{ name: string; sign: string; longitude: number }>).map(p => {
    const { name: signName, symbol: signSymbol, degree, minute } = longitudeToSign(p.longitude);
    const retro = (raw.placements as Array<{ planet: string; retrograde?: boolean }>)
      ?.find(pl => pl.planet === p.name);
    return {
      name:        p.name,
      symbol:      PLANET_SYMBOLS[p.name] ?? "?",
      longitude:   p.longitude,
      sign:        signName,
      signSymbol,
      degree,
      minute,
      isRetrograde: retro?.retrograde === true,
    };
  });

  // Equal houses from ascendant (no birth time needed for transit scoring)
  const houses: HouseCusp[] = Array.from({ length: 12 }, (_, i) => ({
    house:     i + 1,
    longitude: ((raw.ascendant as number) + i * 30) % 360,
  }));

  const inp = raw.meta?.input ?? {};

  return {
    planets,
    houses,
    ascendant: raw.ascendant as number,
    mc:        raw.mc as number,
    birthData: {
      date:     (inp.date  as string) ?? "1990-01-01",
      time:     (inp.time  as string) ?? "12:00",
      place:    (inp.place as string) ?? "Warsaw, Poland",
      lat:      (inp.lat   as number) ?? 52.23,
      lng:      (inp.lng   as number) ?? 21.01,
      timezone: "Europe/Warsaw",
    },
  };
}

// ─── Load fixtures ──────────────────────────────────────────────────────────

const fixtureDir = join(__dirname, "../tests/fixtures/charts");
const charts: NatalChart[] = readdirSync(fixtureDir)
  .filter(f => f.endsWith(".json"))
  .sort()
  .map(f => adaptFixture(JSON.parse(readFileSync(join(fixtureDir, f), "utf8"))));

console.log(`Załadowano ${charts.length} chart fixtures.`);

// ─── Compute stats ──────────────────────────────────────────────────────────

const YEARS = Array.from({ length: 10 }, (_, i) => 2020 + i); // 2020–2029
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const allWindowCounts: number[]    = [];
const allWindowScores: number[]    = [];
const powerWindowCounts: number[]  = []; // how many windows per month have score >= nth percentile
const top5thScores:     number[]   = []; // score of the 5th-best window each month (0 if <5 windows)

let processed = 0;
const total = charts.length * YEARS.length * MONTHS.length;
process.stdout.write(`Przetwarzanie ${total} miesięcy (${charts.length} charts × ${YEARS.length} years × ${MONTHS.length} months)...\n`);

for (const chart of charts) {
  for (const year of YEARS) {
    for (const month of MONTHS) {
      const windows = getWindowsForMonth(chart, year, month);
      allWindowCounts.push(windows.length);
      for (const w of windows) allWindowScores.push(w.score);

      // How many distinct peak days would be shown (top-5 by score, but only count if score > 0)
      const top5 = windows.slice(0, 5);
      powerWindowCounts.push(top5.length);
      top5thScores.push(top5.length >= 5 ? top5[4].score : 0);

      processed++;
      if (processed % 100 === 0) {
        process.stdout.write(`  ${processed}/${total}\r`);
      }
    }
  }
}

process.stdout.write("\n");

// ─── Percentile helper ──────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

function stats(label: string, arr: number[]) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  console.log(`\n${label} (n=${arr.length}):`);
  console.log(`  min=${sorted[0].toFixed(1)}  p25=${percentile(sorted,25).toFixed(1)}  p50=${percentile(sorted,50).toFixed(1)}  p75=${percentile(sorted,75).toFixed(1)}  p90=${percentile(sorted,90).toFixed(1)}  p95=${percentile(sorted,95).toFixed(1)}  max=${sorted[sorted.length-1].toFixed(1)}  mean=${mean.toFixed(1)}`);
}

// ─── Results ────────────────────────────────────────────────────────────────

console.log("\n════════════════════════════════════════════════════════");
console.log("  WYNIKI KALIBRACJI KALENDARZA");
console.log("════════════════════════════════════════════════════════");

stats("Liczba okien / miesiąc", allWindowCounts);
stats("Score okna (TransitWindow.score)", allWindowScores);
stats("Liczba top-5 okien / miesiąc (power windows)", powerWindowCounts);
stats("Score 5. okna w miesiącu (próg Dnia Mocy)", top5thScores.filter(s => s > 0));

const sortedCounts = [...allWindowCounts].sort((a, b) => a - b);
const p50count  = percentile(sortedCounts, 50);
const p90count  = percentile(sortedCounts, 90);
const sortedScores = [...allWindowScores].sort((a, b) => a - b);
const p25score  = percentile(sortedScores, 25);
const p50score  = percentile(sortedScores, 50);
const p90score  = percentile(sortedScores, 90);

// Median 5th-best score (for months with >=5 windows)
const fifthScoresSorted = [...top5thScores.filter(s => s > 0)].sort((a, b) => a - b);
const medianFifthScore = percentile(fifthScoresSorted, 50);

console.log("\n════════════════════════════════════════════════════════");
console.log("  ZALECANE STAŁE DLA calendarLimits.ts");
console.log("════════════════════════════════════════════════════════");
console.log(`
// Liczba okien w typowym miesiącu (p50=${p50count}, p90=${p90count})
// Próg score okna (p25=${p25score.toFixed(0)}, p50=${p50score.toFixed(0)}, p90=${p90score.toFixed(0)})
// Mediana score 5. okna w miesiącu: ${medianFifthScore.toFixed(0)}

export const WINDOW_MIN_SCORE      = 15;  // aktualny próg w windows.ts (MIN_SCORE)
export const POWER_WINDOWS_PER_MONTH = 5; // top-N okien = Dni Mocy (spec)
export const POWER_DAY_SANITY_CAP  = 8;  // max ★ na miesiąc (spec)
`);
