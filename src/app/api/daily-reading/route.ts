import { NextRequest, NextResponse } from "next/server";

export type DailyReadingData = {
  headline: string;
  theme: string;
  insight: string;
  action: string;
  avoid: string;
  mantra: string;
};

interface DailyReadingBody {
  promptContext: string;
  interpretationContext?: string;
  timezone?: string;
}

function buildTodayLabel(timezone: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date());
}

const SYSTEM_PROMPT = `Jesteś doświadczoną astrologią piszącą dzienną interpretację karty natury. Piszesz w języku polskim.

# Twoja rola
Tworzysz GOTOWY dzienny horoskop — nie opisujesz tranzyty, nie obliczasz, nie wyjaśniasz procesu. Bezpośrednio przechodzisz do narracji.

# Zasady naczelne
1. Każde zdanie MUSI wynikać z konkretnego tranzytu lub natal plaementu. Wymień tranzyt (np. "Mars kwadrat natal Jowisz", "tranzytujący Saturn seksyl natal Saturn").
2. Zero kliszy: "zaufaj intuicji", "wszechświat", "otwórz serce", "moc chwili", "follow your dreams".
3. Pisz konkretnie i behawioralnie — nie o "energii miłości" ale o tym CO konkretnie robić lub czuć.
4. Ton: jak inteligentna przyjaciółka która zna astrologię — ciepło, bezpośrednio, bez mistycyzmu.
5. Użyj "dziś", "możesz", "warto", "pojawia się" — nie "Twój" co zdanie.

# FORMAT — zwróć WYŁĄCZNIE poprawny JSON, bez markdown, bez żadnego tekstu poza JSON

{
  "headline": "<Konkretny obraz dnia, 8-14 słów. Odwołanie do głównego tranzytu lub napięcia. Nie banał.>",
  "theme": "<1 zdanie. Główny tranzyt dnia i jego ogólny klimat emocjonalny/energetyczny. Max 20 słów.>",
  "insight": "<2-3 zdania. Główna interpretacja — co to oznacza praktycznie dla osoby z tą kartą. Konkretne, osobiste, wynikające z aspektów. Max 80 słów.>",
  "action": "<1 konkretne zdanie co zrobić dziś. Zachowanie fizyczne/decyzja/rozmowa. Wynika z harmonijnego tranzytu. Max 25 słów.>",
  "avoid": "<1 konkretne zdanie czego unikać. Wynika z trudnego tranzytu. Nie katastrofizuj. Max 25 słów.>",
  "mantra": "<Krótka fraza do zapamiętania, 5-9 słów. Konkretna, nie generic. Może nawiązywać do znaku lub planety.>"
}

# Przykłady DOBRYCH pól:

headline:
✓ "Saturn seksyl Saturn: czas audytu bez emocji"
✓ "Mars kwadrat Mars — energia jest, kierunek rozmyty"
✗ "Dzień pełen możliwości i wyzwań" (puste)
✗ "Twoja moc budzi się dzisiaj" (klisza)

insight:
✓ "Tranzytujący Saturn w ścisłym sekstylu do natal Saturna to rzadkie okno na chłodną ocenę zasobów — czas, pieniądze, zobowiązania. Emocje nie blokują dziś analizy, co jest rzadkością. Jednocześnie Mars kwadrat natal Mars tworzy podskórną irytację — energia szuka ujścia, ale działanie bez planu będzie kontrproduktywne."
✗ "Dziś możesz poczuć silną energię i chęć do działania. Warto słuchać swojego ciała." (generic)

action:
✓ "Przejdź przez jedną odłożoną decyzję finansową krok po kroku — Saturn dziś sprzyja trzeźwej kalkulacji."
✗ "Spędź czas z bliskimi i ciesz się chwilą." (nic nie wnosi)

mantra:
✓ "Energia bez kierunku to tylko hałas."
✓ "Saturn uczy cierpliwości, nie bezruchu."
✗ "Wszystko jest możliwe." (bez wartości)`;

function extractJson(raw: string): DailyReadingData {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(stripped) as DailyReadingData;
  } catch { /* fall through */ }

  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]) as DailyReadingData;

  throw new Error("No JSON in response");
}

function offlineReading(todayLabel: string): DailyReadingData {
  return {
    headline: "Czas konkretnych decyzji — wybierz jedną i domknij",
    theme: "Saturn sprzyja dziś trzeźwej ocenie priorytetów i zasobów.",
    insight: "To dobry moment na porządkowanie myśli bez emocjonalnych zakłóceń. Jedna szczera rozmowa lub konkretna decyzja da dziś więcej niż tydzień planowania. Unikaj jednak rozrzucania energii — skup się na tym, co realnie możesz zamknąć.",
    action: "Wybierz jedną odłożoną sprawę i zrób pierwszy konkretny krok przed południem.",
    avoid: "Brania na siebie cudzych spraw kosztem własnych priorytetów — dziś liczy się fokus.",
    mantra: "Mniej, ale naprawdę.",
  };
}

export async function POST(req: NextRequest) {
  const { promptContext, interpretationContext, timezone } = await req.json() as DailyReadingBody;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const safeTz = timezone || "Europe/Warsaw";
  const todayLabel = buildTodayLabel(safeTz);

  if (!promptContext) {
    return NextResponse.json({ error: "Missing promptContext" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({
      dateLabel: todayLabel,
      dailyReading: JSON.stringify(offlineReading(todayLabel)),
    });
  }

  try {
    const trimmedInterpretation = (interpretationContext || "").slice(0, 3000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Data horoskopu: ${todayLabel}\nStrefa czasowa: ${safeTz}\n\nDane kosmogramu natury:\n${promptContext}\n\n${trimmedInterpretation ? `Kontekst z interpretacji natury:\n${trimmedInterpretation}\n\n` : ""}Wygeneruj dzienny horoskop. Zwróć TYLKO JSON.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic daily-reading error:", await response.text());
      return NextResponse.json({
        dateLabel: todayLabel,
        dailyReading: JSON.stringify(offlineReading(todayLabel)),
      });
    }

    const data = await response.json() as { content: Array<{ type: string; text: string }> };
    const raw = data.content?.find((b) => b.type === "text")?.text ?? "";

    let reading: DailyReadingData;
    try {
      reading = extractJson(raw);
    } catch {
      console.error("Daily reading JSON parse error:", raw.slice(0, 300));
      reading = offlineReading(todayLabel);
    }

    return NextResponse.json({ dateLabel: todayLabel, dailyReading: JSON.stringify(reading) });
  } catch (err) {
    console.error("Daily reading error:", err);
    return NextResponse.json({
      dateLabel: todayLabel,
      dailyReading: JSON.stringify(offlineReading(todayLabel)),
    });
  }
}
