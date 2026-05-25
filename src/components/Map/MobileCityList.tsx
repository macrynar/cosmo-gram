"use client";

import type { ActiveLine, Astrocartography } from "@/lib/astrocartography";
import { activeLinesForCity, PLANET_EMOJI, PLANET_COLORS, PLANET_WEIGHT } from "@/lib/astrocartography";
import type { City, CityRegion, CityContinent } from "@/lib/cityDatabase";
import { CITIES, getCityRegion, getCityContinent } from "@/lib/cityDatabase";
import type { Scenario } from "@/lib/travelScenarios";
import { getLineDescription } from "@/lib/lineDescriptions";

export interface CityScore {
  city: City;
  lines: ActiveLine[];
  score: number;
}

export function computeTopCities(
  astro: Astrocartography,
  scenario: Scenario | null,
  limit = 20,
  region: CityRegion | "global" = "global",
): CityScore[] {
  const results: CityScore[] = [];

  const scenarioPlanetSet = new Set(
    scenario?.primary_lines.map(l => `${l.planet}-${l.type}`) ?? [],
  );

  for (const city of CITIES) {
    if (region !== "global" && getCityRegion(city.slug) !== region) continue;

    const allLines = activeLinesForCity({ lat: city.lat, lon: city.lon }, astro);
    if (allLines.length === 0) continue;

    const relevant = scenario
      ? allLines.filter(l => scenarioPlanetSet.has(`${l.planet}-${l.type}`))
      : allLines;
    if (relevant.length === 0) continue;

    const score = relevant.reduce((sum, l) => {
      const proximity = Math.max(0, 1 - l.distance_km / 700);
      const scenarioWeight = scenario?.primary_lines.find(
        p => p.planet === l.planet && p.type === l.type,
      )?.weight ?? (PLANET_WEIGHT[l.planet] ?? 0.5);
      return sum + proximity * scenarioWeight;
    }, 0);

    results.push({ city, lines: relevant, score });
  }

  results.sort((a, b) => b.score - a.score);

  // For "global": top 5 per continent, interleaved (round-robin)
  if (region === "global") {
    const byContinent = new Map<CityContinent, CityScore[]>();
    for (const item of results) {
      const cont = getCityContinent(item.city.slug);
      const list = byContinent.get(cont) ?? [];
      if (list.length < 5) {
        list.push(item);
        byContinent.set(cont, list);
      }
    }
    const interleaved: CityScore[] = [];
    for (let i = 0; i < 5; i++) {
      for (const list of byContinent.values()) {
        if (list[i]) interleaved.push(list[i]);
      }
    }
    return interleaved.slice(0, limit);
  }

  return results.slice(0, limit);
}

interface Props {
  astro: Astrocartography | null;
  scenario: Scenario | null;
  onCitySelect: (city: City) => void;
  selectedCity: City | null;
  region?: CityRegion | "global";
}

export default function MobileCityList({ astro, scenario, onCitySelect, selectedCity, region = "global" }: Props) {
  if (!astro) {
    return <div className="p-6 text-center text-slate-500 text-sm">Ładuję dane…</div>;
  }

  const cities = computeTopCities(astro, scenario, 20, region);

  if (cities.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm">
        Brak miast z aktywnymi liniami dla tego scenariusza.
      </div>
    );
  }

  return (
    <div className="divide-y divide-amber-900/15">
      {cities.map(({ city, lines }) => {
        const topLine = lines[0];
        const isSelected = selectedCity?.slug === city.slug;
        const desc = getLineDescription(topLine.planet, topLine.type).short;
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
              <div className="font-medium text-sm text-white truncate">
                {city.name_pl}
                <span className="text-slate-600 text-[10px] font-normal ml-1.5">{city.country_pl}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate leading-snug">{desc}</div>
            </div>
            <span className="text-[11px] text-slate-600 shrink-0 ml-1">{topLine.distance_km} km</span>
          </button>
        );
      })}
    </div>
  );
}
