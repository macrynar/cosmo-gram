"use client";

import { useMemo } from "react";
import * as Astronomy from "astronomy-engine";
import { longitudeToSign } from "@/lib/astro-types";
import type { NatalChart } from "@/lib/astro-types";

type Event = {
  daysFromNow: number;
  planet: string;
  newSign: string;
  meaning: string;
};

const TRACKED_PLANETS: Array<{ name: string; body: Astronomy.Body }> = [
  { name: "Mars",    body: Astronomy.Body.Mars    },
  { name: "Jowisz", body: Astronomy.Body.Jupiter },
  { name: "Saturn",  body: Astronomy.Body.Saturn  },
  { name: "Wenus",   body: Astronomy.Body.Venus   },
  { name: "Merkury", body: Astronomy.Body.Mercury },
];

// What each planet governs when entering a sign
const PLANET_INGRESS_MEANING: Record<string, Record<string, string>> = {
  "Merkury": {
    "Rak":        "komunikacja staje się bardziej emocjonalna i intuicyjna",
    "Lew":        "słowa nabierają mocy — czas na odważne rozmowy i prezentacje",
    "Panna":      "myślenie staje się analityczne — dobry czas na planowanie i korekty",
    "Waga":       "sprzyja dyplomacji i kompromisowi w rozmowach",
    "Skorpion":   "komunikacja wchodzi w głębię — rozmowy dotykają sedna",
    "Strzelec":   "myślenie staje się szersze — czas na wizje i duże plany",
    "Koziorożec": "komunikacja staje się bardziej konkretna i praktyczna",
    "Wodnik":     "oryginalne pomysły i niekonwencjonalne myślenie na prowadzeniu",
    "Ryby":       "intuicja i wrażliwość w komunikacji — słuchaj między wierszami",
    "Baran":      "decyzje podejmowane szybciej — czas na inicjatywę",
    "Byk":        "stabilne myślenie, dobry czas na finanse i praktyczne rozmowy",
    "Bliźnięta":  "przyspieszenie komunikacji, wielotorowe myślenie i nauka",
  },
  "Wenus": {
    "Rak":        "relacje wchodzą w klimat troski i emocjonalnej bliskości",
    "Lew":        "czas na wyrażanie uczuć głośno — relacje chcą ciepła i afirmacji",
    "Panna":      "miłość przez dbałość o detale i codzienną służbę drugiemu człowiekowi",
    "Waga":       "szczyt energii Wenus — partnerstwo, estetyka i harmonia",
    "Skorpion":   "relacje wchodzą głębiej — czas na autentyczność i intensywność",
    "Strzelec":   "miłość przez przygodę, wolność i wspólne odkrywanie świata",
    "Koziorożec": "relacje przez zobowiązanie i budowanie czegoś razem",
    "Wodnik":     "przyjaźń i wolność w relacjach — niekonwencjonalne podejście",
    "Ryby":       "romantyzm i współczucie — czas na bezwarunkową miłość",
    "Baran":      "nowe zainteresowania i odważne gesty w relacjach",
    "Byk":        "stabilność, zmysłowość i piękno — czas na przyjemności",
    "Bliźnięta":  "lekkość i intelektualny flirt — relacje przez rozmowę",
  },
  "Mars": {
    "Baran":      "energia na najwyższych obrotach — czas na inicjatywę i nowe starty",
    "Byk":        "energia powolna, ale wytrwała — skuteczne działanie przez regularność",
    "Bliźnięta":  "działanie staje się wielotorowe — kilka projektów naraz jest ok",
    "Rak":        "energia idzie w kierunku domu, rodziny i emocjonalnego bezpieczeństwa",
    "Lew":        "ekspresja i odwaga — czas na działanie z pasją i pewnością siebie",
    "Panna":      "skupiona praca i doskonalenie detali — mniej ognia, więcej precyzji",
    "Waga":       "działanie przez kompromis — decyzje wymagają rozważenia wszystkich stron",
    "Skorpion":   "intensywna energia i determinacja — czas na głęboki push",
    "Strzelec":   "działanie przez wizję i optymizm — czas na duże cele",
    "Koziorożec": "Mars w szczycie — ambicja, struktura i dążenie do celu",
    "Wodnik":     "działanie na rzecz wspólnoty i zmian systemowych",
    "Ryby":       "energia ulotna — ważniejsza jest intuicja niż plan",
  },
  "Jowisz": {
    "Baran":      "ekspansja przez odwagę i inicjatywę — okno na nowe projekty",
    "Byk":        "wzrost przez stabilność i budowanie — dobry czas na finanse i majątek",
    "Bliźnięta":  "wzrost przez wiedzę, podróże i intelektualną eksplorację",
    "Rak":        "ekspansja przez rodzinę, emocje i bezpieczeństwo",
    "Lew":        "Jowisz wchodzi w Lwa — duże możliwości przez pewność siebie i wyraz",
    "Panna":      "wzrost przez pracę i doskonalenie — szczegóły przynoszą wyniki",
    "Waga":       "ekspansja przez partnerstwo i współpracę",
    "Skorpion":   "wzrost przez transformację i głębię — co trudne, staje się wartościowe",
    "Strzelec":   "Jowisz w domu — ekspansja, przygoda i poszukiwanie sensu",
    "Koziorożec": "wzrost przez ambicję i cierpliwą pracę na cel",
    "Wodnik":     "ekspansja przez innowacje i działanie na rzecz innych",
    "Ryby":       "wzrost przez wrażliwość, sztukę i duchowość",
  },
  "Saturn": {
    "Baran":      "Saturn wymaga struktury i dyscypliny w nowych projektach",
    "Byk":        "czas na budowanie trwałych fundamentów finansowych",
    "Bliźnięta":  "Saturn strukturyzuje komunikację — czas na poważne nauki i zobowiązania",
    "Rak":        "lekcja odpowiedzialności w domu i relacjach rodzinnych",
    "Lew":        "Saturn w Lwie — czas na poważne podejście do wyrazu i twórczości",
    "Panna":      "dyscyplina w pracy i rutynach przynosi wymierne efekty",
    "Waga":       "Saturn w Wadze — czas na odpowiedzialne relacje i zobowiązania",
    "Skorpion":   "głębia i transformacja wymagają cierpliwości i pracy",
    "Strzelec":   "strukturyzowanie wizji — czas na realizm w dużych planach",
    "Koziorożec": "Saturn w domu — szczyt dyscypliny, ambicji i budowania kariery",
    "Wodnik":     "budowanie trwałych struktur dla wspólnoty i przyszłości",
    "Ryby":       "czas na poważne podejście do intuicji, duchowości i granic",
  },
};

