import * as Astronomy from "astronomy-engine";

export type Planet =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars"
  | "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";

export type LineType = "MC" | "IC" | "ASC" | "DSC";

export type Point = { lat: number; lon: number };

export type PlanetLines = {
  mc_longitude: number;
  ic_longitude: number;
  asc_curve: Point[];
  dsc_curve: Point[];
};

export type ActiveLine = {
  planet: Planet;
  type: LineType;
  distance_km: number;
};

export type Paran = {
  planet_a: Planet;
  planet_b: Planet;
  type: `${LineType}-${LineType}`;
  latitude: number;
};

export type Astrocartography = {
  planets: Record<Planet, PlanetLines>;
  parans: Paran[];
  birth: { lat: number; lon: number; gst_deg: number };
};

const PLANET_BODIES: Record<Planet, Astronomy.Body> = {
  Sun:     Astronomy.Body.Sun,
  Moon:    Astronomy.Body.Moon,
  Mercury: Astronomy.Body.Mercury,
  Venus:   Astronomy.Body.Venus,
  Mars:    Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn:  Astronomy.Body.Saturn,
  Uranus:  Astronomy.Body.Uranus,
  Neptune: Astronomy.Body.Neptune,
  Pluto:   Astronomy.Body.Pluto,
};

const ALL_PLANETS = Object.keys(PLANET_BODIES) as Planet[];

const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;
const normalizeLon = (lon: number) => ((lon + 180) % 360 + 360) % 360 - 180;

function computeMCLongitude(raReg: number, gst_deg: number): number {
  return normalizeLon(raReg - gst_deg);
}

function computeASCCurve(ra_deg: number, dec_deg: number, gst_deg: number): Point[] {
  const points: Point[] = [];
  const dec_rad = deg2rad(dec_deg);
  for (let lat = -66; lat <= 66; lat += 1) {
    const cosH = -Math.tan(deg2rad(lat)) * Math.tan(dec_rad);
    if (Math.abs(cosH) > 1) continue;
    const H_deg = rad2deg(Math.acos(cosH));
    points.push({ lat, lon: normalizeLon(ra_deg - gst_deg - H_deg) });
  }
  return points;
}

