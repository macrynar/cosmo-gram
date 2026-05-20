import { NextRequest, NextResponse } from "next/server";

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
      dailyReading: generateOfflineDailyReading(todayLabel),
    });
  }

  try {
    const systemPrompt = `Jesteś astrologiem z 20+ lat praktyki. Tworzysz dzienny horoskop który user czyta rano przed pracą - ma 30 sekund, nie 3 minuty.

# Zasady naczelne

- Max 150 słów ŁĄCZNIE. Liczone słowa, nie znaki. Przekroczenie = błąd.
- Każdy element MUSI wynikać z konkretnego tranzytu lub natal placementu tej karty. Nic generic.
- Zero: "zaufaj swojej intuicji", "Twoje pierwsze przeczucie", "wszechświat dziś", "otwórz się", "zaufaj procesowi".
- Pisz jak doświadczona astrolożka która ma 2 minuty żeby przekazać sedno - bez owijania w bawełnę.
- Mów bezosobowo: "można zauważyć", "warto", "pojawia się" - NIE "Ty", NIE "Twój" w każdym zdaniu.

# FORMAT OUTPUTU (sztywny, zachowaj dokładnie)

## [Nagłówek dnia - konkretny obraz, 8-15 słów]

**Co dziś wspiera:** [max 50 słów. Oparty o JEDEN konkretny tranzyt lub najsilniejszy natal aspekt dnia. Wymień go z nazwy. Jak konkretnie wpływa na działanie/myślenie/emocje.]

**Co dziś uwiera:** [max 40 słów. Oparty o JEDEN trudny tranzyt. Bez katastrofizowania. "To nie problem - wymaga uwagi."]

**Dziś:**
- Zrób: [1 zdanie, konkretne behawioralne polecenie - co zrobić fizycznie/w rozmowie/w decyzji]
- Unikaj: [1 zdanie, konkretne]

# Przykład nagłówka

DOBRZE: "Dzień konkretnych decyzji - z mglistych planów wybierz jeden."
DOBRZE: "Merkury kwadrat Saturn: zanim wyślesz, przeczytaj dwa razy."
ŹLE: "Twoja intuicja pracuje szybciej niż umysł." (klisza bez tranzytu)
ŹLE: "Dzień pełen możliwości." (puste)`;

    const trimmedInterpretation = (interpretationContext || "").slice(0, 4500);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Data docelowa horoskopu: ${todayLabel}\nStrefa czasowa: ${safeTz}\n\nDane kosmogramu:\n${promptContext}\n\nSkrót aktualnej interpretacji AI (kontekst):\n${trimmedInterpretation || "Brak - wygeneruj na bazie danych kosmogramu."}\n\nPrzygotuj dzienny horoskop na wskazany dzień.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic daily-reading error:", err);
      return NextResponse.json({
        dateLabel: todayLabel,
        dailyReading: generateOfflineDailyReading(todayLabel),
      });
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const text = data.content?.find((b) => b.type === "text")?.text ?? "";
    return NextResponse.json({ dateLabel: todayLabel, dailyReading: text });
  } catch (err) {
    console.error("Daily reading error:", err);
    return NextResponse.json({
      dateLabel: todayLabel,
      dailyReading: generateOfflineDailyReading(todayLabel),
    });
  }
}

function generateOfflineDailyReading(todayLabel: string): string {
  return `## ✨ Nagłówek dnia\nDziś zwolnij tempo i wybierz jedną rzecz, którą domkniesz naprawdę dobrze.\n\n## ✅ Co dziś wspiera\nTo dobry moment na porządkowanie myśli i priorytetów. Jeśli od rana ustawisz 2-3 jasne cele, łatwiej utrzymasz energię i nie rozproszysz się drobiazgami.\n\nW relacjach działa prostota: mów krócej, ale konkretniej. Jedna szczera rozmowa da dziś więcej niż długie tłumaczenia.\n\n## ⚠️ Co może dziś uwierać\nMożesz mieć tendencję do nadanalizy i odkładania decyzji. Gdy zauważysz, że kręcisz się w kółko, wróć do pytania: co jest najważniejsze na ten moment?\n\n## 🎯 Dziś zrób / dziś unikaj\n- Dziś zrób: zaplanuj dzień w 3 punktach i zrealizuj pierwszy punkt przed południem.\n- Dziś unikaj: brania na siebie cudzych spraw kosztem własnych priorytetów.\n\n_Data: ${todayLabel}_`;}
