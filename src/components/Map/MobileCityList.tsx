"use client";

import type { ActiveLine, Astrocartography, Intention } from "@/lib/astrocartography";
import { activeLinesForCity, PLANET_PL, PLANET_EMOJI, PLANET_COLORS, LINE_PL_SHORT, INTENTION_FILTERS, PLANET_WEIGHT } from "@/lib/astrocartography";
import type { City } from "@/lib/cityDatabase";
import { CITIES } from "@/lib/cityDatabase";

interface CityScore {
  city: City;
  lines: ActiveLine[];
  score: number;
}

function computeTopCities(astro: Astrocartography, intention: Intention | null, limit = 20): CityScore[] {
  const results: CityScore[] = [];

  for (const city of CITIES) {
    const lines = activeLinesForCity({ lat: city.lat, lon: city.lon }, astro);
    if (lines.length === 0) continue;

    let filtered = lines;
    if (intention) {
      const rules = INTENTION_FILTERS[intention];
      filtered = lines.filter((l) => rules.some((r) => r.planet === l.planet && r.types.includes(l.type)));
    }
    if (filtered.length === 0) continue;

    const score = filtered.reduce((sum, l) => {
      const proximity = Math.max(0, 1 - l.distance_km / 700);
      const weight = PLANET_WEIGHT[l.planet] ?? 0.5;
      return sum + proximity * weight;
    }, 0);

    results.push({ city, lines: filtered, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

interface Props {
  astro: Astrocartography | null;
  intention: Intention | null;
  onCitySelect: (city: City) => void;
  selectedCity: City | null;
}

export default function MobileCityList({ astro, intention, onCitySelect, selectedCity }: Props) {
  if (!astro) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm">
        Ładuję dane…
      </div>
    );
  }

  const cities = computeTopCities(astro, intention, 20);

  if (cities.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm">
        Brak miast z aktywnymi liniami dla wybranej intencji.
      </div>
    );
  }

  return (
    <div className="divide-y divide-amber-900/15">
      {cities.map(({ city, lines }) => {
        const topLine = lines[0];
        const isSelected = selectedCity?.slug === city.slug;
        return (
          <button
            key={city.slug}
            onClick={() => onCitySelect(city)}
            className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors ${
              isSelected ? "bg-amber-900/20" : "hover:bg-amber-900/10"
            }`}
          >
            <span
              className="text-xl leading-none w-7 shrink-0"
              style={{ color: PLANET_COLORS[topLine.planet] }}
            >
              {PLANET_EMOJI[topLine.planet]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-white truncate">{city.name_pl}</div>
              <div className="text-xs text-slate-500 truncate">
                {PLANET_PL[topLine.planet]} {LINE_PL_SHORT[topLine.type]} · {city.country_pl}
              </div>
            </div>
            <span className="text-xs text-slate-600 shrink-0">{topLine.distance_km} km</span>
          </button>
        );
      })}
    </div>
  );
}

export { computeTopCities };
export type { CityScore };