function computeDSCCurve(ra_deg: number, dec_deg: number, gst_deg: number): Point[] {
  const points: Point[] = [];
  const dec_rad = deg2rad(dec_deg);
  for (let lat = -66; lat <= 66; lat += 1) {
    const cosH = -Math.tan(deg2rad(lat)) * Math.tan(dec_rad);
    if (Math.abs(cosH) > 1) continue;
    const H_deg = rad2deg(Math.acos(cosH));
    points.push({ lat, lon: normalizeLon(ra_deg - gst_deg + H_deg) });
  }
  return points;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceToCurve(city: Point, curve: Point[]): number {
  if (curve.length === 0) return Infinity;
  let minDist = Infinity;
  for (const p of curve) {
    const d = haversineKm(city.lat, city.lon, p.lat, p.lon);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

function computeParans(planets: Record<Planet, PlanetLines>): Paran[] {
  const parans: Paran[] = [];
  for (const A of ALL_PLANETS) {
    for (const B of ALL_PLANETS) {
      if (A === B) continue;
      for (const p of planets[B].asc_curve) {
        if (Math.abs(normalizeLon(planets[A].mc_longitude - p.lon)) < 1) {
          parans.push({ planet_a: A, planet_b: B, type: "MC-ASC", latitude: p.lat });
        }
      }
      for (const p of planets[B].dsc_curve) {
        if (Math.abs(normalizeLon(planets[A].mc_longitude - p.lon)) < 1) {
          parans.push({ planet_a: A, planet_b: B, type: "MC-DSC", latitude: p.lat });
        }
      }
      for (const p of planets[B].asc_curve) {
        if (Math.abs(normalizeLon(planets[A].ic_longitude - p.lon)) < 1) {
          parans.push({ planet_a: A, planet_b: B, type: "IC-ASC", latitude: p.lat });
        }
      }
    }
  }
  return parans;
}

export function computeAstrocartography(
  dateUtc: Date,
  birthLat: number,
  birthLon: number,
): Astrocartography {
  const t = Astronomy.MakeTime(dateUtc);
  const gst_deg = Astronomy.SiderealTime(t) * 15; // hours → degrees

  const obs = new Astronomy.Observer(birthLat, birthLon, 0);
  const planetLines: Partial<Record<Planet, PlanetLines>> = {};

  for (const planet of ALL_PLANETS) {
    const eq = Astronomy.Equator(PLANET_BODIES[planet], t, obs, false, true);
    const ra_deg = eq.ra * 15; // hours → degrees
    const dec_deg = eq.dec;

    const mc_longitude = computeMCLongitude(ra_deg, gst_deg);
    planetLines[planet] = {
      mc_longitude,
      ic_longitude: normalizeLon(mc_longitude + 180),
      asc_curve: computeASCCurve(ra_deg, dec_deg, gst_deg),
      dsc_curve: computeDSCCurve(ra_deg, dec_deg, gst_deg),
    };
  }

  const planets = planetLines as Record<Planet, PlanetLines>;

  return {
    planets,
    parans: computeParans(planets),
    birth: { lat: birthLat, lon: birthLon, gst_deg },
  };
}

export function activeLinesForCity(
  city: Point,
  astro: Astrocartography,
  orb_km = 700,
): ActiveLine[] {
  const result: ActiveLine[] = [];

  for (const planet of ALL_PLANETS) {
    const pl = astro.planets[planet];

    const mcDist =
      Math.abs(normalizeLon(city.lon - pl.mc_longitude)) *
      Math.cos(deg2rad(city.lat)) *
      111;
    if (mcDist < orb_km) result.push({ planet, type: "MC", distance_km: Math.round(mcDist) });

    const icDist =
      Math.abs(normalizeLon(city.lon - pl.ic_longitude)) *
      Math.cos(deg2rad(city.lat)) *
      111;
    if (icDist < orb_km) result.push({ planet, type: "IC", distance_km: Math.round(icDist) });

    const ascDist = distanceToCurve(city, pl.asc_curve);
    if (ascDist < orb_km) result.push({ planet, type: "ASC", distance_km: Math.round(ascDist) });

    const dscDist = distanceToCurve(city, pl.dsc_curve);
    if (dscDist < orb_km) result.push({ planet, type: "DSC", distance_km: Math.round(dscDist) });
  }

  return result.sort((a, b) => a.distance_km - b.distance_km);
}

export type Intention = "love" | "career" | "peace";

export const INTENTION_FILTERS: Record<Intention, Array<{ planet: Planet; types: LineType[] }>> = {
  love:   [
    { planet: "Venus", types: ["MC", "IC", "ASC", "DSC"] },
    { planet: "Moon",  types: ["ASC", "DSC"] },
  ],
  career: [
    { planet: "Sun",     types: ["MC", "IC"] },
    { planet: "Jupiter", types: ["MC", "ASC"] },
    { planet: "Mars",    types: ["MC"] },
  ],
  peace:  [
    { planet: "Moon",    types: ["IC"] },
    { planet: "Saturn",  types: ["IC"] },
    { planet: "Neptune", types: ["ASC"] },
  ],
};

export function filterLinesByIntention(
  planets: Record<Planet, PlanetLines>,
  intention: Intention,
): Array<{ planet: Planet; type: LineType; data: number | Point[] }> {
  const rules = INTENTION_FILTERS[intention];
  const result: Array<{ planet: Planet; type: LineType; data: number | Point[] }> = [];

  for (const { planet, types } of rules) {
    const pl = planets[planet];
    for (const type of types) {
      if (type === "MC") result.push({ planet, type, data: pl.mc_longitude });
      else if (type === "IC") result.push({ planet, type, data: pl.ic_longitude });
      else if (type === "ASC") result.push({ planet, type, data: pl.asc_curve });
      else result.push({ planet, type, data: pl.dsc_curve });
    }
  }
  return result;
}

export const PLANET_EMOJI: Record<Planet, string> = {
  Sun:     "☉",
  Moon:    "☽",
  Mercury: "☿",
  Venus:   "♀",
  Mars:    "♂",
  Jupiter: "♃",
  Saturn:  "♄",
  Uranus:  "♅",
  Neptune: "♆",
  Pluto:   "⯓",
};

export const PLANET_PL: Record<Planet, string> = {
  Sun:     "Słońce",
  Moon:    "Księżyc",
  Mercury: "Merkury",
  Venus:   "Wenus",
  Mars:    "Mars",
  Jupiter: "Jowisz",
  Saturn:  "Saturn",
  Uranus:  "Uran",
  Neptune: "Neptun",
  Pluto:   "Pluton",
};

export const LINE_PL: Record<LineType, string> = {
  MC:  "szczycie kariery (MC)",
  IC:  "fundamencie domu (IC)",
  ASC: "wschodzie — energia ktora emabujesz (ASC)",
  DSC: "zachodzie — co przyciagasz (DSC)",
};

export const LINE_PL_SHORT: Record<LineType, string> = {
  MC:  "MC",
  IC:  "IC",
  ASC: "ASC",
  DSC: "DSC",
};

// What each line type means in plain language
export const LINE_TYPE_MEANING: Record<LineType, string> = {
  MC:  "linia kariery i publicznego wizerunku — tu masz siłę sprawczą i publiczne rozpoznanie",
  IC:  "linia domu i korzeni — tu możesz się zakorzenić, poczuć się bezpiecznie i głęboko odpocząć",
  ASC: "linia osobowości i energii — tu emanujesz tą planetą, inni postrzegają cię przez jej pryzmat",
  DSC: "linia relacji i partnerstwa — tu przyciągasz partnerów i okazje związane z tą planetą",
};

// What specific planet+line combinations mean in plain Polish (for city list)
export const PLANET_LINE_MEANING: Partial<Record<Planet, Partial<Record<LineType, string>>>> = {
  Sun: {
    MC: "pełnia energii i kariery — tu błyszczy Twoja tożsamość i ambicje",
    IC: "głęboki odpoczynek i regeneracja sił witalnych",
    ASC: "silna, pewna siebie osobowość — tu Twoja charyzma działa natychmiast",
    DSC: "przyciągasz charyzmatycznych, pewnych siebie partnerów",
  },
  Moon: {
    MC: "emocjonalne spełnienie w pracy — tu Twoja wrażliwość jest atutem",
    IC: "idealne miejsce na dom i rodzinę — głębokie poczucie bezpieczeństwa",
    ASC: "naturalna empatia i otwartość — ludzie od razu Ci ufają",
    DSC: "głęboka bliskość emocjonalna w związkach — intymne, opiekuńcze relacje",
  },
  Venus: {
    MC: "sukces przez piękno i relacje — kariera w sztuce, modzie lub dyplomacji",
    IC: "dom pełen harmonii i estetyki — naturalne piękno otoczenia",
    ASC: "magnetyzm i naturalny urok — przyciągasz sympatię bez wysiłku",
    DSC: "głęboka, harmonijna miłość — tu spotkasz kogoś ważnego",
  },
  Mars: {
    MC: "energia i ambicja na szczycie — tu walczysz i wygrywasz",
    IC: "dynamiczna, aktywna baza domowa — dużo energii w prywatnym życiu",
    ASC: "silna, dynamiczna osobowość — inicjatywa i odwaga w pierwszym wrażeniu",
    DSC: "namiętne, intensywne związki — przyciągasz energicznych partnerów",
  },
  Jupiter: {
    MC: "ekspansja i szczęście w karierze — okazje same się pojawiają",
    IC: "obfitość i optymizm w życiu domowym — tu wszystko rośnie",
    ASC: "naturalna radość i optymizm — inni postrzegają cię jako osobę, której sprzyja los",
    DSC: "hojni, pozytywni partnerzy — relacje pełne wzrostu i możliwości",
  },
  Saturn: {
    MC: "ciężka praca przynosi trwałe efekty — tu budujesz coś na lata",
    IC: "stabilność i struktura jako fundament — solidny, pewny dom",
    ASC: "poważna, dojrzała osobowość — inni postrzegają cię jako kogoś odpowiedzialnego i godnego zaufania",
    DSC: "trwałe, zobowiązujące relacje — poważni, dojrzali partnerzy",
  },
  Neptune: {
    MC: "artystyczna, duchowa kariera — tu Twoja intuicja jest Twoją siłą",
    IC: "magiczne, duchowe otoczenie domowe — głęboki spokój i marzenia",
    ASC: "tajemnicza, duchowa aura — przyciągasz uwagę swoją wrażliwością",
    DSC: "duchowe, głęboko emocjonalne związki — niemal telepatyczna więź",
  },
  Mercury: {
    MC: "błyskotliwa komunikacja i kariera intelektualna — mówisz, piszesz, uczysz",
    IC: "intelektualna stymulacja w domu — żywe, ciekawe środowisko",
    ASC: "dowcipna, inteligentna osobowość — szybka, błyskotliwa w kontaktach",
    DSC: "partnerzy pełni pomysłów — stymulujące intelektualnie relacje",
  },
  Uranus: {
    MC: "przełomowa, innowacyjna kariera — tu robisz coś inaczej niż wszyscy",
    IC: "niekonwencjonalne, wolne życie domowe — własne zasady",
    ASC: "oryginalna, niepowtarzalna osobowość — wyróżniasz się z tłumu",
    DSC: "nieoczekiwane, ekscytujące relacje — partnerzy, którzy zmieniają Twoje życie",
  },
  Pluto: {
    MC: "transformacja przez karierę — głębokie zmiany i moc sprawcza",
    IC: "głęboka transformacja korzeni — tu przepracowujesz przeszłość",
    ASC: "intensywna, magnetyczna osobowość — wywierasz głębokie wrażenie",
    DSC: "transformujące, intensywne relacje — związki, które zmieniają wszystko",
  },
};

export function getPlanetLineMeaning(planet: Planet, type: LineType): string {
  return PLANET_LINE_MEANING[planet]?.[type] ?? `${PLANET_PL[planet]} na ${LINE_TYPE_MEANING[type]}`;
}

// Planet color palette for map lines
export const PLANET_COLORS: Record<Planet, string> = {
  Sun:     "#f59e0b",
  Moon:    "#c4b5fd",
  Mercury: "#6ee7b7",
  Venus:   "#f9a8d4",
  Mars:    "#f87171",
  Jupiter: "#60a5fa",
  Saturn:  "#d97706",
  Uranus:  "#34d399",
  Neptune: "#818cf8",
  Pluto:   "#a78bfa",
};

export function filterLinesByScenario(
  planets: Record<Planet, PlanetLines>,
  scenarioLines: Array<{ planet: Planet; type: LineType }>,
): Array<{ planet: Planet; type: LineType; data: number | Point[] }> {
  const result: Array<{ planet: Planet; type: LineType; data: number | Point[] }> = [];
  for (const { planet, type } of scenarioLines) {
    const pl = planets[planet];
    if (!pl) continue;
    if (type === "MC") result.push({ planet, type, data: pl.mc_longitude });
    else if (type === "IC") result.push({ planet, type, data: pl.ic_longitude });
    else if (type === "ASC") result.push({ planet, type, data: pl.asc_curve });
    else result.push({ planet, type, data: pl.dsc_curve });
  }
  return result;
}

// Planet "weight" for sorting cities by influence strength
export const PLANET_WEIGHT: Record<Planet, number> = {
  Sun:     1.0,
  Moon:    0.95,
  Venus:   0.9,
  Mars:    0.85,
  Jupiter: 0.8,
  Mercury: 0.7,
  Saturn:  0.65,
  Neptune: 0.6,
  Uranus:  0.55,
  Pluto:   0.5,
};
