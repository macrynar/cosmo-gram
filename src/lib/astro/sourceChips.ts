import type { ModuleId } from "@/lib/schemas/astroModule";
import type { NatalChart, HouseCusp } from "@/lib/astro-types";
import { longitudeToSign } from "@/lib/astro-types";
import { MODULE_SPECS } from "@/lib/moduleSpecs";

const SIGN_LOC: Record<string, string> = {
  "Baran": "Baranie", "Byk": "Byku", "Bliźnięta": "Bliźniętach",
  "Rak": "Raku", "Lew": "Lwie", "Panna": "Pannie",
  "Waga": "Wadze", "Skorpion": "Skorpionie", "Strzelec": "Strzelcu",
  "Koziorożec": "Koziorożcu", "Wodnik": "Wodniku", "Ryby": "Rybach",
};

const ROMAN: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
  7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII",
};

function getPlanetHouse(lon: number, houses: HouseCusp[]): number | null {
  if (houses.length < 12) return null;
  const norm = ((lon % 360) + 360) % 360;
  const sorted = [...houses].sort((a, b) => a.longitude - b.longitude);
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i].longitude;
    const end = sorted[(i + 1) % sorted.length].longitude;
    if (i === sorted.length - 1) {
      // Last segment wraps around 360→0
      if (norm >= start || norm < end) return sorted[i].house;
    } else {
      if (norm >= start && norm < end) return sorted[i].house;
    }
  }
  return null;
}

export function getSourceChips(
  moduleId: ModuleId,
  chart: NatalChart,
): string[] {
  const spec = MODULE_SPECS[moduleId];
  const hasExactTime = !chart.birthData.timeUnknown;
  const chips: string[] = [];

  for (const planetName of spec.primary_planets) {
    if (planetName === "Ascendent") {
      if (!hasExactTime) continue;
      const sign = longitudeToSign(chart.ascendant).name;
      chips.push(`ASC w ${SIGN_LOC[sign] ?? sign}`);
      continue;
    }

    const p = chart.planets.find(pl => pl.name === planetName);
    if (!p) continue;

    const signLoc = SIGN_LOC[p.sign] ?? p.sign;

    if (hasExactTime && chart.houses.length >= 12) {
      const house = getPlanetHouse(p.longitude, chart.houses);
      if (house) {
        chips.push(`${planetName} w ${signLoc} · ${ROMAN[house]} dom`);
        continue;
      }
    }

    chips.push(`${planetName} w ${signLoc}`);
  }

  return chips;
}
