import type { Planet, LineType } from "@/lib/astrocartography";

export type IntentionId = "spokoj" | "milosc" | "sukces" | "tworczosc" | "duchowosc" | "transformacja";

export type Intention = {
  id: IntentionId;
  emoji: string;
  label: string;
  subtitle: string;
  description: string;
  primary_lines: Array<{ planet: Planet; type: LineType; weight: number }>;
  tone: string;
};

export const INTENTIONS: Intention[] = [
  {
    id: "spokoj",
    emoji: "🕊",
    label: "Spokój",
    subtitle: "Regeneracja, odpoczynek, powrót do siebie",
    description: "Miejsca, w których ciało zwalnia, a umysł znajduje ciszę.",
    primary_lines: [
      { planet: "Moon",    type: "IC",  weight: 1.0 },
      { planet: "Venus",   type: "IC",  weight: 0.9 },
      { planet: "Neptune", type: "IC",  weight: 0.85 },
      { planet: "Jupiter", type: "IC",  weight: 0.7 },
      { planet: "Moon",    type: "ASC", weight: 0.6 },
    ],
    tone: "spokojny, kojący, ciepły, sensoryczny — woda, światło, oddech",
  },
  {
    id: "milosc",
    emoji: "💞",
    label: "Miłość",
    subtitle: "Otwarcie serca, romans, partnerstwo",
    description: "Miejsca, gdzie ludzie zakochują się łatwiej, a dystans w sercu topnieje.",
    primary_lines: [
      { planet: "Venus", type: "DSC", weight: 1.0 },
      { planet: "Venus", type: "ASC", weight: 0.9 },
      { planet: "Moon",  type: "DSC", weight: 0.8 },
      { planet: "Venus", type: "IC",  weight: 0.7 },
      { planet: "Mars",  type: "DSC", weight: 0.6 },
    ],
    tone: "zmysłowy, ciepły, intymny — światło, zapach, dotyk",
  },
  {
    id: "sukces",
    emoji: "🌟",
    label: "Sukces",
    subtitle: "Widoczność, kariera, autorytet",
    description: "Miejsca, gdzie twoja praca i twoje imię zyskują wagę.",
    primary_lines: [
      { planet: "Sun",     type: "MC", weight: 1.0 },
      { planet: "Jupiter", type: "MC", weight: 0.95 },
      { planet: "Saturn",  type: "MC", weight: 0.8 },
      { planet: "Mars",    type: "MC", weight: 0.7 },
      { planet: "Mercury", type: "MC", weight: 0.6 },
    ],
    tone: "ambitny, jasny, strategiczny — miasto, wieżowce, kontakty",
  },
  {
    id: "tworczosc",
    emoji: "🎨",
    label: "Twórczość",
    subtitle: "Inspiracja, nowa wizja, artystyczna odwaga",
    description: "Miejsca, w których wyobraźnia mówi pełnym głosem.",
    primary_lines: [
      { planet: "Neptune", type: "MC",  weight: 1.0 },
      { planet: "Venus",   type: "MC",  weight: 0.9 },
      { planet: "Moon",    type: "ASC", weight: 0.8 },
      { planet: "Neptune", type: "ASC", weight: 0.75 },
      { planet: "Mercury", type: "ASC", weight: 0.6 },
    ],
    tone: "poetycki, sensoryczny, lekko mistyczny — atelier, muzyka, kawiarnie",
  },
  {
    id: "duchowosc",
    emoji: "🌌",
    label: "Duchowość",
    subtitle: "Transcendencja, cisza, łączność z większym",
    description: "Miejsca, w których codzienność staje się rytuałem.",
    primary_lines: [
      { planet: "Neptune", type: "ASC", weight: 1.0 },
      { planet: "Jupiter", type: "ASC", weight: 0.85 },
      { planet: "Saturn",  type: "IC",  weight: 0.8 },
      { planet: "Pluto",   type: "IC",  weight: 0.7 },
      { planet: "Moon",    type: "IC",  weight: 0.6 },
    ],
    tone: "kontemplatywny, prosty, lekko sacrum — światło, kamień, woda",
  },
  {
    id: "transformacja",
    emoji: "🔥",
    label: "Transformacja",
    subtitle: "Przełom, zmiana fundamentów, nowy ja",
    description: "Miejsca, które wyrywają z rutyny i przebudowują od zera.",
    primary_lines: [
      { planet: "Pluto",   type: "ASC", weight: 1.0 },
      { planet: "Pluto",   type: "MC",  weight: 0.9 },
      { planet: "Uranus",  type: "ASC", weight: 0.85 },
      { planet: "Saturn",  type: "ASC", weight: 0.7 },
      { planet: "Mars",    type: "ASC", weight: 0.6 },
    ],
    tone: "intensywny, energetyczny, czasem niepokojący — ogień, ostra geografia, kontrast",
  },
];

export function getIntention(id: string): Intention | undefined {
  return INTENTIONS.find((i) => i.id === id);
}
