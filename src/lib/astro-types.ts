export interface Planet {
  name: string;
  symbol: string;
  longitude: number; // 0-360 ecliptic longitude
  sign: string;
  signSymbol: string;
  degree: number; // 0-29 within sign
  minute: number;
  isRetrograde: boolean;
}

export interface HouseCusp {
  house: number;
  longitude: number;
}

export interface NatalChart {
  planets: Planet[];
  houses: HouseCusp[];
  ascendant: number;
  mc: number;
  birthData: {
    date: string;
    time: string;
    place: string;
    lat: number;
    lng: number;
    timezone: string;
    timeUnknown?: boolean;
  };
}

export const ZODIAC_SIGNS = [
  { name: "Baran", symbol: "♈", from: 0 },
  { name: "Byk", symbol: "♉", from: 30 },
  { name: "Bliźnięta", symbol: "♊", from: 60 },
  { name: "Rak", symbol: "♋", from: 90 },
  { name: "Lew", symbol: "♌", from: 120 },
  { name: "Panna", symbol: "♍", from: 150 },
  { name: "Waga", symbol: "♎", from: 180 },
  { name: "Skorpion", symbol: "♏", from: 210 },
  { name: "Strzelec", symbol: "♐", from: 240 },
  { name: "Koziorożec", symbol: "♑", from: 270 },
  { name: "Wodnik", symbol: "♒", from: 300 },
  { name: "Ryby", symbol: "♓", from: 330 },
];

export function longitudeToSign(longitude: number): { name: string; symbol: string; degree: number; minute: number } {
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const sign = ZODIAC_SIGNS[signIndex];
  const posInSign = normalized - signIndex * 30;
  const degree = Math.floor(posInSign);
  const minute = Math.floor((posInSign - degree) * 60);
  return { name: sign.name, symbol: sign.symbol, degree, minute };
}

export const PLANET_COLORS: Record<string, string> = {
  "Słońce": "#f59e0b",
  "Księżyc": "#94a3b8",
  "Merkury": "#fbbf24",
  "Wenus": "#10b981",
  "Mars": "#ef4444",
  "Jowisz": "#f97316",
  "Saturn": "#6b7280",
  "Uran": "#06b6d4",
  "Neptun": "#3b82f6",
  "Pluton": "#8b5cf6",
};
