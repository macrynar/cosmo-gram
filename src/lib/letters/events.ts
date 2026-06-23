// Detekcja eventów dla listów wyzwalanych tranzytem (Faza 6). KOD liczy warunek;
// AI tylko pisze. Wszystko z istniejącego silnika tranzytów (transits.ts) + chart-engine.
//
//  - Powrót Saturna: tranzytujący Saturn w koniunkcji z natalnym Saturnem (~29/59 r.ż.).
//  - Sezon przemiany: wolna planeta (Pluton/Saturn/Uran) w twardym aspekcie do osobistej planety.
//  - Twój rok (Solar Return): tranzytujące Słońce wraca do natalnego Słońca (rocznica).

import { getTransitsForDate } from "@/lib/astro/transits";
import { calculateChart } from "@/lib/chart-engine";
import { ASPECT_LABEL_PL } from "@/lib/i18n/astro";
import type { NatalChart } from "@/lib/astro-types";

const SEZON_PLANETS = new Set(["Pluton", "Saturn", "Uran"]);
const PERSONAL = new Set(["Słońce", "Księżyc", "Merkury", "Wenus", "Mars"]);
const HARD = new Set(["conjunction", "square", "opposition"]);
const DAY_MS = 86_400_000;
const YEAR_DAYS = 365.2425;

export interface DetectedEvent {
  slug: string;        // szablon z katalogu
  event_key: string;   // klucz idempotencji (1 dostawa na instancję eventu)
  priority: number;    // wyższy = dostarczany pierwszy
  title: string;
  context: string;     // deterministyczne fakty tranzytu do zacytowania w liście
}

function ageOn(birthDate: string, date: Date): number {
  const b = new Date(`${birthDate}T12:00:00Z`).getTime();
  return (date.getTime() - b) / (YEAR_DAYS * DAY_MS);
}

export function detectEvents(chart: NatalChart, date: Date): DetectedEvent[] {
  const transits = getTransitsForDate(chart, date);
  const bd = chart.birthData;
  const full = calculateChart({ date: bd.date, time: bd.time, lat: bd.lat, lng: bd.lng, place: bd.place, timeUnknown: bd.timeUnknown });
  const houseOf = (name: string) => full.placements.find((p) => p.planet === name)?.house ?? null;
  const signOf = (name: string) => chart.planets.find((p) => p.name === name)?.sign ?? full.placements.find((p) => p.planet === name)?.sign ?? "";
  const houseStr = (name: string) => { const h = houseOf(name); return h ? `, ${h} dom` : ""; };

  const out: DetectedEvent[] = [];

  // ── Powrót Saturna ──
  const saturnRet = transits.find(
    (t) => t.transitPlanet === "Saturn" && t.natalPoint === "Saturn" && t.aspectType === "conjunction" && t.orbDegrees <= 3
  );
  if (saturnRet) {
    const idx = ageOn(bd.date, date) < 45 ? 1 : 2;
    out.push({
      slug: "powrot-saturna",
      event_key: `saturn:${idx}`,
      priority: 30,
      title: "Powrót Saturna",
      context: `Wyzwalacz (zacytuj go w liście): Saturn wraca dokładnie tam, gdzie był w dniu Twoich narodzin — Twój natalny Saturn jest w znaku ${signOf("Saturn")}${houseStr("Saturn")}. To ${idx === 1 ? "pierwszy" : "drugi"} powrót Saturna w życiu (orb ${saturnRet.orbDegrees}°).`,
    });
  }

  // ── Sezon przemiany — najmocniejszy twardy tranzyt wolnej planety do osobistej ──
  const sezon = transits
    .filter((t) => SEZON_PLANETS.has(t.transitPlanet) && PERSONAL.has(t.natalPoint) && HARD.has(t.aspectType) && t.orbDegrees <= 2)
    .sort((a, b) => b.score - a.score)[0];
  if (sezon) {
    out.push({
      slug: "sezon-przemiany",
      event_key: `sezon:${sezon.transitPlanet}-${sezon.aspectType}-${sezon.natalPoint}`,
      priority: 20,
      title: "Sezon przemiany",
      context: `Wyzwalacz (zacytuj go w liście): ${sezon.transitPlanet} jest w napięciu (${ASPECT_LABEL_PL[sezon.aspectType] ?? sezon.aspectType}) do Twojego natalnego ${sezon.natalPoint} w znaku ${signOf(sezon.natalPoint)}${houseStr(sezon.natalPoint)} (orb ${sezon.orbDegrees}°, ${sezon.applying ? "narastający" : "słabnący"}). To długi, formujący tranzyt — sezon, nie chwila.`,
    });
  }

  // ── Twój rok — Solar Return ──
  const solar = transits.find(
    (t) => t.transitPlanet === "Słońce" && t.natalPoint === "Słońce" && t.aspectType === "conjunction" && t.orbDegrees <= 5
  );
  if (solar) {
    out.push({
      slug: "twoj-rok",
      event_key: `solar:${date.getUTCFullYear()}`,
      priority: 10,
      title: "Twój rok",
      context: `Wyzwalacz (zacytuj go w liście): Słońce wraca do punktu, w którym było w dniu Twoich narodzin — Twoje natalne Słońce jest w znaku ${signOf("Słońce")}${houseStr("Słońce")}. Zaczyna się nowy rok słoneczny, Twój osobisty początek.`,
    });
  }

  return out.sort((a, b) => b.priority - a.priority);
}
