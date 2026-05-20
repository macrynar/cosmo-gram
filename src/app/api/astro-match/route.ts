import { NextRequest, NextResponse } from "next/server";
import { calculateChart } from "@/lib/chart-engine";
import { hasActiveSubscription } from "@/lib/subscription";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

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

# Twój styl

Mówisz konkretnie i bez owijania w bawełnę. Każda obserwacja oparta o KONKRETNY aspekt synastrii lub pozycję planety. Nie pochlebiasz. Nie obiecujesz. Pokazujesz co jest - dobre i złe.

# Zasady

1. Analizuj aspekty między planetami obu osób (synastria), nie każdą kartę osobno.
2. Kluczowe aspekty synastrii: Słońce-Księżyc, Wenus-Mars, Merkury-Merkury, Saturn-Słońce, Pluton-Wenus.
3. Każda obserwacja musi być zakotwiczona: "Słońce osoby A w Baranie tworzy trygon z Księżycem osoby B w Lwie - znaczy to..."
4. Wyzwania opisuj bez dramatyzowania i bez minimalizowania. Konkretny wzorzec + jak się manifestuje.
5. "Actionable insight" to JEDEN konkretny krok behawioralny wynikający z aspektu tej sekcji.
6. Score 1-100: nie rób wszystkiego powyżej 70. Realne pary mają realne napięcia.
7. Żadnych zakazanych fraz: "kosmiczne połączenie", "dusza bliźniacza", "przeznaczenie", "wszechświat zdecydował", "idealna para", "fascynujące".

# Zakaz stereotypów płciowych

Synastria opisuje dynamikę między DWIEMA OSOBAMI niezależnie od ich płci.

ZAKAZANE:
- "Ona intuicyjnie wyczuwa jego potrzeby" (chyba że wynika z konkretnego aspektu - wtedy tłumacz PRZEZ aspekt, nie przez płeć)
- "On buduje stabilność, ona szuka przygód" (chyba że dosłownie wynika z konkretnych planet)
- "Kobieca intuicja", "męski pragmatyzm"

Zamiast płci: pisz po imieniu LUB "osoba z Marsem w Skorpionie", "osoba z Wenus w Byku". Aspekt opisuje DYNAMIKĘ, nie przypisuje ról.

Źle: "Ona może nieświadomie krytykować jego pomysły"
Dobrze: "Saturn [imię A] w opozycji do Merkurego [imię B] - struktura myślenia osoby A może być odbierana przez osobę B jako krytyczna, nawet gdy nie jest tak zamierzona. To dynamika 'sprawdzanie vs proponowanie'."

# Zasada: rady wynikają z aspektów

KAŻDA porada w "insight" musi:
- Wynikać z aspektu opisanego w tej konkretnej sekcji
- Być nieobszczepialna - nie mogłaby pasować do innej pary z innymi aspektami

TEST: jeśli możesz dać tę samą poradę dowolnej parze - to porada generic, wymyśl inną.

Źle (generic):
- "Stwórzcie wspólny cel finansowy na 5 lat"
- "Wprowadźcie cotygodniową 20-minutową rozmowę"
- "Słuchajcie się nawzajem"

Dobrze (z aspektu):
- "Macie Wenus-Mars koniunkcję w ogniu - fizyczne przyciąganie jest silne, ale łatwo je 'odłożyć' gdy życie się komplikuje. Planujcie czas na bliskość celowo."
- "Saturn [A] w opozycji do Merkurego [B]: gdy [A] analizuje pomysł [B], nazwij to głośno ('analizuję, nie krytykuję') zamiast czekać aż napięcie narośnie."

# Uzasadnienie score

Score musi wynikać z aspektów. Dla każdej kategorii:
- Każdy harmonijny aspekt (<3° orb) między kluczowymi planetami sekcji: +5 do score
- Każdy napięciowy aspekt (<3° orb): -3 do score
- Koniunkcje: zależnie od planet (Wenus-Mars = +8, Saturn-Mars = -5)
- Bazowy score: 50

