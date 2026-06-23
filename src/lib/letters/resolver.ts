// Resolver placementów — KOD liczy, które deterministyczne punkty kosmogramu
// zasilają prompt listu. AI ich nie zgaduje (zasada: deterministyczne liczy kod).
//
// Stored chart_data (NatalChart) ma tylko planety/domy/asc/mc. Węzły i aspekty
// dolicza silnik z birthData przez calculateChart() — to ta sama deterministyczna
// funkcja, która stworzyła zapisany wykres, więc wynik jest identyczny.

import { calculateChart } from "@/lib/chart-engine";
import { longitudeToSign, type NatalChart } from "@/lib/astro-types";
import { ASPECT_LABEL_PL } from "@/lib/i18n/astro";
import type { PlacementInputs } from "@/types/letters";

const SIGN_ELEMENT: Record<string, "Ogień" | "Ziemia" | "Powietrze" | "Woda"> = {
  "Baran": "Ogień", "Lew": "Ogień", "Strzelec": "Ogień",
  "Byk": "Ziemia", "Panna": "Ziemia", "Koziorożec": "Ziemia",
  "Bliźnięta": "Powietrze", "Waga": "Powietrze", "Wodnik": "Powietrze",
  "Rak": "Woda", "Skorpion": "Woda", "Ryby": "Woda",
};

const POINT_LABEL: Record<string, string> = {
  "MC": "Medium Coeli (MC)",
  "Ascendent": "Ascendent",
  "Węzeł Północny": "Węzeł Północny",
  "Węzeł Południowy": "Węzeł Południowy",
};

export interface ResolvedPlacements {
  /** Deterministyczne fakty dla promptu — po jednym w linii, bez PII. */
  text: string;
  /** Krótki podpis fundamentu do chipa w skrzynce, np. "Słońce · Węzeł Północny · MC". */
  signatureLabel: string;
  /** Strukturalny zapis użytych punktów → placement_snapshot (audyt + reprodukcja). */
  snapshot: Record<string, unknown>;
}

function signOf(longitude: number): string {
  return longitudeToSign(longitude).name;
}

export function resolvePlacements(chart: NatalChart, inputs: PlacementInputs): ResolvedPlacements {
  const bd = chart.birthData;
  const full = calculateChart({
    date: bd.date, time: bd.time, lat: bd.lat, lng: bd.lng, place: bd.place, timeUnknown: bd.timeUnknown,
  });

  const planetByName = new Map(full.chart.planets.map((p) => [p.name, p]));
  const houseByName = new Map(full.placements.map((pl) => [pl.planet, pl.house]));
  const lines: string[] = [];
  const snapshot: Record<string, unknown> = {};

  // ── Planety ──
  if (inputs.planets?.length) {
    const out: Array<Record<string, unknown>> = [];
    for (const name of inputs.planets) {
      const p = planetByName.get(name);
      if (!p) continue;
      const house = houseByName.get(name) ?? null;
      lines.push(
        `- ${name}: ${p.sign}${house ? `, ${house} dom` : ""} (${p.degree}°)${p.isRetrograde ? ", ruch wsteczny" : ""}`
      );
      out.push({ planet: name, sign: p.sign, house, degree: p.degree, retrograde: p.isRetrograde });
    }
    snapshot.planets = out;
  }

  // ── Punkty (MC, Asc, węzły) ──
  if (inputs.points?.length) {
    const out: Array<Record<string, unknown>> = [];
    for (const point of inputs.points) {
      const label = POINT_LABEL[point] ?? point;
      if (point === "MC") {
        const sign = signOf(full.chart.mc);
        lines.push(`- ${label}: ${sign}`);
        out.push({ point, sign });
      } else if (point === "Ascendent") {
        const sign = signOf(full.chart.ascendant);
        lines.push(`- ${label}: ${sign}`);
        out.push({ point, sign });
      } else if (point === "Węzeł Północny") {
        const h = full.nodes.north_node_house;
        lines.push(`- ${label}: ${full.nodes.north_node_sign}${h ? `, ${h} dom` : ""}`);
        out.push({ point, sign: full.nodes.north_node_sign, house: h });
      } else if (point === "Węzeł Południowy") {
        const h = full.nodes.south_node_house;
        lines.push(`- ${label}: ${full.nodes.south_node_sign}${h ? `, ${h} dom` : ""}`);
        out.push({ point, sign: full.nodes.south_node_sign, house: h });
      }
    }
    snapshot.points = out;
  }

  // ── Domy (znak na kuspidzie + lokatorzy) ──
  if (inputs.houses?.length && !bd.timeUnknown) {
    const out: Array<Record<string, unknown>> = [];
    for (const n of inputs.houses) {
      const cusp = full.chart.houses.find((h) => h.house === n);
      if (!cusp) continue;
      const cuspSign = signOf(cusp.longitude);
      const tenants = full.placements.filter((pl) => pl.house === n).map((pl) => pl.planet);
      lines.push(
        `- Dom ${n}: na kuspidzie ${cuspSign}${tenants.length ? `; planety w domu: ${tenants.join(", ")}` : "; bez planet"}`
      );
      out.push({ house: n, cuspSign, tenants });
    }
    snapshot.houses = out;
  }

  // ── Aspekty z udziałem wskazanych ciał ──
  if (inputs.aspects_of?.length) {
    const wanted = new Set(inputs.aspects_of);
    const seen = new Set<string>();
    const out: Array<Record<string, unknown>> = [];
    for (const a of full.aspects) {
      if (!wanted.has(a.planet_a) && !wanted.has(a.planet_b)) continue;
      const key = [a.type, a.planet_a, a.planet_b].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const label = ASPECT_LABEL_PL[a.type] ?? a.type;
      lines.push(`- Aspekt: ${label} ${a.planet_a}–${a.planet_b}`);
      out.push({ type: a.type, a: a.planet_a, b: a.planet_b });
    }
    if (out.length === 0) lines.push(`- Aspekty: ${inputs.aspects_of.join(", ")} bez ścisłych aspektów głównych`);
    snapshot.aspects = out;
  }

  // ── Dominujący żywioł ──
  if (inputs.element_balance) {
    const counts: Record<string, number> = { "Ogień": 0, "Ziemia": 0, "Powietrze": 0, "Woda": 0 };
    for (const p of full.chart.planets) {
      const el = SIGN_ELEMENT[p.sign];
      if (el) counts[el]++;
    }
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    lines.push(`- Dominujący żywioł: ${dominant[0]} (${dominant[1]} z 10 planet)`);
    snapshot.element = { counts, dominant: dominant[0] };
  }

  // ── Podpis fundamentu (chip) ──
  const sig: string[] = [];
  (inputs.planets ?? []).forEach((p) => sig.push(p));
  (inputs.points ?? []).forEach((pt) => sig.push(pt === "MC" ? "MC" : pt));
  if (inputs.houses?.length) sig.push(`domy ${inputs.houses.join(", ")}`);
  if (inputs.element_balance) sig.push("żywioł");

  return {
    text: lines.join("\n"),
    signatureLabel: sig.join(" · "),
    snapshot,
  };
}
