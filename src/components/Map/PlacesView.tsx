"use client";

import { useMemo, useState } from "react";
import PlaceCard from "@/components/Map/PlaceCard";
import type { CuratedCity, Continent } from "@/lib/curatedCities";
import type { Astrocartography } from "@/lib/astrocartography";
import { activeLinesForCity } from "@/lib/astrocartography";
import type { Intention } from "@/lib/intentions";

const CONTINENT_LABELS: Record<string, string> = {
  all: "Wszystkie",
  europe: "Europa",
  asia: "Azja",
  middle_east: "Bliski Wschód",
  africa: "Afryka",
  north_america: "Ameryki Pn.",
  south_america: "Ameryki Pd.",
  oceania: "Oceania",
};

const PAGE_SIZE = 16;
const STRONG_ORB_KM = 700;
const WEAK_ORB_KM = 1200;

interface RankedPlace {
  city: CuratedCity;
  score: number;
  strongestLine: ReturnType<typeof activeLinesForCity>[number] | null;
}

function rankCities(
  cities: CuratedCity[],
  astro: Astrocartography,
  intention: Intention,
  continent: string,
): { strong: RankedPlace[]; weak: RankedPlace[] } {
  let filtered = cities.filter((c) => c.intention_matches.includes(intention.id));
  if (continent !== "all") filtered = filtered.filter((c) => c.continent === continent);

  const intentionLineKeys = new Set(intention.primary_lines.map((l) => `${l.planet}-${l.type}`));

  const scored: RankedPlace[] = filtered.map((city) => {
    const active = activeLinesForCity({ lat: city.lat, lon: city.lon }, astro, WEAK_ORB_KM);
    const matching = active.filter((l) => intentionLineKeys.has(`${l.planet}-${l.type}`));
    if (matching.length === 0) return null as unknown as RankedPlace;

    const lineScore = matching.reduce((sum, line) => {
      const def = intention.primary_lines.find((p) => p.planet === line.planet && p.type === line.type);
      return sum + (def?.weight ?? 0) * ((WEAK_ORB_KM - line.distance_km) / WEAK_ORB_KM);
    }, 0);

    const culturalScore = city.travel_relevance / 5;

    return {
      city,
      score: lineScore * 0.7 + culturalScore * 0.3,
      strongestLine: matching[0] ?? null,
    };
  }).filter(Boolean) as RankedPlace[];

  scored.sort((a, b) => b.score - a.score);

  const strong = scored.filter((p) => p.strongestLine && p.strongestLine.distance_km <= STRONG_ORB_KM).slice(0, 80);
  const weak = scored.filter((p) => p.strongestLine && p.strongestLine.distance_km > STRONG_ORB_KM);

  return { strong, weak };
}

interface Props {
  intention: Intention;
  astro: Astrocartography;
  cities: CuratedCity[];
  teasers: Record<string, string>;
  onPlaceClick: (city: CuratedCity, strongestLine: ReturnType<typeof activeLinesForCity>[number] | null) => void;
}

export default function PlacesView({ intention, astro, cities, teasers, onPlaceClick }: Props) {
  const [continent, setContinent] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { strong, weak } = useMemo(
    () => rankCities(cities, astro, intention, continent),
    [cities, astro, intention, continent],
  );

  const visibleStrong = strong.slice(0, page * PAGE_SIZE);
  const hasMoreStrong = visibleStrong.length < strong.length;

  const continents = useMemo(() => {
    const used = new Set<string>(["all"]);
    cities.filter((c) => c.intention_matches.includes(intention.id)).forEach((c) => used.add(c.continent));
    return ["all", ...Array.from(used).filter((c) => c !== "all")];
  }, [cities, intention]);

  return (
    <div className="space-y-4">
      {/* Continent filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        {continents.map((c) => (
          <button
            key={c}
            onClick={() => { setContinent(c); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap font-medium transition-all shrink-0 border ${
              continent === c
                ? "bg-amber-800/40 text-amber-200 border-amber-600/40"
                : "text-slate-500 border-slate-700/30 hover:text-slate-300"
            }`}
          >
            {CONTINENT_LABELS[c] ?? c}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {strong.length === 0 && weak.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center text-slate-500 text-sm">
          Delikatniejszy rezonans — twoja energia dla <strong className="text-slate-400">{intention.label}</strong> jest rozproszona globalnie.
          <br />Spróbuj innej intencji lub zmień kontynent na Wszystkie.
        </div>
      )}

      {/* Strong grid */}
      {strong.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {visibleStrong.map(({ city, strongestLine }) => (
            <PlaceCard
              key={city.slug}
              city={city}
              strongestLine={strongestLine}
              teaser={teasers[city.slug]}
              onClick={() => onPlaceClick(city, strongestLine)}
            />
          ))}
        </div>
      )}

      {/* Load more strong */}
      {hasMoreStrong && (
        <div className="text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-2.5 text-sm text-slate-400 border border-slate-700/40 rounded-xl hover:border-amber-700/40 hover:text-slate-200 transition-all"
          >
            Pokaż więcej miejsc ({strong.length - visibleStrong.length} pozostałych)
          </button>
        </div>
      )}

      {/* Weak / subtle resonance section */}
      {weak.length > 0 && (
        <div className="mt-6">
          <div className="pt-4 border-t border-slate-700/20 mb-3">
            <p className="text-xs text-slate-500 italic">
              Delikatniejszy rezonans — linie dla tej intencji działają w twoim chartzie bardziej rozległe. Te miejsca rezonują subtelniej, ale wciąż na tej energii.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 opacity-70">
            {weak.map(({ city, strongestLine }) => (
              <PlaceCard
                key={city.slug}
                city={city}
                strongestLine={strongestLine}
                teaser={teasers[city.slug]}
                onClick={() => onPlaceClick(city, strongestLine)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
