"use client";

import * as Astronomy from "astronomy-engine";

export type MoonPhaseName = "new_moon" | "first_quarter" | "full_moon" | "last_quarter";

export const MOON_PHASE_INFO: Record<MoonPhaseName, {
  label: string;
  symbol: string;
  purpose: string;
}> = {
  new_moon:      { label: "Nów Księżyca",     symbol: "🌑", purpose: "Zasiewanie intencji" },
  first_quarter: { label: "Pierwsza kwadra",  symbol: "🌓", purpose: "Konkretna akcja" },
  full_moon:     { label: "Pełnia",            symbol: "🌕", purpose: "Kulminacja i puszczanie" },
  last_quarter:  { label: "Ostatnia kwadra",  symbol: "🌗", purpose: "Refleksja i integracja" },
};

export const RITUAL_PROMPTS: Record<MoonPhaseName, string[]> = {
  new_moon: [
    "Co chcesz, żeby weszło w twoje życie w ciągu najbliższych 29 dni?",
    "Jaką intencję chcesz dziś wypowiedzieć — w myślach lub na głos?",
    "Co próbuje się w tobie narodzić, gdy zwolnisz i posłuchasz ciszy?",
    "Jaką jedną zmianę zasiewasz dziś w sobie?",
    "Gdybyś miał wybrać jeden obszar życia do uważności przez najbliższy miesiąc — który by to był?",
  ],
  first_quarter: [
    "Jaki jeden konkretny krok zrobisz dziś w stronę intencji z nowiu?",
    "Co cię powstrzymywało w ostatnich dniach? Jak to dziś przełamiesz?",
    "Gdzie potrzebujesz działać, choć czujesz opór?",
    "Jaka decyzja czeka na twoje tak albo nie?",
    "Co możesz zrobić dziś — małego, konkretnego — żeby pchnąć coś do przodu?",
  ],
  full_moon: [
    "Co dziś chcesz zauważyć, docenić albo świadomie wypuścić?",
    "Co od ostatniego nowiu dojrzało w tobie — czy widzisz to?",
    "Jakiej prawdy unikałeś, która dziś chce wyjść na światło?",
    "Co kończysz — w projekcie, relacji lub w sobie?",
    "Gdzie w życiu jest coś, co spełniło swój cel i prosi o pożegnanie?",
  ],
  last_quarter: [
    "Czego nauczył cię ten cykl?",
    "Co zostawiasz za sobą, gdy ten cykl się kończy?",
    "Co potrzebuje twojej uwagi przed nowym nowiem?",
    "Co zrozumiałeś o sobie w ostatnich tygodniach?",
    "Jaki nawyk lub wzorzec warto odpuścić przed nowym początkiem?",
  ],
};

function getMoonAngle(date: Date): number {
  const moonGeo = Astronomy.GeoVector(Astronomy.Body.Moon, date, false);
  const moonLon = ((Astronomy.Ecliptic(moonGeo).elon % 360) + 360) % 360;
  const sunGeo  = Astronomy.GeoVector(Astronomy.Body.Sun, date, false);
  const sunLon  = ((Astronomy.Ecliptic(sunGeo).elon % 360) + 360) % 360;
  return ((moonLon - sunLon) % 360 + 360) % 360;
}

// Moon moves ~13.2° per day. Threshold 6.6° = half a day either side of exact phase.
const PHASE_THRESHOLD = 6.6;

export function computeMoonPhaseName(date: Date): MoonPhaseName | null {
  const noon = new Date(Date.UTC(
    date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0,
  ));
  const angle = getMoonAngle(noon);
  if (angle <= PHASE_THRESHOLD || angle >= 360 - PHASE_THRESHOLD) return "new_moon";
  if (Math.abs(angle - 90)  <= PHASE_THRESHOLD) return "first_quarter";
  if (Math.abs(angle - 180) <= PHASE_THRESHOLD) return "full_moon";
  if (Math.abs(angle - 270) <= PHASE_THRESHOLD) return "last_quarter";
  return null;
}

export function getRitualPrompt(phase: MoonPhaseName, dayOfYear: number): string {
  const pool = RITUAL_PROMPTS[phase];
  return pool[dayOfYear % pool.length];
}
