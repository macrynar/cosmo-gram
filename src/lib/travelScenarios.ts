import type { Planet, LineType } from "@/lib/astrocartography";

export type ScenarioPrimaryLine = {
  planet: Planet;
  type: LineType;
  weight: number;
};

export type Scenario = {
  id: string;
  emoji: string;
  label: string;
  subtitle: string;
  primary_lines: ScenarioPrimaryLine[];
  default_duration_days: { min: number; max: number };
  tone: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "regen",
    emoji: "🏖️",
    label: "Wakacje regeneracyjne",
    subtitle: "Odpocząć, naładować, zwolnić",
    primary_lines: [
      { planet: "Moon",    type: "IC",  weight: 1.0 },
      { planet: "Venus",   type: "IC",  weight: 0.9 },
      { planet: "Neptune", type: "IC",  weight: 0.8 },
      { planet: "Jupiter", type: "IC",  weight: 0.7 },
    ],
    default_duration_days: { min: 7, max: 14 },
    tone: "spokojny",
  },
  {
    id: "romance",
    emoji: "💑",
    label: "Romantyczny wyjazd",
    subtitle: "Z partnerem albo żeby kogoś poznać",
    primary_lines: [
      { planet: "Venus", type: "DSC", weight: 1.0 },
      { planet: "Venus", type: "ASC", weight: 0.9 },
      { planet: "Moon",  type: "DSC", weight: 0.8 },
      { planet: "Mars",  type: "DSC", weight: 0.7 },
    ],
    default_duration_days: { min: 3, max: 5 },
    tone: "zmysłowy",
  },
  {
    id: "retreat",
    emoji: "🧘",
    label: "Retreat / praca nad sobą",
    subtitle: "Wyjść z trybu codzienności, pójść głębiej",
    primary_lines: [
      { planet: "Neptune", type: "ASC", weight: 1.0 },
      { planet: "Pluto",   type: "IC",  weight: 0.9 },
      { planet: "Saturn",  type: "IC",  weight: 0.8 },
      { planet: "Moon",    type: "ASC", weight: 0.7 },
    ],
    default_duration_days: { min: 7, max: 14 },
    tone: "transformacyjny",
  },
  {
    id: "sabbatical",
    emoji: "🚀",
    label: "Sabbatical / praca zdalna 1-3 mc",
    subtitle: "Dłuższy wyjazd z laptopem",
    primary_lines: [
      { planet: "Sun",     type: "MC",  weight: 1.0 },
      { planet: "Jupiter", type: "MC",  weight: 0.9 },
      { planet: "Mercury", type: "MC",  weight: 0.8 },
      { planet: "Jupiter", type: "ASC", weight: 0.7 },
    ],
    default_duration_days: { min: 30, max: 90 },
    tone: "ambitny",
  },
  {
    id: "breakout",
    emoji: "⚡",
    label: "Coś szalonego",
    subtitle: "Przełamać rutynę, dostać kopa",
    primary_lines: [
      { planet: "Uranus",  type: "ASC", weight: 1.0 },
      { planet: "Mars",    type: "ASC", weight: 0.9 },
      { planet: "Jupiter", type: "ASC", weight: 0.8 },
      { planet: "Sun",     type: "ASC", weight: 0.7 },
    ],
    default_duration_days: { min: 5, max: 10 },
    tone: "energetyczny",
  },
  {
    id: "creative",
    emoji: "🎨",
    label: "Inspiracja kreatywna",
    subtitle: "Odblokować twórczość, znaleźć nowy język",
    primary_lines: [
      { planet: "Neptune", type: "MC",  weight: 1.0 },
      { planet: "Venus",   type: "MC",  weight: 0.9 },
      { planet: "Moon",    type: "ASC", weight: 0.8 },
      { planet: "Mercury", type: "ASC", weight: 0.7 },
    ],
    default_duration_days: { min: 7, max: 14 },
    tone: "poetycki",
  },
  {
    id: "networking",
    emoji: "🏛️",
    label: "Networking / konferencja",
    subtitle: "Krótki wyjazd zawodowy z efektem",
    primary_lines: [
      { planet: "Jupiter", type: "MC",  weight: 1.0 },
      { planet: "Sun",     type: "MC",  weight: 0.9 },
      { planet: "Mercury", type: "MC",  weight: 0.8 },
      { planet: "Mercury", type: "DSC", weight: 0.7 },
    ],
    default_duration_days: { min: 2, max: 7 },
    tone: "profesjonalny",
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}
