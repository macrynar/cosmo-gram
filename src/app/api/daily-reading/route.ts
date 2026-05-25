import { NextRequest, NextResponse } from "next/server";
import { computeTopTransits } from "@/lib/chart-engine";
import type { NatalChart } from "@/lib/astro-types";
import { deepSeekChat } from "@/lib/deepseek";

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
  grammaticalForm?: "masculine" | "feminine" | "impersonal";
  chartData?: NatalChart;
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

# ZAKAZ BEZWZGLĘDNY — SLASH-FORMY
Nigdy nie używaj slash-form. Zakazane konstrukcje:
- "oddałeś/aś", "powinieneś/powinnaś", "chciałeś/aś", "byłeś/aś"
- "zmęczony/a", "gotowy/a", "otwarty/a"
- Każde "/" w czasowniku lub przymiotniku = output odrzucony
Zamiast: używaj bezosobowych konstrukcji ("można poczuć", "warto sprawdzić", "pojawia się zmęczenie") lub formy z inputu.
Sprawdź regex /\w+\/\w+/ przed wysłaniem — zero tolerancji.

# ZAKAZ żargonu astrologicznego w outputcie
ZERO: "Mars kwadrat natal Jowisz", "tranzytujący Saturn", "dom 7", "sekstylem", "opozycja natal", "orb", stopni i minut ("19°55'"), "retrograde", "applying".
Możesz MYŚLEĆ o tranzytach żeby zrozumieć energię dnia — w tekście TŁUMACZYSZ to na ludzki język.

# ZAKAZ clichés i fillerów
- "zaufaj sobie" / "zaufaj procesowi" / "wszechświat" / "moc chwili" / "słuchaj serca"
- "To nie lenistwo, to sygnał..." (coaching-filler bez podstawy astro)
- "Twoje przeczucie" / "energia kosmiczna" / "fundament duchowy"
- Zero filler-coachingu bez konkretnego astro-anchora

# Jak tłumaczyć planety na ludzki język
Mars (napięcie, energia, konflikty) → "dziś słowa mogą wychodzić ostrzej", "energia szuka ujścia"
Saturn (dyscyplina, ocena, ograniczenia) → "dobry moment na trzeźwą ocenę", "czas zamykać zaległe sprawy"
Wenus (relacje, pieniądze, przyjemność) → "relacje wymagają dziś uważności"
Księżyc (emocje, nastrój) → "nastrój może być zmienny", "emocje są blisko powierzchni"
Merkury (komunikacja, myślenie) → "rozmowy mogą być napięte", "dobry dzień na decyzje"
Jowisz (ekspansja, optymizm) → "pojawia się okno na odważniejszy ruch"
Neptun (marzenia, mętlik) → "trudniej o jasną decyzję"

# TWARDY FORMAT — transity MUSZĄ być zakotwiczone

Jeśli dostałeś top_transit_supporting i top_transit_challenging:
- "Co dziś wspiera" — PIERWSZA fraza musi nazwać transit_planet z top_transit_supporting.
  Wzór: "{Planeta} przechodzi przez {znak} i robi {co} z {natal_planet}: {co to znaczy konkretnie}."
  Przykład: "Wenus w Bliźniakach tworzy delikatny most z Twoim Marsem — łatwiej Ci dziś nawiązać kontakt niż zwykle."
- "Co dziś uwiera" — PIERWSZA fraza musi nazwać transit_planet z top_transit_challenging.
  Bez katastrofizowania, bez "uważaj".

Jeśli BRAK tranzytów (orb >5°): opierasz output o fazę Księżyca + tranzytujący Księżyc.
NIGDY nie generuj generic content bez konkretnego astro-anchora.

# Zasady pisania
1. Pisz jak mądrą znajomą która powiedziałaby to przy kawie — ciepło, konkretnie, bez zadęcia.
2. Każde zdanie musi opisywać SYTUACJĘ lub UCZUCIE które czytelnik może rozpoznać u siebie dziś.
3. Ton: bezpośredni, lekko ironiczny kiedy trzeba, zawsze po stronie człowieka.
4. Insight musi być ZASKAKUJĄCY lub TRAFNY — coś co czytelnik pomyśli "o, to o mnie".
5. Całość ≤150 słów.

# FORMAT — zwróć WYŁĄCZNIE poprawny JSON, bez markdown, bez żadnego tekstu poza JSON

{
  "headline": "<Konkretny obraz dnia, 8-15 słów. Zero żargonu. Zero 'dzień pełen energii'.>",
  "theme": "<1 zdanie. Klimat emocjonalny/sytuacyjny dnia w ludzkich słowach. Max 20 słów.>",
  "insight": "<2-3 zdania. Co dziś czuć lub z czym się mierzyć. Musi zawierać nazwę planety tranzytującej jeśli podano. Konkretne. Zero żargonu. Max 80 słów.>",
  "action": "<1 zdanie behawioralne co zrobić dziś. Musi wynikać z top_transit_supporting. Max 25 słów.>",
  "avoid": "<1 zdanie behawioralne czego unikać. Musi wynikać z top_transit_challenging. Max 25 słów.>",
  "mantra": "<Krótka fraza 5-9 słów. Coś co można powtórzyć w trudnym momencie. Nie banał.>"
}

