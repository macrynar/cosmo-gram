#!/usr/bin/env tsx
// Generuje referencyjne fixtures dla testów jednostkowych chart-engine.
// Uruchomienie: npm run fixtures:gen
// Wyniki zapisywane w tests/fixtures/charts/*.json

import { calculateChart } from "../src/lib/chart-engine";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const CASES = [
  // id, name, date, time, lat, lng, place, timeUnknown?
  { id: "ref-01", name: "Warsaw noon 1990",        date: "1990-06-15", time: "12:00", lat: 52.2297, lng: 21.0122, place: "Warsaw, Poland" },
  { id: "ref-02", name: "London midnight 2000",    date: "2000-01-01", time: "00:00", lat: 51.5074, lng: -0.1278, place: "London, UK" },
  { id: "ref-03", name: "Paris morning 1985",      date: "1985-03-21", time: "08:30", lat: 48.8566, lng: 2.3522,  place: "Paris, France" },
  { id: "ref-04", name: "New York afternoon 1970", date: "1970-07-04", time: "14:00", lat: 40.7128, lng: -74.006, place: "New York, USA" },
  { id: "ref-05", name: "Sydney evening 1995",     date: "1995-12-25", time: "20:00", lat: -33.8688, lng: 151.2093, place: "Sydney, Australia" },
  { id: "ref-06", name: "Moscow leap year 1960",   date: "1960-02-29", time: "01:00", lat: 55.7558, lng: 37.6173, place: "Moscow, Russia" },
  { id: "ref-07", name: "Tokyo year end 1999",     date: "1999-12-31", time: "23:00", lat: 35.6895, lng: 139.6917, place: "Tokyo, Japan" },
  { id: "ref-08", name: "Warsaw summer 1980",      date: "1980-08-01", time: "16:00", lat: 52.2297, lng: 21.0122, place: "Warsaw, Poland" },
  { id: "ref-09", name: "Buenos Aires 1950",       date: "1950-01-15", time: "06:00", lat: -34.6037, lng: -58.3816, place: "Buenos Aires, Argentina" },
  { id: "ref-10", name: "Warsaw no time",          date: "2005-09-23", time: "12:00", lat: 52.2297, lng: 21.0122, place: "Warsaw, Poland", timeUnknown: true },
] as const;

const outDir = join(process.cwd(), "tests", "fixtures", "charts");
mkdirSync(outDir, { recursive: true });

for (const c of CASES) {
  const result = calculateChart({
    date: c.date,
    time: c.time,
    lat: c.lat,
    lng: c.lng,
    place: c.place,
    timeUnknown: "timeUnknown" in c ? c.timeUnknown : false,
  });

  const fixture = {
    meta: { id: c.id, name: c.name, input: c },
    // Store planet positions for regression testing
    planets: result.chart.planets.map(p => ({
      name: p.name,
      sign: p.sign,
      longitude: p.longitude,
      retrograde: p.isRetrograde,
    })),
    ascendant: "timeUnknown" in c && c.timeUnknown ? null : result.chart.ascendant,
    mc: "timeUnknown" in c && c.timeUnknown ? null : result.chart.mc,
    placements: result.placements,
    aspects: result.aspects,
  };

  const outPath = join(outDir, `${c.id}.json`);
  writeFileSync(outPath, JSON.stringify(fixture, null, 2));
  console.log(`✓ ${c.id} (${c.name}) → ${result.chart.planets[0].sign} Sun`);
}

console.log("\nDone! Verify planet positions against external ephemeris (astro.com) within ±0.1°.");
