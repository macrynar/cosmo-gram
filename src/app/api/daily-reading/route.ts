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

const SYSTEM_PROMPT = `Jesteś astrolożką która pisze dzienny horoskop dla zwykłych ludzi — nie dla astrologów.

# Najważniejsza zasada
ZERO żargonu astrologicznego w outputcie. Nie piszesz "Mars kwadrat natal Jowisz", "tranzytujący Saturn", "dom 7", "sekstylem", "opozycja natal". Używasz planet TYLKO jako metafor emocji i sytuacji — tak jak robi to dobra publicystka.

Możesz MYŚLEĆ o tranzytach żeby zrozumieć energię dnia, ale w tekście TŁUMACZYSZ to na ludzki język.

# Jak tłumaczyć żargon na ludzki język

Mars (napięcie, energia, konflikty) → "dziś słowa mogą wychodzić ostrzej", "czujesz podskórną irytację", "energia szuka ujścia"
Saturn (dyscyplina, ocena, ograniczenia) → "dobry moment na trzeźwą ocenę", "czas zamykać zaległe sprawy"
Wenus (relacje, pieniądze, przyjemność) → "relacje dziś wymagają uważności", "możesz mieć ochotę na coś przyjemnego"
Księżyc (emocje, nastrój) → "nastrój może być zmienny", "emocje są dziś blisko powierzchni"
Merkury (komunikacja, myślenie) → "rozmowy mogą być napięte", "dobry dzień na pisanie i decyzje"
Jowisz (ekspansja, optymizm) → "pojawia się okno na odważniejszy ruch", "coś może wyjść lepiej niż myślisz"
Neptun (marzenia, mętlik) → "trudniej o jasną decyzję", "wyobraźnia pracuje mocniej niż zwykle"

# Zasady pisania
1. Pisz jak mądrą znajomą która powiedziałaby to przy kawie — ciepło, konkretnie, bez zadęcia.
2. Każde zdanie musi opisywać SYTUACJĘ lub UCZUCIE które czytelnik może rozpoznać u siebie dziś.
3. Zero banałów: "zaufaj sobie", "jesteś silny/a", "wszechświat", "moc chwili", "słuchaj serca".
4. Ton: bezpośredni, lekko ironiczny kiedy trzeba, zawsze po stronie człowieka.
5. Insight musi być ZASKAKUJĄCY lub TRAFNY — coś co czytelnik pomyśli "o, to o mnie".

# FORMAT — zwróć WYŁĄCZNIE poprawny JSON, bez markdown, bez żadnego tekstu poza JSON

{
  "headline": "<Konkretny obraz dnia, 8-14 słów. Coś co można rozpoznać w życiu. Zero żargonu.>",
  "theme": "<1 zdanie. Klimat emocjonalny/sytuacyjny dnia w ludzkich słowach. Max 20 słów.>",
  "insight": "<2-3 zdania. Co dziś czuć lub z czym się mierzyć. Konkretne i rozpoznawalne. Zero żargonu. Max 80 słów.>",
  "action": "<1 konkretne zdanie co zrobić dziś. Fizyczne działanie lub konkretna decyzja. Max 25 słów.>",
  "avoid": "<1 konkretne zdanie czego unikać. Konkretna sytuacja lub zachowanie. Max 25 słów.>",
  "mantra": "<Krótka fraza 5-9 słów. Coś co można powtórzyć w trudnym momencie dnia.>"
}

# Przykłady DOBRYCH pól (zero żargonu):

headline:
✓ "Dziś słowa mogą wychodzić ostrzej — to nie złość, to zmęczenie"
✓ "Dobry moment na zamknięcie jednej sprawy którą odkładałeś/aś od tygodnia"
✓ "Coś ciągnie do zmian, ale lista powodów żeby nie ruszać jest długa"
✗ "Mars kwadrat Saturn: czas audytu" (żargon)
✗ "Dzień pełen energii i możliwości" (banał)

theme:
✓ "Komunikacja dziś wymaga podwójnej uważności — łatwo powiedzieć za dużo lub nie to."
✓ "Dziś głowa pracuje sprawniej niż zwykle — warto to wykorzystać na decyzje które odkładasz."
✗ "Tranzytujący Merkury aktywuje napięcie..." (żargon)

insight:
✓ "Jeśli ostatnio czujesz że trudno Ci powiedzieć wprost co myślisz — dziś to napięcie może być wyraźniejsze. Szczególnie w rozmowach gdzie coś jest niedomówione od dawna. To nie jest dobry dzień na delikatne sygnały — albo powiedz wprost, albo zaczekaj do jutra."
✓ "Pojawia się rzadkie okno na chłodną ocenę tego co realnie masz: czas, pieniądze, zobowiązania. Emocje dziś mniej mieszają — możesz zobaczyć liczby takimi jakie są, bez spirali lęku."
✗ "Tranzytujący Saturn w sekstylu do natal Saturna..." (żargon)

mantra:
✓ "Mniej, ale naprawdę."
✓ "Najpierw przemyśl, potem powiedz."
✓ "Jeden krok do przodu, nie cały plan."
✗ "Wszystko jest możliwe." (banał)`;

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

function offlineReading(_todayLabel: string): DailyReadingData {
  return {
    headline: "Dobry dzień na jedną konkretną decyzję, nie na listę wszystkich",
    theme: "Dziś głowa jest spokojniejsza niż zwykle — warto to wykorzystać.",
    insight: "Jeśli masz coś odłożonego od tygodnia lub dwóch — jakąś decyzję, rozmowę, sprawę — dziś jest dobry moment żeby to ruszyć. Nie chodzi o zrobienie wszystkiego, tylko o jeden krok który odblokuje resztę. Rozrzucanie energii na dziesięć frontów jednocześnie dziś nie przyniesie efektu.",
    action: "Wybierz jedną odłożoną sprawę i zrób jej pierwszy krok przed południem.",
    avoid: "Brania na siebie cudzych problemów kosztem własnych priorytetów.",
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
