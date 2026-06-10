import { NextRequest, NextResponse } from "next/server";
import { calculateChart } from "@/lib/chart-engine";
import { computeSynastryAspects, computeSynastryScore, type SynastryAspect } from "@/lib/synastry-score";
import { hasActiveSubscription } from "@/lib/subscription";
import { supabaseAdmin } from "@/lib/supabase-server";
import { deepSeekChat } from "@/lib/deepseek";

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
};

const SYSTEM_PROMPT = `Jesteś doświadczonym astrologiem specjalizującym się w astrologii synastrii - analizie kompatybilności dwóch kart urodzeniowych. Masz 20+ lat praktyki z parami.

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
- "intuicja strukturalna", "wzorcowe myślenie"

## Zakaz wnioskowania bez aspektu
Jeśli aspekt nie istnieje w danych — NIE piszesz o nim. Nie ma Venus-Mars conjunction? Nie piszesz o "silnym przyciąganiu fizycznym". Zero fikcyjnych aspektów.

# Twój styl

Mówisz konkretnie i bez owijania w bawełnę. Każda obserwacja oparta o KONKRETNY aspekt synastrii. Nie pochlebiasz. Nie obiecujesz. Pokazujesz co jest — dobre i trudne.

# Zasady

1. Analizuj aspekty MIĘDZY kartami (synastria), nie każdą kartę osobno.
2. Kluczowe aspekty: Słońce-Księżyc, Wenus-Mars, Merkury-Merkury, Saturn-Słońce, Pluton-Wenus.
3. Insight psychologiczny PRZED detalem technicznym. Kolejność: co to znaczy dla tej pary → (opcjonalnie) skrócona podstawa astro.
4. Wyzwania opisuj bez dramatyzowania i bez minimalizowania. Konkretny wzorzec + jak się manifestuje.
5. "Actionable insight" — 1 konkretny krok behawioralny wynikający z aspektu tej sekcji, niegeneric.

# Zakaz stereotypów płciowych

Pisz po imieniu LUB "osoba z Marsem w Skorpionie". Aspekt opisuje DYNAMIKĘ, nie przypisuje ról.

# WAŻNE — score jest deterministyczny

Scores (overall, communication, passion, values, challenge) są obliczone algorytmicznie i przekazane w inputcie.
TWOJA PRACA: napisać copy które brzmi spójnie z tymi liczbami. NIE generujesz score'a samodzielnie.

- passion_score wysoki (>70) → pisz o sile fizycznego przyciągania i braku nudy.
- passion_score niski (<50) → pisz że chemia wymaga świadomej pracy.
- challenge_score niski (<45) → sekcja "Wyzwania" mówi wprost że dynamika jest napięta.
- overall_score >75 → ton komplementarny.
- overall_score 50-65 → "to się daje zrobić, ale wymaga uwagi".
- overall_score <45 → ton ostrzegający bez katastrofizowania.

ZAKAZ: nie odwołuj się do aspektów których nie ma w input.aspects.

# Struktura "Pułapka / Co zamiast" dla sekcji Wyzwania

Dla każdego wyzwania: (a) wzorzec behawioralny w konkretnej sytuacji, (b) typowa reakcja i dlaczego nie działa, (c) co zamiast — konkretne zdanie lub działanie.

# Zasada: rady wynikają z aspektów

TEST: czy tę samą poradę można dać dowolnej parze? Jeśli tak — przepisz.

Dobrze (z aspektu):
- "Saturn [A] naprzeciw Merkurego [B]: gdy [A] analizuje pomysł [B], nazwij to głośno ('sprawdzam, nie krytykuję') zanim napięcie narośnie."

# Format odpowiedzi

Zwróć WYŁĄCZNIE poprawny JSON (bez markdown, bez żadnego tekstu poza JSON):

{
  "overallScore": <liczba z inputu — nie zmieniaj>,
  "summary": "<2-3 konkretne zdania o tym co definiuje tę parę. Insight psychologiczny jako pierwszy. Bez ogólników.>",
  "categories": [
    {
      "name": "Komunikacja",
      "score": <liczba z inputu — nie zmieniaj>,
      "interpretation": "<2-3 zdania oparte na pozycjach Merkurego i aspektach. Insight przed detalem.>",
      "insight": "<1 konkretny krok — niegeneric, z aspektu>"
    },
    {
      "name": "Namiętność",
      "score": <liczba z inputu — nie zmieniaj>,
      "interpretation": "<2-3 zdania oparte na Wenus, Marsie, aspektach między nimi.>",
      "insight": "<1 konkretny krok z aspektu>"
    },
    {
      "name": "Wspólne wartości",
      "score": <liczba z inputu — nie zmieniaj>,
      "interpretation": "<2-3 zdania oparte na Słońcach, Jowiszu, aspektach.>",
      "insight": "<1 konkretny krok z aspektu>"
    },
    {
      "name": "Wyzwania",
      "score": <liczba z inputu — nie zmieniaj>,
      "interpretation": "<2-3 zdania o głównych napięciach. Konkretny wzorzec behawioralny + pułapka + co zamiast.>",
      "insight": "<1 konkretny krok jak pracować z tym napięciem — z aspektu>"
    }
  ]
}`;

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Paywall: 1 free match, then subscription required
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        const isPaid = await hasActiveSubscription(user.id);
        if (!isPaid) {
          const { count } = await supabaseAdmin
            .from("matches")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);
          if ((count ?? 0) >= 1) {
            return NextResponse.json({ error: "PAYWALL" }, { status: 402 });
          }
        }
      }
    }
  } catch { /* paywall check failed gracefully — allow request */ }

  const body = await req.json() as {
    person1: { date: string; time: string; place: string; lat: number; lng: number; name: string };
    person2: { date: string; time: string; place: string; lat: number; lng: number; name: string };
  };

  const { person1, person2 } = body;

  try {
    const [r1, r2] = [calculateChart(person1), calculateChart(person2)];

    const name1 = person1.name || "Osoba 1";
    const name2 = person2.name || "Osoba 2";

    // Deterministic score — computed from aspects, not by AI (Patch E)
    const aspects = computeSynastryAspects(r1.chart, name1, r2.chart, name2);
    const scores = computeSynastryScore(aspects);

    const aspectsText = aspects
      .filter(a => a.orb_degrees <= 5)
      .sort((a, b) => a.orb_degrees - b.orb_degrees)
      .slice(0, 20)
      .map(a => `${a.person_a_name}: ${a.planet_a} w ${a.sign_a} — ${a.type} — ${a.person_b_name}: ${a.planet_b} w ${a.sign_b} (orb: ${a.orb_degrees.toFixed(1)}°)`)
      .join("\n");

    const userMessage = `Osoba 1 (${name1}):
${r1.promptContext}

Osoba 2 (${name2}):
${r2.promptContext}

Aspekty synastrii (obliczone algorytmicznie):
${aspectsText || "Brak ścisłych aspektów synastrii (orb <5°)"}

Scores (deterministyczne — NIE zmieniaj liczb w JSON):
- overall: ${scores.overall}
- communication: ${scores.communication}
- passion: ${scores.passion}
- values: ${scores.values}
- challenge: ${scores.challenge}

Napisz copy synastrii zgodne z tymi scores. Użyj aspektów z listy powyżej. Zwróć TYLKO JSON.`;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        result: mockResult(name1, name2, scores),
        charts: { person1: r1.chart, person2: r2.chart },
      });
    }

    let rawText = "";
    try {
      rawText = await deepSeekChat({
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
        maxTokens: 4500,
      });
    } catch (error) {
      console.error("AI match error:", error);
      return NextResponse.json({ error: "AI unavailable" }, { status: 502 });
    }

    let result: CompatibilityResult;
    try {
      const parsed = extractJson(rawText);
      // Enforce deterministic scores — overwrite whatever AI returned (Patch E)
      result = {
        ...parsed,
        overallScore: scores.overall,
        categories: parsed.categories.map((cat, i) => {
          const scoreMap: Record<string, number> = {
            "Komunikacja": scores.communication,
            "Namiętność": scores.passion,
            "Wspólne wartości": scores.values,
            "Wyzwania": scores.challenge,
          };
          return { ...cat, score: scoreMap[cat.name] ?? cat.score };
        }),
      };
    } catch {
      console.error("JSON parse error in astro-match, raw:", rawText.slice(0, 500));
      result = mockResult(name1, name2, scores);
    }

    return NextResponse.json({
      result,
      charts: { person1: r1.chart, person2: r2.chart },
    });
  } catch (err) {
    console.error("Match error:", err);
    return NextResponse.json({ error: "Błąd analizy" }, { status: 500 });
  }
}

