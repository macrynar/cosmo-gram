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

const SYSTEM_PROMPT = `JĘZYK: Pisz WYŁĄCZNIE po polsku. Zakaz cyrylicy, rosyjskiego, ukraińskiego i każdego innego języka. Każde słowo cyrylicą = output odrzucony.

Jesteś doświadczonym astrologiem specjalizującym się w synastrii — analizie kompatybilności dwóch kart urodzeniowych. Masz 20+ lat praktyki z parami.

${STYLE_BLOCK}

# ZAKAZ slash-form
Nigdy: "oddałeś/aś", "byłeś/aś", "zmęczony/a". Pisz po imieniu lub bezosobowo.

# ZAKAZ żargonu — przetłumacz
| Zakazane | Zamień na |
|---|---|
| "orb X°" | "bliski" / "ścisły" |
| "koniunkcja" | "spotkanie" / "stop" |
| "kwadratura" | "napięcie" / "tarcie" |
| "opozycja" | "biegunowość" |
| "trygon" | "harmonia" / "łatwy przepływ" |
| "sekstyl" | "dobre wsparcie" |
| "dom X" bez kontekstu | "obszar X" (np. "obszar kariery") |

# ZAKAZ clichés
"kosmiczne połączenie", "dusza bliźniacza", "przeznaczenie", "wszechświat zdecydował", "idealna para".

# Zasady
1. Analizuj aspekty MIĘDZY kartami (synastria), nie każdą kartę osobno.
2. Każda obserwacja oparta o KONKRETNY aspekt z listy input.aspects. ZAKAZ fikcyjnych aspektów.
3. Insight psychologiczny PRZED detalem technicznym.
4. Wyzwania: (a) wzorzec, (b) typowa reakcja + dlaczego nie działa, (c) co zamiast.
5. Pisz po imieniu lub "osoba z Wenus w Rybach" — nigdy ról płciowych.

# WAŻNE — scores deterministyczne
Scores obliczone algorytmicznie i przekazane w inputcie. NIE zmieniaj liczb. Pisz copy spójne z tymi liczbami.

Wskazówki tonalne:
- passion_score > 70 → silne fizyczne przyciąganie, iskra, napięcie erotyczne.
- passion_score < 50 → chemia wymaga świadomej pracy i czasu.
- emotional_score > 70 → głęboka bliskość, czułość, poczucie bycia "u siebie".
- emotional_score < 50 → emocjonalne zrozumienie wymaga wysiłku.
- challenge_score < 45 → dynamika napięta; pisz wprost ale bez katastrofizowania.
- longevity_score > 70 → trwałość, stabilizacja, fundament.
- destiny_score > 70 → silny wątek karmiczny, poczucie nieprzypadkowego spotkania.
- overall_score > 75 → ton komplementarny.
- overall_score 50–65 → "daje się zrobić, ale wymaga uwagi".
- overall_score < 45 → ton ostrzegający.

# LIMITY DŁUGOŚCI
- summary: max 2 zdania (max 180 znaków)
- interpretation każdej kategorii: 3–4 akapity, **160–240 słów**. Zaczynaj od 1 zdania leadu (głos Astrei, Fraunces italic), potem 2–3 akapity interpretacji z konkretnymi aspektami, kończ praktycznym spostrzeżeniem.
- insight: DOKŁADNIE 1 zdanie (max 100 znaków). Konkretny krok, imperatyw lub pytanie.

# Format odpowiedzi

Zwróć WYŁĄCZNIE poprawny JSON (bez markdown, bez żadnego tekstu poza JSON):

{
  "overallScore": <liczba z inputu — nie zmieniaj>,
  "summary": "<2 zdania, max 180 znaków>",
  "categories": [
    {
      "name": "Komunikacja i zrozumienie",
      "score": <communication z inputu>,
      "interpretation": "<lead zdanie + 2–3 akapity, 160–240 słów. Merkury, Księżyc-Merkury, Mars-Merkury.>",
      "insight": "<1 zdanie, max 100 znaków.>"
    },
    {
      "name": "Przyciąganie i chemia",
      "score": <passion z inputu>,
      "interpretation": "<lead + 2–3 akapity, 160–240 słów. Mars-Wenus, Pluton-Wenus, V/VIII dom.>",
      "insight": "<1 zdanie, max 100 znaków.>"
    },
    {
      "name": "Więź emocjonalna i bezpieczeństwo",
      "score": <emotional z inputu>,
      "interpretation": "<lead + 2–3 akapity, 160–240 słów. Księżyc-Księżyc, Księżyc-Wenus, Rak/IV.>",
      "insight": "<1 zdanie, max 100 znaków.>"
    },
    {
      "name": "Wartości i wspólny kierunek",
      "score": <values z inputu>,
      "interpretation": "<lead + 2–3 akapity, 160–240 słów. Słońce, Jowisz, Saturn, IX dom.>",
      "insight": "<1 zdanie, max 100 znaków.>"
    },
    {
      "name": "Niezależność i bliskość",
      "score": <independence z inputu>,
      "interpretation": "<lead + 2–3 akapity, 160–240 słów. Uran-Wenus, VII/XI dom, przestrzeń.>",
      "insight": "<1 zdanie, max 100 znaków.>"
    },
    {
      "name": "Wyzwania i napięcia",
      "score": <challenge z inputu>,
      "interpretation": "<lead + 2–3 akapity, 160–240 słów. Kwadratury/opozycje, Mars-Saturn. Struktura: wzorzec → typowa reakcja (dlaczego nie działa) → co zamiast.>",
      "insight": "<1 zdanie, max 100 znaków.>"
    },
    {
      "name": "Trwałość i przyszłość",
      "score": <longevity z inputu>,
      "interpretation": "<lead + 2–3 akapity, 160–240 słów. Saturn, VII dom, Słońce-Księżyc.>",
      "insight": "<1 zdanie, max 100 znaków.>"
    },
    {
      "name": "Przeznaczenie i lekcja",
      "score": <destiny z inputu>,
      "interpretation": "<lead + 2–3 akapity, 160–240 słów. Pluton, Saturn, Węzły Księżycowe.>",
      "insight": "<1 zdanie, max 100 znaków.>"
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
- emotional: ${scores.emotional}
- values: ${scores.values}
- independence: ${scores.independence}
- challenge: ${scores.challenge}
- longevity: ${scores.longevity}
- destiny: ${scores.destiny}

Napisz 8 modułów synastrii zgodnych z tymi scores. Każda interpretacja: 160–240 słów. Użyj aspektów z listy powyżej. Zwróć TYLKO JSON.`;

    if (!process.env.ANTHROPIC_API_KEY) {
      const result = buildResult(mockResult(name1, name2, scores), topAspects, planetPositions);
      return NextResponse.json({ result, isPaidUser, charts: { person1: r1.chart, person2: r2.chart } });
    }

    let rawText = "";
    try {
      rawText = await aiComplete({
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
        maxTokens: 5000,
        model: "claude-sonnet-4-6",
      });
      console.log("[astro-match] AI response length:", rawText.length, "chars");
    } catch (error) {
      console.error("[astro-match] AI call error:", error);
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
            "Komunikacja i zrozumienie":         scores.communication,
            "Przyciąganie i chemia":              scores.passion,
            "Więź emocjonalna i bezpieczeństwo": scores.emotional,
            "Wartości i wspólny kierunek":        scores.values,
            "Niezależność i bliskość":            scores.independence,
            "Wyzwania i napięcia":                scores.challenge,
            "Trwałość i przyszłość":              scores.longevity,
            "Przeznaczenie i lekcja":             scores.destiny,
            // backward compat (old saves)
            "Komunikacja":       scores.communication,
            "Namiętność":        scores.passion,
            "Wspólne wartości":  scores.values,
            "Wyzwania":          scores.challenge,
            "Długoterminowość":  scores.longevity,
          };
          return { ...cat, score: scoreMap[cat.name] ?? cat.score };
        }),
      };
    } catch (parseErr) {
      console.error("[astro-match] JSON parse error:", parseErr);
      console.error("[astro-match] raw (first 800 chars):", rawText.slice(0, 800));
      aiResult = mockResult(name1, name2, scores);
    }

    const fullResult = buildResult(aiResult, topAspects, planetPositions);

    // Strip premium categories server-side; first category (Komunikacja) is always free
    const safeResult: CompatibilityResult = isPaidUser
      ? fullResult
      : {
          overallScore:    fullResult.overallScore,
          summary:         fullResult.summary,
          categories:      fullResult.categories.slice(0, 1),
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
  const fallback = (s: string) => `Analiza AI chwilowo niedostępna — ${s}.`;
  return {
    overallScore: scores.overall,
    summary: `Kosmogram ${name1} i ${name2} — analiza AI chwilowo niedostępna. Score obliczony deterministycznie.`,
    categories: [
      { name: "Komunikacja i zrozumienie",         score: scores.communication, interpretation: fallback("komunikacja"), insight: "Rozmawiajcie o swoich stylach myślenia." },
      { name: "Przyciąganie i chemia",              score: scores.passion,       interpretation: fallback("chemia"),      insight: "Odkryjcie co was wzajemnie przyciąga." },
      { name: "Więź emocjonalna i bezpieczeństwo", score: scores.emotional,     interpretation: fallback("więź"),        insight: "Dajcie sobie przestrzeń na czułość." },
      { name: "Wartości i wspólny kierunek",        score: scores.values,        interpretation: fallback("wartości"),    insight: "Omówcie priorytety i cele na przyszłość." },
      { name: "Niezależność i bliskość",            score: scores.independence,  interpretation: fallback("niezależność"), insight: "Szanujcie wzajemną przestrzeń." },
      { name: "Wyzwania i napięcia",                score: scores.challenge,     interpretation: fallback("wyzwania"),    insight: "Rozmawiajcie zanim napięcie urośnie." },
      { name: "Trwałość i przyszłość",              score: scores.longevity,     interpretation: fallback("trwałość"),    insight: "Budujcie wspólne rytuały." },
      { name: "Przeznaczenie i lekcja",             score: scores.destiny,       interpretation: fallback("przeznaczenie"), insight: "Czego uczycie się przez siebie nawzajem?" },
    ],
  };
}