# Przykłady DOBRYCH pól (zero żargonu):

headline:
✓ "Dziś słowa mogą wychodzić ostrzej — to nie złość, to zmęczenie"
✓ "Dobry moment na zamknięcie jednej sprawy którą odkładałeś od tygodnia"
✗ "Mars kwadrat Saturn: czas audytu" (żargon)
✗ "Dzień pełen energii i możliwości" (banał)

insight (z tranzytem):
✓ "Saturn przechodzi dziś blisko Twojego Słońca — to dobry moment na trzeźwą ocenę co faktycznie działa w Twoich planach, a co tylko dobrze wygląda na papierze. Nie chodzi o krytykę — chodzi o korektę kursu zanim za bardzo odbiegnie od celu."
✗ "Tranzytujący Saturn w sekstylu do natal Saturna..." (żargon)

mantra:
✓ "Mniej, ale naprawdę."
✓ "Najpierw przemyśl, potem powiedz."
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

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { promptContext, interpretationContext, timezone, grammaticalForm, chartData } = await req.json() as DailyReadingBody;
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const safeTz = timezone || "Europe/Warsaw";
  const todayLabel = buildTodayLabel(safeTz);
  const form = grammaticalForm ?? "impersonal";

  if (!promptContext) {
    return NextResponse.json({ error: "Missing promptContext" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({
      dateLabel: todayLabel,
      dailyReading: JSON.stringify(offlineReading(todayLabel)),
    });
  }

  // Compute today's transits vs natal chart (Patch D)
  let transitBlock = "";
  try {
    if (chartData?.planets?.length) {
      const { supporting, challenging } = computeTopTransits(chartData, new Date());
      transitBlock = `\nTranzyt wspierający: ${supporting
        ? `${supporting.transit_planet} w ${supporting.transit_sign} (${supporting.aspect_type}) do natal ${supporting.natal_planet}, orb ${supporting.orb_degrees.toFixed(1)}°`
        : "brak wyraźnego tranzytu — skup się na fazie Księżyca"}\nTranzyt wymagający: ${challenging
        ? `${challenging.transit_planet} w ${challenging.transit_sign} (${challenging.aspect_type}) do natal ${challenging.natal_planet}, orb ${challenging.orb_degrees.toFixed(1)}°`
        : "brak wyraźnego tranzytu"}`;
    }
  } catch {
    // Transit computation failed — continue without transit data
  }

  try {
    const trimmedInterpretation = (interpretationContext || "").slice(0, 2000);
    const slashFormInstruction = `\nForma gramatyczna: ${form} — ZERO slash-form w outputcie.`;
    const dailyModel = process.env.DEEPSEEK_DAILY_MODEL || "deepseek-chat";

    let raw = "";
    try {
      raw = await deepSeekChat({
        apiKey,
        model: dailyModel,
        system: SYSTEM_PROMPT,
        maxTokens: 1200,
        responseFormat: "json_object",
        messages: [
          {
            role: "user",
            content: `Data horoskopu: ${todayLabel}\nStrefa czasowa: ${safeTz}${slashFormInstruction}${transitBlock}\n\nDane kosmogramu natury:\n${promptContext}\n\n${trimmedInterpretation ? `Kontekst z interpretacji natury:\n${trimmedInterpretation}\n\n` : ""}Wygeneruj dzienny horoskop. Zwróć TYLKO JSON.`,
          },
        ],
      });
      // Retry once on v4-flash (still DeepSeek) to keep daily-reading reliable.
      if (!raw.trim()) {
        raw = await deepSeekChat({
          apiKey,
          model: "deepseek-v4-flash",
          system: SYSTEM_PROMPT,
          maxTokens: 1800,
          responseFormat: "json_object",
          messages: [
            {
              role: "user",
              content: `Data horoskopu: ${todayLabel}\nStrefa czasowa: ${safeTz}${slashFormInstruction}${transitBlock}\n\nDane kosmogramu natury:\n${promptContext}\n\n${trimmedInterpretation ? `Kontekst z interpretacji natury:\n${trimmedInterpretation}\n\n` : ""}Wygeneruj dzienny horoskop. Zwróć TYLKO JSON.`,
            },
          ],
        });
      }
    } catch (error) {
      console.error("DeepSeek daily-reading error:", error);
      return NextResponse.json({
        dateLabel: todayLabel,
        dailyReading: JSON.stringify(offlineReading(todayLabel)),
      });
    }

    let reading: DailyReadingData;
    try {
      reading = extractJson(raw);
    } catch {
      console.error("Daily reading JSON parse error:", raw.slice(0, 300));
      if (raw.trim()) {
        return NextResponse.json({ dateLabel: todayLabel, dailyReading: raw.trim() });
      }
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