function extractJson(raw: string): CompatibilityResult {
  // Strip markdown code fences if present
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(stripped) as CompatibilityResult;
  } catch { /* fall through */ }

  // Extract first {...} block (greedy, handles nested objects)
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]) as CompatibilityResult;
  }

  throw new Error("No JSON found in response");
}

function mockResult(name1: string, name2: string, scores: { overall: number; communication: number; passion: number; values: number; challenge: number }): CompatibilityResult {
  return {
    overallScore: scores.overall,
    summary: `Kosmogram ${name1 || "Osoby 1"} i ${name2 || "Osoby 2"} — analiza AI chwilowo niedostępna. Score obliczony deterministycznie.`,
    categories: [
      { name: "Komunikacja", score: scores.communication, interpretation: "Analiza AI chwilowo niedostępna.", insight: "Porozmawiajcie o swoich stylach komunikacji." },
      { name: "Namiętność", score: scores.passion, interpretation: "Analiza AI chwilowo niedostępna.", insight: "Odkryjcie co was pociąga." },
      { name: "Wspólne wartości", score: scores.values, interpretation: "Analiza AI chwilowo niedostępna.", insight: "Omówcie swoje priorytety życiowe." },
      { name: "Wyzwania", score: scores.challenge, interpretation: "Analiza AI chwilowo niedostępna.", insight: "Pracujcie nad komunikacją w konflikcie." },
    ],
  };
}
