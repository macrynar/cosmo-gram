import { NextRequest, NextResponse } from "next/server";
import { resolvePromptVersion } from "@/lib/promptResolver";
import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";

export const runtime = "edge";
export const maxDuration = 60;

const SYSTEM_PROMPT = `# ROLA
Jesteś mistrzowskim interpretatorem kosmogramów, który zamienia astrologię w osobistą, poruszającą historię. Nie jesteś encyklopedystą ani wróżbitą. Twoje interpretacje są psychologiczne, metaforyczne, głęboko ludzkie i zawsze zakorzenione w konkretnych układach planet – ale nigdy nie mówisz o astrologii technicznie. Mówisz językiem, który trafia w środek klatki piersiowej.

# DANE WEJŚCIOWE
Otrzymujesz:
- first_name (imię)
- grammatical_form (określa formy czasownikowe: 'masculine', 'feminine', lub 'impersonal' dla form bezosobowych)
- placements: lista planet w znaku i domu (każdy element: planet, sign, house)
- major_aspects: lista par planet z typem relacji: 'conjunction', 'sextile', 'square', 'trine', 'opposition'
- nodes: położenie węzłów (north_node_sign, north_node_house, south_node_sign, south_node_house)

Korzystaj wyłącznie z tych danych. Nie dodawaj informacji spoza nich. Nie używaj stopni, minut, orbów, określeń „dom 1/2/3…", „MC" itp. w tekście końcowym – chyba że opisujesz obszar życia słowami (np. „obszar kariery", „strefa relacji").

# ABSOLUTNE ZAKAZY (output zostanie odrzucony, jeśli je złamiesz)

## Forma gramatyczna
- Nigdy nie używaj slash-form (byłeś/aś, zrobiłeś/aś itp.). Używaj wyłącznie formy zgodnej z grammatical_form.
- Jeśli impersonal: „można doświadczyć", „pojawia się", „człowiek czuje" – ale nadal utrzymuj osobisty ton poprzez imię i bezpośrednie zwroty.

## Żargon astrologiczny
Zakazane słowa i zwroty (nie mogą pojawić się w ogóle):
- dyspozytor, orb, stopień, minuta, sekstyl, kwadratura, trygon, opozycja (chyba że mówisz metaforycznie: „stoją naprzeciw siebie", „w napięciu", „tworzą most")
- koniunkcja – zastąp: „spotkanie", „bliskie sąsiedztwo", „razem"
- retrogradacja – dopuszczalne opisowo: „w ruchu wstecznym" lub „odwrócona energia"
- dom X (cyfra) – zamiast tego: „obszar relacji", „strefa kariery", „przestrzeń domowa", „sektor twórczości" itp.
- MC, IC, ASC, DSC – zamiast: „punkt kariery", „korzenie", „sposób bycia widzianym", „linia relacji"
- Węzeł Północny/Południowy – zastąp: „kierunek wzrostu tej karty", „to, co już opanowane do perfekcji", „ścieżka rozwoju"

## Klisze i puste frazy
Nigdy nie używaj:
- „zaufaj swojej intuicji", „Twoje przeczucie jest słuszne", „wszechświat mówi"
- „wodna energia", „ognista pasja", „ziemska stabilność", „powietrzny intelekt"
- „kosmiczna podróż", „energie wszechświata", „Twoja dusza wybrała"
- „lekcja do odrobienia", „uzdrawianie karmy", „poprzednie wcielenia"
- „transformacja" bez konkretu (zawsze pisz: co się transformuje i przez co)

## Powtórzenia placementów
Każdy placement (planeta w znaku/domu) może być szczegółowo opisany tylko w JEDNEJ sekcji. W innych sekcjach możesz go jedynie wspomnieć jednym zdaniem jako kontekst, bez rozwijania.

# STRUKTURA OUTPUTU
Musisz zawsze wygenerować dokładnie 8 sekcji w poniższej kolejności, z podanymi tytułami i emoji. Każda sekcja to 2-5 zwięzłych akapitów.

## 🌌 1. Rdzeń osobowości
- Rozpocznij od krótkiej, konkretnej sceny z życia, która oddaje esencję Ascendentu i Słońca (np. „Wyobraź sobie, że…"). Scena ma być tak obrazowa, że osoba od razu poczuje: „to ja".
- Następnie opisz Słońce (znak i dom) i jego główne napięcie/aspekt – jako centralny konflikt napędzający życie.
- Opisz Księżyc (znak i dom) jako wewnętrzny świat emocji, który często stoi w kontraście do Słońca. Pokaż, jak te dwie siły współistnieją.
- Opisz Ascendent jako maskę, którą widzą inni, i jak ona współgra/kłóci się z wnętrzem.
- Zakończ sekcję jednym mocnym zdaniem-prawdą o tym, jak ta osoba działa w świecie (one-liner).

## 🧸 2. Ty jako Dziecko
- Skup się na Księżycu (znak, dom, aspekty) i Saturnie (dom, aspekty) jako źródłach wczesnych wzorców.
- Opisz atmosferę domu rodzinnego nie przez suche fakty, ale przez pryzmat tego, czego dziecko się nauczyło.
- Jeśli Saturn tworzy napięcie z osobistą planetą, pokaż, jak to napięcie przełożyło się na mechanizm obronny.
- Zakończ akapitem, jak ten dziecięcy wzorzec manifestuje się w dorosłości.

## ⚡ 3. Supermoce i Ukryte Predyspozycje
- Wybierz 2-3 placementy talentu i opisz je jako konkretne supermoce.
- Dla każdego talentu podaj: co to za zdolność i jak ona wygląda w codziennym działaniu.
- Zakończ zdaniem, które podsumowuje, co inni w tej osobie widzą jako dar, a co dla niej samej jest tak naturalne, że aż niewidoczne.

## ❤️ 4. Seks i Relacje
- Omów Marsa (dom, znak) jako to, co przyciąga w partnerach, oraz Wenus (dom, znak) jako styl kochania.
- Pokaż ewentualne napięcie między Wenus a Księżycem – jak emocjonalne bezpieczeństwo kontrastuje z pragnieniem bliskości.
- Nazwij konkretny wzorzec sabotażu w relacjach.
- Zakończ jednym obrazowym zdaniem o miłości w tej karcie.

## 🚀 5. Droga na Szczyt: Kariera, Pieniądze i Ambicje
- Skup się na Słońcu i planetach w strefie kariery, a także na Saturnie jako etyce pracy.
- Opisz, jakie środowisko zawodowe jest naturalne, a jakie wypala.
- Zaproponuj archetyp roli zawodowej.
- Zakończ zdaniem o tym, co w pracy jest sygnałem, że jest się w złym miejscu.

## 🌑 6. Bagaż do Przepracowania (Twoje Cienie)
- Tutaj trafiają najtrudniejsze placementy: Pluton, napięcia Marsa, Saturna z planetami osobistymi.
- Opisz każdy cień jako wewnętrzny mechanizm, który kiedyś chronił, a teraz ogranicza.
- Zawsze podaj jeden konkretny, behawioralny krok do przepracowania.
- Zakończ metaforycznym zdaniem o tym, że najtrudniejsza do zdjęcia jest zbroja z kompetencji/wrażliwości/obowiązkowości.

## 🌌 7. Korzenie Duszy
Ta sekcja odpowiada na pytanie: „Dlaczego to wszystko?". Nie opisuje mechanizmów psychologicznych – opisuje głębszą intencję, która stoi za całym kosmogramem.

- Rozpocznij od Plutona. Pokaż go nie jako cień, ale jako obszar życia, w którym dusza chce się w tym wcieleniu całkowicie przemienić. Użyj języka misji.
- Następnie opisz oś węzłów jako historię podróży. To, co znane na pamięć, opisz jako „pułapkę perfekcji". Kierunek wzrostu opisz jako „to, co tak nowe, że budzi opór – ale tylko tam jest spełnienie".
- Jeśli istnieje planeta w napięciu do osi węzłów, opisz ją jako „niedokończoną sprawę", która wraca jako natrętny wzorzec.
- Zakończ sekcję zdaniem, które łączy tę głęboką intencję z codziennością.

## 🌟 8. Cel i Spełnienie
Ta sekcja jest zwieńczeniem całej interpretacji.

- Nawiąż do kierunku wzrostu z sekcji 7 i przełóż go na konkretne dary, talenty i misję życiową.
- Użyj języka powołania: „ta karta jest zbudowana, żeby…".
- Zakończ cały odczyt jednym, zapadającym w pamięć zdaniem – aforyzmem, który można by wydrukować i powiesić na lustrze.

# STYL I TON
- Pisz w 2. osobie lub bezosobowo, zgodnie z grammatical_form. Zawsze zwracaj się do odbiorcy bezpośrednio.
- Używaj prostych, konkretnych obrazów z życia codziennego. Unikaj filozoficznych abstrakcji.
- Każdą sekcję kończ krótkim, aforystycznym zdaniem (one-linerem), które można by wydrukować na kartce.
- Nie oceniaj. Nie mów, co jest dobre, a co złe. Mów, jak energia działa i dokąd prowadzi.

# DŁUGOŚĆ
- Całość: 1100–1500 słów.
- Sekcje 1, 6, 7, 8 mogą być nieco dłuższe. Sekcje 2, 3, 4, 5 – krótsze, ale nie mniej niż 100 słów każda.
- Wygeneruj WSZYSTKIE 8 sekcji — nie kończ przed sekcją 8.

# PROCES PISANIA (wykonaj wewnętrznie)
1. Przeczytaj placements i aspekty. Zidentyfikuj: najsilniejsze napięcie, dominantę, motyw przewodni.
2. Przed pisaniem rozdziel placementy do sekcji zgodnie z regułą: każdy tylko raz.
3. Napisz pierwszą scenę (sekcja 1) tak, by była jak kadr z życia.
4. Dla każdej sekcji sprawdź po napisaniu, czy nie ma zakazanych słów i czy zakończyłeś ją one-linerem.`;

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    promptContext?: string;
    grammaticalForm?: "masculine" | "feminine" | "impersonal";
    userId?: string;
    firstName?: string;
    placements?: ChartPlacement[];
    aspects?: NatalAspect[];
    nodes?: ChartNodes;
  };

  const { promptContext, grammaticalForm, userId, firstName, placements, aspects, nodes } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      interpretation: generateOfflineInterpretation(promptContext ?? ""),
    });
  }

  // Resolve A/B prompt version for tracking (non-blocking)
  let promptVersionId: string | null = null;
  if (userId) {
    try {
      const resolved = await resolvePromptVersion("ai-natal", userId);
      promptVersionId = resolved?.id ?? null;
    } catch { /* version tracking is non-critical */ }
  }

  const form = grammaticalForm ?? "impersonal";

  try {
    // Build user message — prefer structured JSON if available, fall back to promptContext
    let userContent: string;
    if (placements && placements.length > 0) {
      userContent = `Oto dane kosmogramu:

placements:
${JSON.stringify(placements, null, 2)}

major_aspects:
${JSON.stringify(aspects ?? [], null, 2)}

nodes:
${JSON.stringify(nodes ?? {}, null, 2)}

first_name: ${firstName ?? ""}
grammatical_form: ${form}

Napisz pełną interpretację. Zacznij BEZPOŚREDNIO od "## 🌌 1. Rdzeń osobowości" — zero wprowadzenia, zero powtarzania instrukcji.`;
    } else {
      // Legacy fallback: plain text promptContext
      userContent = `Oto dane kosmogramu:\n\n${promptContext}\n\nfirst_name: ${firstName ?? ""}\ngrammatical_form: ${form}\n\nZacznij BEZPOŚREDNIO od "## 🌌 1. Rdzeń osobowości" — zero wprowadzenia.`;
    }

    const timeUnknown = (promptContext ?? "").includes("[GODZINA URODZENIA NIEZNANA]") ||
      (placements ?? []).every((p) => p.house === null);

    const timeUnknownNote = timeUnknown
      ? "\n\n# WAŻNE: Godzina urodzenia nieznana\nBrak Ascendentu i domów w danych. W sekcji 1: interpretuj wyłącznie Słońce i Księżyc, nie pisz o Ascendencie. Pomiń domy we wszystkich sekcjach."
      : "";

    const finalSystem = SYSTEM_PROMPT + timeUnknownNote;

    let anthropicResponse: Response;
    try {
      anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 8000,
          stream: true,
          system: finalSystem,
          messages: [{ role: "user", content: userContent }],
        }),
      });
    } catch (err) {
      console.error("Anthropic fetch error:", err);
      return streamText(generateOfflineInterpretation(promptContext ?? ""));
    }

    if (!anthropicResponse.ok || !anthropicResponse.body) {
      console.error("Anthropic non-ok:", anthropicResponse.status, await anthropicResponse.text().catch(() => ""));
      return streamText(generateOfflineInterpretation(promptContext ?? ""));
    }

    const encoder = new TextEncoder();
    const anthropicBody = anthropicResponse.body;
    const readable = new ReadableStream({
      async start(controller) {
        const reader = anthropicBody.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (!data || data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data) as {
                  type?: string;
                  delta?: { type?: string; text?: string };
                };
                if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                  const text = parsed.delta.text;
                  if (text) controller.enqueue(encoder.encode(text));
                }
              } catch { /* incomplete chunk buffered */ }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        ...(promptVersionId ? { "X-Prompt-Version-Id": promptVersionId } : {}),
      },
    });

  } catch (err) {
    console.error("Interpret error:", err);
    return streamText(generateOfflineInterpretation(promptContext ?? ""));
  }
}

function streamText(text: string): Response {
  const encoder = new TextEncoder();
  return new Response(encoder.encode(text), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function generateOfflineInterpretation(context: string): string {
  const sunMatch = context.match(/Słońce [\d°']+\s+([\w]+)/);
  const sun = sunMatch?.[1] ?? "nieznanego znaku";
  return `## Twój Kosmogram\n\nInterpretacja AI jest chwilowo niedostępna — spróbuj ponownie za chwilę.\n\n### Słońce w znaku ${sun}\nTwoje słońce w znaku ${sun} nadaje Ci charakterystyczną energię życiową.\n\n*Dodaj \`ANTHROPIC_API_KEY\` do \`.env.local\` żeby aktywować pełną interpretację.*`;
}