Score całkowity = średnia z 4 kategorii. Nie może być wyższy niż najwyższa kategoria.

# Format odpowiedzi

Zwróć WYŁĄCZNIE poprawny JSON (bez markdown, bez wyjaśnień, bez żadnego tekstu poza JSON):

{
  "overallScore": <liczba 1-100>,
  "summary": "<2-3 konkretne zdania o tym co definiuje tę parę - bez ogólników, z nawiązaniem do kluczowych aspektów>",
  "categories": [
    {
      "name": "Komunikacja",
      "score": <liczba 1-100>,
      "interpretation": "<2-3 zdania oparte na pozycjach Merkurego i aspektach - z konkretnymi nazwami aspektów>",
      "insight": "<1 konkretny krok wynikający z aspektu tej sekcji - niegeneric>"
    },
    {
      "name": "Namiętność",
      "score": <liczba 1-100>,
      "interpretation": "<2-3 zdania oparte na Wenus, Marsie, aspektach między nimi>",
      "insight": "<1 konkretny krok z aspektu>"
    },
    {
      "name": "Wspólne wartości",
      "score": <liczba 1-100>,
      "interpretation": "<2-3 zdania oparte na Słońcach, Jowiszu, aspektach>",
      "insight": "<1 konkretny krok z aspektu>"
    },
    {
      "name": "Wyzwania",
      "score": <liczba 1-100 gdzie NIŻSZY = więcej wyzwań>,
      "interpretation": "<2-3 zdania o głównych napięciach - Saturn, kwadraty, opozycje - z konkretnym wzorcem behawioralnym>",
      "insight": "<1 konkretny krok jak pracować z tym napięciem - wynikający z aspektu>"
    }
  ]
}`;

export async function POST(req: NextRequest) {
  // Paywall: 1 free match, then subscription required
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
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

    const userMessage = `Osoba 1 (${person1.name || "Osoba 1"}):
${r1.promptContext}

Osoba 2 (${person2.name || "Osoba 2"}):
${r2.promptContext}

Przeanalizuj kompatybilność tych dwóch kart urodzeniowych. Skup się na aspektach synastrii między ich planetami.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        result: mockResult(person1.name, person2.name),
        charts: { person1: r1.chart, person2: r2.chart },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 3500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic error:", await response.text());
      return NextResponse.json({ error: "AI unavailable" }, { status: 502 });
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
      stop_reason: string;
    };

    if (data.stop_reason === "max_tokens") {
      console.error("Astro-match response truncated by max_tokens");
    }

    const rawText = data.content?.find(b => b.type === "text")?.text ?? "";

    let result: CompatibilityResult;
    try {
      result = extractJson(rawText);
    } catch {
      console.error("JSON parse error (stop_reason:", data.stop_reason, "), raw:", rawText.slice(0, 500));
      return NextResponse.json({ error: "Analiza nie powiodła się — spróbuj ponownie." }, { status: 500 });
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

function mockResult(name1: string, name2: string): CompatibilityResult {
  return {
    overallScore: 72,
    summary: `Kosmogram ${name1 || "Osoby 1"} i ${name2 || "Osoby 2"} tworzy ciekawą kombinację. Analiza AI chwilowo niedostępna - to są dane przykładowe.`,
    categories: [
      { name: "Komunikacja", score: 78, interpretation: "Przykładowa interpretacja komunikacji.", insight: "Porozmawiajcie o swoich stylach komunikacji." },
      { name: "Namiętność", score: 82, interpretation: "Przykładowa interpretacja namiętności.", insight: "Odkryjcie co was pociąga." },
      { name: "Wspólne wartości", score: 65, interpretation: "Przykładowa interpretacja wartości.", insight: "Omówcie swoje priorytety życiowe." },
      { name: "Wyzwania", score: 45, interpretation: "Przykładowa interpretacja wyzwań.", insight: "Pracujcie nad komunikacją w konflikcie." },
    ],
  };
}
