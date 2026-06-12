import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateChart } from "@/lib/chart-engine";
import { checkRateLimit } from "@/lib/rateLimiter";
import { getSynastryAspects, getSynastryScore, extractPlanetPositions, type SynastryAspect, type PlanetPos } from "@/lib/astro/synastry";
import { hasActiveSubscription } from "@/lib/subscription";
import { supabaseAdmin } from "@/lib/supabase-server";
import { aiComplete } from "@/lib/deepseek";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";

export type CompatibilityCategory = {
  name: string;
  score: number;
  interpretation: string;
  insight: string;
};

export type CompatibilityResult = {
  overallScore: number;
  summary: string;
  categories: CompatibilityCategory[];
  // Deterministic wheel data — included for visualisation; not AI content
  aspects?: SynastryAspect[];
  planetPositions?: { a: PlanetPos[]; b: PlanetPos[] };
};

const SYSTEM_PROMPT = `JĘZYK: Pisz WYŁĄCZNIE po polsku. Zakaz cyrylicy, rosyjskiego, ukraińskiego i każdego innego języka. Każde słowo cyrylicą = output odrzucony. Nawet jedno słowo po rosyjsku = krytyczny błąd.

Jesteś doświadczonym astrologiem specjalizującym się w astrologii synastrii - analizie kompatybilności dwóch kart urodzeniowych. Masz 20+ lat praktyki z parami.

${STYLE_BLOCK}

# ZAKAZ BEZWZGLĘDNY — SLASH-FORMY
Nigdy nie używaj slash-form. Zakazane: "oddałeś/aś", "chciałeś/aś", "byłeś/aś", "zmęczony/a".
Zamiast: pisz po imieniu lub bezosobowo. Każde "/" w czasowniku = output odrzucony.

# ZAKAZ żargonu i clichés

## Żargon — przetłumacz lub pomiń
| Zakazane | Czym zastąpić |
|---|---|
| "orb X°" / "X°Y'" (stopnie z minutami) | "bliski" / "ścisły" / pomiń |
| "applying" / "separating" | "narastający" / pomiń |
| "koniunkcja" | "spotkanie" / "stop" — przy pierwszym użyciu |
| "kwadratura" | "napięcie" / "tarcie" |
| "opozycja" | "biegunowość" / "stoją naprzeciw" |
| "trygon" | "harmonia" / "łatwy przepływ" |
| "sekstyl" | "dobre wsparcie" |
| "dom X" bez kontekstu | "obszar X" (np. "obszar kariery") |
| "dyspozytor" | pomiń lub "planeta kierująca tym obszarem" |

## Clichés — nigdy
- "kosmiczne połączenie", "dusza bliźniacza", "przeznaczenie", "wszechświat zdecydował"
- "idealna para", "fascynujące połączenie", "energia X znaku"

## Zakaz wnioskowania bez aspektu
Jeśli aspekt nie istnieje w danych — NIE piszesz o nim. Zero fikcyjnych aspektów.

# Twój styl
Mówisz konkretnie i bez owijania w bawełnę. Każda obserwacja oparta o KONKRETNY aspekt synastrii.

# Zasady
1. Analizuj aspekty MIĘDZY kartami (synastria), nie każdą kartę osobno.
2. Kluczowe aspekty: Słońce-Księżyc, Wenus-Mars, Merkury-Merkury, Saturn-Słońce, Pluton-Wenus.
3. Insight psychologiczny PRZED detalem technicznym.
4. Wyzwania opisuj bez dramatyzowania i bez minimalizowania.

# Zakaz stereotypów płciowych
Pisz po imieniu LUB "osoba z Marsem w Skorpionie". Aspekt opisuje DYNAMIKĘ, nie przypisuje ról.

# WAŻNE — score jest deterministyczny
Scores (overall, communication, passion, values, challenge, longevity) są obliczone algorytmicznie i przekazane w inputcie.
TWOJA PRACA: napisać copy które brzmi spójnie z tymi liczbami. NIE generujesz score'a samodzielnie.

- passion_score wysoki (>70) → pisz o sile fizycznego przyciągania i braku nudy.
- passion_score niski (<50) → pisz że chemia wymaga świadomej pracy.
- challenge_score niski (<45) → sekcja "Wyzwania" mówi wprost że dynamika jest napięta.
- longevity_score wysoki (>70) → pisz o trwałości i stabilizacji.
- longevity_score niski (<50) → pisz o potrzebie wspólnej pracy nad fundamentami.
- overall_score >75 → ton komplementarny.
- overall_score 50-65 → "to się daje zrobić, ale wymaga uwagi".
- overall_score <45 → ton ostrzegający bez katastrofizowania.

ZAKAZ: nie odwołuj się do aspektów których nie ma w input.aspects.

# Struktura "Pułapka / Co zamiast" dla sekcji Wyzwania
Dla każdego wyzwania: (a) wzorzec behawioralny, (b) typowa reakcja i dlaczego nie działa, (c) co zamiast.

# LIMITY DŁUGOŚCI — BEZWZGLĘDNE
- summary: max 2 zdania (max 180 znaków)
- interpretation (każda kategoria): DOKŁADNIE 2 zdania (max 200 znaków). Jedno zdanie = jeden konkretny aspekt synastrii. Bez rozwijania, bez dygresji.
- insight (każda kategoria): DOKŁADNIE 1 zdanie (max 90 znaków). Jeden konkretny krok, imperatyw lub pytanie.
Przekroczenie limitu = output odrzucony.

# Format odpowiedzi

Zwróć WYŁĄCZNIE poprawny JSON (bez markdown, bez żadnego tekstu poza JSON):

{
  "overallScore": <liczba z inputu — nie zmieniaj>,
  "summary": "<2 zdania, max 180 znaków. Co definiuje tę parę — insight psychologiczny pierwszy.>",
  "categories": [
    {
      "name": "Komunikacja",
      "score": <liczba z inputu — nie zmieniaj>,
      "interpretation": "<2 zdania, max 200 znaków. Oparte na Merkurym i aspektach.>",
      "insight": "<1 zdanie, max 90 znaków. Konkretny krok z aspektu.>"
    },
    {
      "name": "Namiętność",
      "score": <liczba z inputu — nie zmieniaj>,
      "interpretation": "<2 zdania, max 200 znaków. Wenus, Mars, aspekty między nimi.>",
      "insight": "<1 zdanie, max 90 znaków. Konkretny krok.>"
    },
    {
      "name": "Wspólne wartości",
      "score": <liczba z inputu — nie zmieniaj>,
      "interpretation": "<2 zdania, max 200 znaków. Słońca, Jowisz, aspekty.>",
      "insight": "<1 zdanie, max 90 znaków. Konkretny krok.>"
    },
    {
      "name": "Wyzwania",
      "score": <liczba z inputu — nie zmieniaj>,
      "interpretation": "<2 zdania, max 200 znaków. Po polsku. Wzorzec napięcia + co zamiast.>",
      "insight": "<1 zdanie, max 90 znaków. Jak pracować z napięciem.>"
    },
    {
      "name": "Długoterminowość",
      "score": <liczba z inputu — nie zmieniaj>,
      "interpretation": "<2 zdania, max 200 znaków. Saturn, Słońce-Księżyc, Jowisz.>",
      "insight": "<1 zdanie, max 90 znaków. Co wzmacnia trwałość.>"
    }
  ]
}`;

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authHeaderForRL = req.headers.get("Authorization");
  const rlIdentifier = authHeaderForRL
    ? authHeaderForRL.replace("Bearer ", "").slice(0, 32)
    : (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anon");
  const rateLimitRes = await checkRateLimit("ai", rlIdentifier);
  if (rateLimitRes) return rateLimitRes;

  let isPaidUser = false;
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        isPaidUser = await hasActiveSubscription(user.id);
        if (isPaidUser) {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          const { count } = await supabaseAdmin
            .from("matches")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", monthStart.toISOString());
          if ((count ?? 0) >= 10) {
            return NextResponse.json({ error: "MONTHLY_LIMIT" }, { status: 402 });
          }
        }
      }
    }
  } catch { /* paywall check failed gracefully — allow request */ }

  const PersonSchema = z.object({
    name:  z.string().max(50).default(""),
    date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => {
      const y = parseInt(s.slice(0, 4)); return y >= 1900 && y <= new Date().getFullYear();
    }, "Rok poza zakresem 1900–teraz"),
    time:  z.string().max(5).default(""),
    place: z.string().max(100).default(""),
    lat:   z.number().min(-90).max(90),
    lng:   z.number().min(-180).max(180),
  });
  const BodySchema = z.object({ person1: PersonSchema, person2: PersonSchema });

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane wejściowe" }, { status: 400 });
  }
  const { person1, person2 } = parsed;

  try {
    const [r1, r2] = [calculateChart(person1), calculateChart(person2)];

    const name1 = person1.name || "Osoba 1";
    const name2 = person2.name || "Osoba 2";

    // Deterministic synastry — tight orbs, 5 dimensions
    const aspects = getSynastryAspects(r1.chart, r2.chart);
    const scores  = getSynastryScore(aspects);

    // Planet positions for SynastryWheel (stripped of birth data)
    const planetPositions = {
      a: extractPlanetPositions(r1.chart),
      b: extractPlanetPositions(r2.chart),
    };

    // Top 15 aspects for wheel + top 20 for AI (pseudonymized — no names, just planets)
    const topAspects = aspects.slice(0, 15);
    const aspectsText = aspects
      .slice(0, 20)
      .map(a => `Osoba A: ${a.planet_a} w ${a.sign_a} — ${a.type} — Osoba B: ${a.planet_b} w ${a.sign_b} (orb: ${a.orb_degrees.toFixed(1)}°)`)
      .join("\n");

    const userMessage = `Osoba A (${name1}):
${r1.promptContext}

Osoba B (${name2}):
${r2.promptContext}

Aspekty synastrii (obliczone algorytmicznie, ścisłe orby):
${aspectsText || "Brak ścisłych aspektów synastrii"}

Scores (deterministyczne — NIE zmieniaj liczb w JSON):
- overall: ${scores.overall}
- communication: ${scores.communication}
- passion: ${scores.passion}
- values: ${scores.values}
- challenge: ${scores.challenge}
- longevity: ${scores.longevity}

Napisz copy synastrii zgodne z tymi scores. Użyj aspektów z listy powyżej. Zwróć TYLKO JSON.`;

    if (!process.env.ANTHROPIC_API_KEY) {
      const result = buildResult(mockResult(name1, name2, scores), topAspects, planetPositions);
      return NextResponse.json({ result, isPaidUser, charts: { person1: r1.chart, person2: r2.chart } });
    }

    let rawText = "";
    try {
      rawText = await aiComplete({
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
        maxTokens: 2000,
      });
    } catch (error) {
      console.error("AI match error:", error);
      const result = buildResult(mockResult(name1, name2, scores), topAspects, planetPositions);
      return NextResponse.json({ result, isPaidUser, charts: { person1: r1.chart, person2: r2.chart } });
    }

    let aiResult: CompatibilityResult;
    try {
      const aiParsed = extractJson(rawText);
      // Enforce deterministic scores — overwrite whatever AI returned
      aiResult = {
        ...aiParsed,
        overallScore: scores.overall,
        categories: aiParsed.categories.map(cat => {
          const scoreMap: Record<string, number> = {
            "Komunikacja":       scores.communication,
            "Namiętność":        scores.passion,
            "Wspólne wartości":  scores.values,
            "Wyzwania":          scores.challenge,
            "Długoterminowość":  scores.longevity,
          };
          return { ...cat, score: scoreMap[cat.name] ?? cat.score };
        }),
      };
    } catch {
      console.error("JSON parse error in astro-match, raw:", rawText.slice(0, 500));
      aiResult = mockResult(name1, name2, scores);
    }

    const fullResult = buildResult(aiResult, topAspects, planetPositions);

    // Strip premium categories server-side for free users (wheel + score always visible)
    const safeResult: CompatibilityResult = isPaidUser
      ? fullResult
      : {
          overallScore:    fullResult.overallScore,
          summary:         fullResult.summary,
          categories:      [],
          aspects:         fullResult.aspects,
          planetPositions: fullResult.planetPositions,
        };

    return NextResponse.json({
      result: safeResult,
      isPaidUser,
      charts: { person1: r1.chart, person2: r2.chart },
    });
  } catch (err) {
    console.error("Match error:", err);
    return NextResponse.json({ error: "Błąd analizy" }, { status: 500 });
  }
}