const PLANET_DEFAULT: Record<string, string> = {
  "Merkury": "zmiana stylu myślenia i komunikacji",
  "Wenus":   "zmiana klimatu w relacjach i sferze finansowej",
  "Mars":    "nowy kierunek energii i działania",
  "Jowisz":  "nowe okno możliwości i ekspansji",
  "Saturn":  "nowe lekcje i obszar do zbudowania struktury",
};

function getEclipticLon(body: Astronomy.Body, date: Date): number {
  const geo = Astronomy.GeoVector(body, date, false);
  const ecl = Astronomy.Ecliptic(geo);
  return ((ecl.elon % 360) + 360) % 360;
}

function computeUpcoming(fromDate: Date, days: number): Event[] {
  const events: Event[] = [];
  const today = new Date(fromDate);

  for (const { name, body } of TRACKED_PLANETS) {
    let prevSign = longitudeToSign(getEclipticLon(body, today)).name;

    for (let d = 1; d <= days; d++) {
      const date = new Date(today.getTime() + d * 86400000);
      const sign = longitudeToSign(getEclipticLon(body, date)).name;
      if (sign !== prevSign) {
        const meaning =
          PLANET_INGRESS_MEANING[name]?.[sign] ??
          `${PLANET_DEFAULT[name] ?? "zmiana energii planetarnej"} (${sign})`;
        events.push({ daysFromNow: d, planet: name, newSign: sign, meaning });
        prevSign = sign;
      }
    }
  }

  return events.sort((a, b) => a.daysFromNow - b.daysFromNow).slice(0, 5);
}

type Props = { chart: NatalChart };

export default function UpcomingEvents({ chart: _ }: Props) {
  const events = useMemo(() => computeUpcoming(new Date(), 60), []);

  if (events.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 border border-white/10">
      <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">Nadchodzące zdarzenia</h3>
      <ul className="space-y-3.5">
        {events.map((e) => (
          <li key={`${e.planet}-${e.newSign}`} className="flex gap-3">
            <span className="text-amber-400 font-medium text-sm w-14 shrink-0 pt-0.5">
              {e.daysFromNow === 1 ? "Jutro" : `Za ${e.daysFromNow} dni`}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-200">
                <span className="font-medium text-white">{e.planet}</span>
                {" wchodzi w "}
                <span className="text-amber-200">{e.newSign}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{e.meaning}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
