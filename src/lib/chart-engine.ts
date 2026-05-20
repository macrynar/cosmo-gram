import * as Astronomy from "astronomy-engine";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tzLookup = require("tz-lookup") as (lat: number, lng: number) => string;
import { longitudeToSign, ZODIAC_SIGNS, type NatalChart, type Planet, type HouseCusp } from "@/lib/astro-types";

const PLANET_DEFS = [
  { name: "Słońce",   symbol: "☉", body: Astronomy.Body.Sun     },
  { name: "Księżyc", symbol: "☽", body: Astronomy.Body.Moon    },
  { name: "Merkury", symbol: "☿", body: Astronomy.Body.Mercury },
  { name: "Wenus",   symbol: "♀", body: Astronomy.Body.Venus   },
  { name: "Mars",    symbol: "♂", body: Astronomy.Body.Mars    },
  { name: "Jowisz",  symbol: "♃", body: Astronomy.Body.Jupiter },
  { name: "Saturn",  symbol: "♄", body: Astronomy.Body.Saturn  },
  { name: "Uran",    symbol: "♅", body: Astronomy.Body.Uranus  },
  { name: "Neptun",  symbol: "♆", body: Astronomy.Body.Neptune },
  { name: "Pluton",  symbol: "⯓", body: Astronomy.Body.Pluto   },
];

function getEclipticLongitude(body: Astronomy.Body, date: Date): number {
  const geo = Astronomy.GeoVector(body, date, false);
  const ecl = Astronomy.Ecliptic(geo);
  return ((ecl.elon % 360) + 360) % 360;
}

function isRetrograde(body: Astronomy.Body, date: Date): boolean {
  try {
    if (body === Astronomy.Body.Sun || body === Astronomy.Body.Moon) return false;
    const d1 = date;
    const d2 = new Date(date.getTime() + 24 * 3600 * 1000);
    const lon1 = getEclipticLongitude(body, d1);
    const lon2 = getEclipticLongitude(body, d2);
    let delta = lon2 - lon1;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return delta < 0;
  } catch { return false; }
}

function calculateAngles(date: Date, lat: number, lng: number): { asc: number; mc: number } {
  const DEG = Math.PI / 180;
  const gast = Astronomy.SiderealTime(date);
  const lst = (gast + lng / 15 + 24) % 24;
  const ramc = (lst * 15) % 360;
  const ramcR = ramc * DEG;
  const latR  = lat * DEG;
  const jd     = Astronomy.MakeTime(date).ut + 2451545.0;
  const T      = (jd - 2451545.0) / 36525;
  const eps    = (23.439291111 - 0.013004167 * T) * DEG;

  let mcRad = Math.atan2(Math.sin(ramcR), Math.cos(ramcR) * Math.cos(eps));
  let mc = ((mcRad / DEG) + 360) % 360;
  if (ramc > 180 && mc < 180) mc += 180;
  if (ramc < 180 && mc > 180) mc -= 180;
  mc = ((mc % 360) + 360) % 360;

  const numerator   = Math.cos(ramcR);
  const denominator = -(Math.sin(ramcR) * Math.cos(eps) + Math.tan(latR) * Math.sin(eps));
  let ascRad = Math.atan2(numerator, denominator);
  let asc = ((ascRad / DEG) + 360) % 360;

  return { asc, mc };
}

function calculateEqualHouses(asc: number): HouseCusp[] {
  return Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    longitude: (asc + i * 30) % 360,
  }));
}

function localToUtc(dateStr: string, timeStr: string, tz: string): Date {
  const localIso = `${dateStr}T${timeStr}:00`;
  const tempDate = new Date(localIso + "Z");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  let candidate = tempDate;
  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(candidate);
    const p: Record<string, string> = {};
    parts.forEach(({ type, value }) => { p[type] = value; });
    const localAtTz = new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    const diff = tempDate.getTime() - localAtTz.getTime();
    candidate = new Date(tempDate.getTime() + diff);
  }
  return candidate;
}

export type ChartInput = {
  date: string;
  time: string;
  lat: number;
  lng: number;
  place: string;
  timeUnknown?: boolean;
};

export type ChartResult = {
  chart: NatalChart;
  promptContext: string;
};

export function calculateChart(input: ChartInput): ChartResult {
  const { date, lat, lng, place, timeUnknown } = input;
  const effectiveTime = timeUnknown ? "12:00" : input.time;

  const timezone: string = tzLookup(lat, lng) ?? "UTC";
  const utcDate = localToUtc(date, effectiveTime, timezone);

  const planets: Planet[] = PLANET_DEFS.map(({ name, symbol, body }) => {
    const longitude = getEclipticLongitude(body, utcDate);
    const { name: signName, symbol: signSymbol, degree, minute } = longitudeToSign(longitude);
    return {
      name, symbol, longitude,
      sign: signName, signSymbol, degree, minute,
      isRetrograde: isRetrograde(body, utcDate),
    };
  });

  // When time is unknown: still compute ASC/houses for the chart object (using noon)
  // but exclude them from the AI prompt context so the model won't interpret them
  const { asc, mc } = calculateAngles(utcDate, lat, lng);
  const houses: HouseCusp[] = calculateEqualHouses(asc);

  const chart: NatalChart = {
    planets, houses, ascendant: asc, mc,
    birthData: { date, time: effectiveTime, place, lat, lng, timezone, timeUnknown },
  };

  let promptContext: string;

  if (timeUnknown) {
    const planetList = planets.map(
      (p) => `${p.name} ${p.degree}°${p.minute}' ${p.sign}${p.isRetrograde ? " (↺)" : ""}`
    );
    promptContext = `[GODZINA URODZENIA NIEZNANA]
Data i miejsce urodzenia: ${date}, ${place}
Obliczenia wykonano dla godziny 12:00 jako przybliżenia.
Księżyc: pozycja może być nieprecyzyjna (przesuwa się ~12° na dobę) - zaznacz to w interpretacji.
Ascendent, MC i domy: NIEDOSTĘPNE - nie interpretuj ich.

Planety (bez domów):
${planetList.join("\n")}`;
  } else {
    const planetList = planets.map(
      (p) => `${p.name} ${p.degree}°${p.minute}' ${p.sign}${p.isRetrograde ? " (↺)" : ""} – dom ${houses.findIndex((h, i) => {
        const next = houses[(i + 1) % 12].longitude;
        const cur  = h.longitude;
        const lon  = p.longitude;
        if (cur <= next) return lon >= cur && lon < next;
        return lon >= cur || lon < next;
      }) + 1}`
    );
    const ascSign = longitudeToSign(asc);
    const mcSign  = longitudeToSign(mc);
    promptContext = `Data i miejsce urodzenia: ${date} ${input.time}, ${place}
Ascendent: ${ascSign.degree}°${ascSign.minute}' ${ZODIAC_SIGNS[Math.floor(asc/30)].name}
Medium Coeli (MC): ${mcSign.degree}°${mcSign.minute}' ${ZODIAC_SIGNS[Math.floor(mc/30)].name}
Planety:\n${planetList.join("\n")}`;
  }

  return { chart, promptContext };
}