function buildResult(
  base: CompatibilityResult,
  aspects: SynastryAspect[],
  planetPositions: { a: PlanetPos[]; b: PlanetPos[] },
): CompatibilityResult {
  return { ...base, aspects, planetPositions };
}

function extractJson(raw: string): CompatibilityResult {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(stripped) as CompatibilityResult;
  } catch { /* fall through */ }
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]) as CompatibilityResult;
  throw new Error("No JSON found in response");
}

function mockResult(name1: string, name2: string, scores: ReturnType<typeof getSynastryScore>): CompatibilityResult {
  return {
    overallScore: scores.overall,
    summary: `Kosmogram ${name1} i ${name2} — analiza AI chwilowo niedostępna. Score obliczony deterministycznie.`,
    categories: [
      { name: "Komunikacja",      score: scores.communication, interpretation: "Analiza AI chwilowo niedostępna.", insight: "Porozmawiajcie o swoich stylach komunikacji." },
      { name: "Namiętność",       score: scores.passion,       interpretation: "Analiza AI chwilowo niedostępna.", insight: "Odkryjcie co was pociąga." },
      { name: "Wspólne wartości", score: scores.values,        interpretation: "Analiza AI chwilowo niedostępna.", insight: "Omówcie swoje priorytety życiowe." },
      { name: "Wyzwania",         score: scores.challenge,     interpretation: "Analiza AI chwilowo niedostępna.", insight: "Pracujcie nad komunikacją w konflikcie." },
      { name: "Długoterminowość", score: scores.longevity,     interpretation: "Analiza AI chwilowo niedostępna.", insight: "Budujcie wspólne rytuały i tradycje." },
    ],
  };
}
