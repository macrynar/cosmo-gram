import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase-server";
import { calculateChart } from "@/lib/chart-engine";
import type { NatalAspect, ChartNodes } from "@/lib/chart-engine";
import { hasActiveSubscription, getUserSubscription } from "@/lib/subscription";
import type { NatalChart } from "@/lib/astro-types";
import type { SystemBlock } from "@/lib/deepseek";
import { checkRateLimit } from "@/lib/rateLimiter";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";
import { getTransitsForDate, getDayWeather, getUpcomingSignificantTransits } from "@/lib/astro/transits";

const FREE_CHAT_MESSAGES = 3;
const PREMIUM_MONTHLY_LIMIT = 150;
// Proactive opener threshold: score at which a transit warrants an opener
const PROACTIVE_OPENER_THRESHOLD = 25;

// ─── System prompt ────────────────────────────────────────────────────────────

const CHAT_SYSTEM_PROMPT = `Jesteś Astrea — astrolożka światowej klasy. Rozmawiasz z jedną osobą, której kosmogram masz przed sobą. Interpretujesz wykres jak doświadczony astrolog: łączysz elementy w spójny obraz i mówisz to, co naprawdę widzisz. Nie jesteś encyklopedią ani wyrocznią — jesteś mądrą, uważną przewodniczką. Marka: symboliczne lustro do refleksji, nie automat do wróżb.

# ZASADA NR 1 — DOBIERZ MATERIAŁ DO PYTANIA
Zanim odpowiesz, rozpoznaj, o co NAPRAWDĘ pyta ta osoba, i sięgnij po właściwy materiał. To najważniejsza decyzja w każdej odpowiedzi.

A) PYTANIA O TOŻSAMOŚĆ I SENS → czytasz KOSMOGRAM NATALNY (nie dzisiejsze niebo).
   Przykłady: „jaki jest sens/cel mojego życia", „kim jestem", „jakie mam mocne strony / talenty / blokady", „jaki mam charakter", „dlaczego ciągle przyciągam tych samych ludzi", „po co tu jestem", „czego o sobie nie wiem", „w czym tkwi moja siła".
   → Interpretuj placementy, ASPEKTY i WĘZŁY. NIE wspominaj o dzisiejszych tranzytach — nie mają tu nic do rzeczy.

B) PYTANIA O CZAS I PRZYSZŁOŚĆ → czytasz TRANZYTY + nadchodzące okna, na bazie natalu.
   Przykłady: „co mnie czeka dziś / jutro / w tym tygodniu / w tym roku", „kiedy nadejdzie X", „czy teraz dobry moment na Y", „co przede mną".
   → Użyj dzisiejszych tranzytów i okien z kontekstu. Natal jest mapą bazową, tranzyt jest pogodą.

C) PYTANIA MIESZANE (relacje, decyzje, „czy ta relacja ma przyszłość") → natal jako fundament (kto/dlaczego), warstwa czasu TYLKO jeśli pytanie ma horyzont czasowy.

GDY WĄTPLIWE — domyślnie czytaj NATAL. To rdzeń produktu. Tranzyty wnoś wyłącznie, gdy pytanie wyraźnie dotyczy czasu, teraz lub przyszłości. NIGDY nie wrzucaj dzisiejszego układu planet tylko dlatego, że masz go w kontekście.

# ZASADA NR 2 — ODPOWIADAJ NA PYTANIE
Pierwsze zdanie to ODPOWIEDŹ na pytanie, nie nazwa planety ani opis aspektu. Astrologia to Twoje NARZĘDZIE, nie temat rozmowy. Najpierw mów, co widzisz dla tej osoby; dopiero potem — jeśli pasuje — pokaż, skąd to wiesz z wykresu. Nie zaczynaj dwóch odpowiedzi z rzędu tym samym schematem „[Planeta] w [aspekcie] do [punktu]". Nie otwieraj odpowiedzi komentarzem, że ktoś „wraca do tematu".

# JAK CZYTAĆ KOSMOGRAM (pytania typu A)
Nie wyliczaj pozycji — SYNTETYZUJ. Znajdź wspólny wątek wykresu. Twoje główne narzędzia:
- Słońce (rdzeń, witalność, cel) — znak i dom mówią, w czym się realizujesz.
- Księżyc (potrzeby emocjonalne, instynkt, co daje poczucie bezpieczeństwa).
- Ascendent (jak wychodzisz do świata, Twój styl) i jego władca — planeta-ster wykresu.
- MC (powołanie, rola w świecie, kierunek) — kluczowy przy pytaniach o cel i pracę.
- Węzeł Północny (kierunek rozwoju w tym życiu) / Południowy (wrodzone dary, strefa komfortu do przekroczenia).
- Aspekty — zwłaszcza do Słońca, Księżyca, Ascendenta i władcy wykresu. Koniunkcja = scalenie, opozycja/kwadratura = napięcie i rozwój, trygon/sekstyl = łatwość i talent.
- Wzorce: stellium (3+ planet w jednym znaku/domu = silny motyw), dominujący żywioł lub jakość.
Przy „sensie/celu życia" oprzyj się na osi: Słońce (znak+dom) + MC + Węzeł Północny + władca wykresu. To jest astrologiczna odpowiedź na „po co tu jestem" — z wykresu, nie z dzisiejszego nieba.

# JAK CZYTAĆ CZAS (pytania typu B)
- Który tranzytujący planeta dotyka którego punktu natalnego i jakim aspektem.
- Charakter planety: Saturn (struktura, próby, dojrzewanie), Jowisz (rozwój, szansa), Uran (przełom, przebudzenie), Neptun (rozpuszczenie, inspiracja albo mgła), Pluton (głęboka transformacja), Mars (napęd, tarcie). Szybkie planety = krótkotrwały nastrój.
- Aspekt aplikujący (narasta) vs separujący (mija); ciaśniejszy = silniej i bliżej w czasie.
- Wskaż realny OKRES z nadchodzących okien, nie konkretną datę dzienną.
- Uczciwie: pokazujesz tendencje i okna czasowe, nie zdarzenia z datą.

# CZEGO NIE ROBIĆ Z ASTROLOGIĄ
- Maks. 1–2 elementy astrologiczne na odpowiedź, wplecione w zdanie — nie lista.
- Zero orbów, score'ów i żargonu („aplikujący", „separujący", „natal") w treści. Tłumacz na ludzki język.
- Jeśli nic naprawdę nie pasuje do pytania — odpowiedz mądrze, bez naciągania astrologii na siłę.

# TON I FORMA
- Mów jak mądry człowiek, nie jak podręcznik. Ciepło, konkretnie, bez lania wody.
- 80–220 słów; krócej przy prostym pytaniu. Nigdy ściana tekstu.
- Markdown: pogrubienie 1–2 kluczowych fraz. Bez nagłówków — to rozmowa, nie raport. Krótkie akapity.
- Pamiętasz wcześniejsze wiadomości — możesz nawiązywać, ale nie zaczynaj od tego.
- Możesz zakończyć JEDNYM krótkim pytaniem zwrotnym, jeśli realnie pcha rozmowę. Nie przesłuchuj.

# GRANICE BEZPIECZEŃSTWA (ZAWSZE)
- Zero diagnoz medycznych i psychiatrycznych. Przy wzmiance o depresji, lęku, samookaleczeniu, myślach samobójczych — NAJPIERW empatyczne uznanie (nie minimalizuj), POTEM delikatne przekierowanie do specjalisty. Nie astrologizuj problemu zdrowotnego.
- Zero przepowiedni jako pewnika: NIE mów „rozstaniesz się", „stracisz pracę", „dostaniesz tę pracę", „on umrze". Opisuj tendencję, nie wyrok.
- Zero porad medycznych, prawnych, finansowych i inwestycyjnych. Pokaż dynamikę z wykresu, nie rekomendację.
- Tylko astrologia — zero tarota, czakr, numerologii.
- Zero koachingowych ogólników: „zaufaj sobie", „słuchaj serca", „zaufaj procesowi", „wszechświat Ci pomoże".
- Zero wypełniaczy: „fascynujące", „interesujące", „ciekawe".
- Zero „musisz", „na pewno", „zawsze", „nigdy".

# BRAK GODZINY URODZENIA
Bez Ascendenta, MC i domów — czytasz znaki planet, aspekty i węzły. Nie wspominasz o domach ani Ascendencie i nie tłumaczysz tego userowi.

# FORMAT ODPOWIEDZI
Zwróć najpierw treść jako czysty Markdown z PRAWDZIWYMI akapitami (rozdzielaj akapity pustą linią — NIGDY nie wpisuj znaków „\\n" jako tekstu).
Następnie, jeśli masz dobre propozycje, dodaj osobną linię z dokładnie:
===PYTANIA===
i pod nią 2 pytania, które TA OSOBA mogłaby zadać Ci dalej — w PIERWSZEJ osobie, jej głosem, jakby pisała je sama. Każde w osobnej linii, max 55 znaków, bez numeracji i bez cudzysłowów.

Dobre followupy (głos usera, 1. osoba):
Co konkretnie mam z tym zrobić w najbliższym czasie?
Gdzie w moim kosmogramie to widać?

ŹLE — to są pytania DO usera, NIGDY tak:
Co czujesz, gdy o tym myślisz?
Czy sens to dla Ciebie proces?

Jeśli nie masz dobrych pytań — pomiń całą sekcję ===PYTANIA===.

${STYLE_BLOCK}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTodayLabel(): string {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Warsaw",
  }).format(new Date());
}

function buildTransitContext(natalChart: NatalChart): string {
  const now = new Date();
  const transits = getTransitsForDate(natalChart, now);
  const weather = getDayWeather(transits);
  const top3 = transits.slice(0, 3);
  const upcoming = getUpcomingSignificantTransits(natalChart, 14, now).slice(0, 2);

  const topLines = top3.length > 0
    ? top3.map(t => `- ${t.transitPlanet} ${t.aspectType} natal ${t.natalPoint} (orb ${t.orbDegrees}°, ${t.applying ? "aplika" : "separuje"}, ${t.favorable ? "sprzyjający" : "napięciowy"}, score ${Math.round(t.score)})`)
      .join("\n")
    : "— brak znaczących tranzytów.";

  const upcomingLines = upcoming.length > 0
    ? upcoming.map(t => `- ${t.date}: ${t.transitPlanet} ${t.aspectType} natal ${t.natalPoint}`).join("\n")
    : "— brak w ciągu 14 dni.";

  return `Dzisiejsza data: ${buildTodayLabel()}.
Pogoda dnia: ${weather.character}, intensywność ${weather.intensity}/5, element ${weather.element}.

Tranzyty dziś (top 3):
${topLines}

Nadchodzące istotne tranzyty (14 dni):
${upcomingLines}`;
}

const FOLLOWUP_DELIM = "===PYTANIA===";

function parseReply(raw: string): { reply: string; suggested_followups: string[] } {
  // Safety net: convert any escaped \n sequences to real newlines
  const normalized = raw.replace(/\\n/g, "\n").trim();

  const idx = normalized.indexOf(FOLLOWUP_DELIM);
  if (idx === -1) {
    return { reply: normalized, suggested_followups: [] };
  }

  const reply = normalized.slice(0, idx).trim();
  const followups = normalized
    .slice(idx + FOLLOWUP_DELIM.length)
    .split("\n")
    .map(l => l.replace(/^[-*\d.)\s]+/, "").replace(/^["„']|[""']$/g, "").trim())
    .filter(Boolean)
    .slice(0, 2);

  return { reply: reply || normalized, suggested_followups: followups };
}

// ─── Natal context builder (FIX 2 — aspects + nodes) ────────────────────────

const ASPECT_PL: Record<string, string> = {
  conjunction: "w koniunkcji z",
  sextile:     "w sekstylu do",
  square:      "w kwadraturze do",
  trine:       "w trygonie do",
  opposition:  "w opozycji do",
};

function buildNatalContext(
  promptContext: string,
  aspects: NatalAspect[],
  nodes: ChartNodes,
  personName?: string,
): string {
  const aspectLines = aspects.length
    ? aspects.map(a => `- ${a.planet_a} ${ASPECT_PL[a.type] ?? a.type} ${a.planet_b}`).join("\n")
    : "— brak aspektów w orbach.";

  const nh = nodes.north_node_house ? ` (dom ${nodes.north_node_house})` : "";
  const sh = nodes.south_node_house ? ` (dom ${nodes.south_node_house})` : "";
  const nodeLine =
    `Węzeł Północny: ${nodes.north_node_sign}${nh} — kierunek rozwoju.\n` +
    `Węzeł Południowy: ${nodes.south_node_sign}${sh} — wrodzone, do przekroczenia.`;

  return [
    personName ? `Osoba: ${personName}` : "",
    promptContext,
    `\nAspekty natalne:\n${aspectLines}`,
    `\nWęzły:\n${nodeLine}`,
  ].filter(Boolean).join("\n");
}

// ─── Paywall ──────────────────────────────────────────────────────────────────

type QuotaResult = { status: "ok" | "paywall" | "monthly_limit" | "need_topup"; consumesCredit: boolean };

async function getChatCredits(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("user_preferences")
    .select("chat_credit_balance")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as { chat_credit_balance?: number } | null)?.chat_credit_balance ?? 0;
}

async function checkQuota(userId: string, convIds: string[]): Promise<QuotaResult> {
  const isPaid = await hasActiveSubscription(userId);

  if (!isPaid) {
    const { count } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds.length > 0 ? convIds : ["__none__"])
      .eq("role", "user");
    if ((count ?? 0) < FREE_CHAT_MESSAGES) return { status: "ok", consumesCredit: false };
    const credits = await getChatCredits(userId);
    if (credits > 0) return { status: "ok", consumesCredit: true };
    return { status: "paywall", consumesCredit: false };
  }

  // Premium: billing anniversary or calendar month
  const sub = await getUserSubscription(userId);
  let periodStart: Date;
  if (sub?.current_period_start) {
    periodStart = new Date(sub.current_period_start);
    const now = new Date();
    while (true) {
      const next = new Date(periodStart);
      next.setMonth(next.getMonth() + 1);
      if (next > now) break;
      periodStart = next;
    }
  } else {
    periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
  }

  const { count } = await supabaseAdmin
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in("conversation_id", convIds.length > 0 ? convIds : ["__none__"])
    .eq("role", "user")
    .gte("created_at", periodStart.toISOString());

  if ((count ?? 0) < PREMIUM_MONTHLY_LIMIT) return { status: "ok", consumesCredit: false };

  const credits = await getChatCredits(userId);
  if (credits > 0) return { status: "ok", consumesCredit: true };

  return { status: "need_topup", consumesCredit: false };
}

// ─── Session summaries ────────────────────────────────────────────────────────

async function getSessionSummaries(userId: string, excludeConvId: string): Promise<string> {
  const { data: sessions } = await supabaseAdmin
    .from("conversations")
    .select("id, title, summary, last_message_at")
    .eq("user_id", userId)
    .not("id", "eq", excludeConvId)
    .not("summary", "is", null)
    .order("last_message_at", { ascending: false })
    .limit(5);

  if (!sessions || sessions.length === 0) return "";

  const lines = sessions.map(s =>
    `Rozmowa „${s.title ?? "bez tytułu"}" (${s.last_message_at?.slice(0, 10) ?? "?"}): ${s.summary}`
  );
  return `# Poprzednie rozmowy (do 5)\n\n${lines.join("\n\n")}`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const { conversationId, content, chartContextType, chartContextId } = await req.json() as {
    conversationId: string;
    content: string;
    chartContextType?: "natal" | "child";
    chartContextId?: string;
  };

  if (!conversationId || !content?.trim()) {
    return NextResponse.json({ error: "Brak danych" }, { status: 400 });
  }

  const rateLimitRes = await checkRateLimit("chat", user.id);
  if (rateLimitRes) return rateLimitRes;

  if (content.trim().length > 2000) {
    return NextResponse.json({ error: "Wiadomość zbyt długa (max 2000 znaków)" }, { status: 400 });
  }

  // Paywall check
  let consumesCredit = false;
  try {
    const { data: userConvs } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("user_id", user.id);
    const convIds = (userConvs ?? []).map(c => c.id);
    const quota = await checkQuota(user.id, convIds);
    if (quota.status === "paywall")       return NextResponse.json({ error: "PAYWALL" }, { status: 402 });
    if (quota.status === "monthly_limit") return NextResponse.json({ error: "MONTHLY_LIMIT" }, { status: 402 });
    if (quota.status === "need_topup")    return NextResponse.json({ error: "NEED_TOPUP" }, { status: 402 });
    consumesCredit = quota.consumesCredit;
  } catch { /* paywall check failed gracefully — allow message */ }

  // Verify conversation ownership
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id, title")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!conv) return NextResponse.json({ error: "Nie znaleziono rozmowy" }, { status: 404 });

  // Get chart context
  let natalContext = "";
  let chartPersonName = "";
  let natalChart: NatalChart | null = null;
  try {
    let chartData: NatalChart | null = null;

    if (chartContextId && chartContextType === "child") {
      const { data } = await supabaseAdmin
        .from("children")
        .select("chart_data, name")
        .eq("id", chartContextId)
        .eq("user_id", user.id)
        .single();
      if (data?.chart_data) { chartData = data.chart_data as NatalChart; chartPersonName = data.name; }
    } else if (chartContextId && chartContextType === "natal") {
      const { data } = await supabaseAdmin
        .from("readings")
        .select("chart_data, name")
        .eq("id", chartContextId)
        .eq("user_id", user.id)
        .single();
      if (data?.chart_data) { chartData = data.chart_data as NatalChart; chartPersonName = data.name; }
    } else {
      const { data } = await supabaseAdmin
        .from("readings")
        .select("chart_data, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data?.chart_data) { chartData = data.chart_data as NatalChart; chartPersonName = data.name; }
    }

    if (chartData) {
      natalChart = chartData;
      const bd = chartData.birthData;
      const { promptContext, aspects, nodes } = calculateChart({ date: bd.date, time: bd.time, lat: bd.lat, lng: bd.lng, place: bd.place });
      natalContext = buildNatalContext(promptContext, aspects, nodes, chartPersonName || undefined);
    }
  } catch { /* use empty context */ }

  // Get last 10 messages of current session
  const { data: history } = await supabaseAdmin
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(10);
  const historyMessages = (history ?? []).reverse();

  // Get previous session summaries (FAZA 1 — up to 5, lazy generated)
  const sessionSummaries = await getSessionSummaries(user.id, conversationId);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      reply: "Interpretacja AI chwilowo niedostępna. Spróbuj ponownie za chwilę.",
      suggested_followups: [],
    });
  }

  // Only inject transits when question is timing-related (P2 heuristic + FIX 3)
  const TIMING_RE = /\b(dzi[śs]|jutro|wczoraj|teraz|tydzie[ńn]|miesi[ąa]c|rok|kiedy|czeka|przysz|nadejdzie|wkr[óo]tce|moment|czas)\b/i;
  const isTimingQuestion = TIMING_RE.test(content);
  const transitSection = (natalChart && isTimingQuestion)
    ? `# Tranzyty — pogoda na dziś (UŻYWAJ TYLKO przy pytaniach o czas/teraz/przyszłość)\n\n${buildTransitContext(natalChart)}`
    : `Dzisiejsza data: ${buildTodayLabel()}.`;

  const dynamicPart = [
    sessionSummaries || "",
    transitSection,
  ].filter(Boolean).join("\n\n");

  const systemBlocks: SystemBlock[] = [
    { type: "text", text: CHAT_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    natalContext
      ? { type: "text", text: `# Kosmogram tej osoby\n\n${natalContext}`, cache_control: { type: "ephemeral" } }
      : { type: "text", text: "Osoba nie ma jeszcze wygenerowanego kosmogramu — możesz zadawać pytania o datę urodzenia lub sugerować generowanie wykresu." },
    ...(dynamicPart.trim() ? [{ type: "text" as const, text: dynamicPart }] : []),
  ];

  const messages = [
    ...historyMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: content.trim() },
  ];

  // Build system string from systemBlocks
  const systemStr = systemBlocks.map(b => b.text).join("\n\n");

  // Create streaming response
  const encoder = new TextEncoder();
  let fullResponse = "";

  const readableStream = new ReadableStream({
    async start(controller) {
      const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      try {
        const stream = await client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1800,
          system: systemStr,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        });

        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const text = chunk.delta.text;
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();

        // After stream is complete, save to database asynchronously
        // Don't await this — let it run in background
        (async () => {
          try {
            const { reply, suggested_followups } = parseReply(fullResponse);

            const now = new Date().toISOString();
            await supabaseAdmin.from("messages").insert([
              { conversation_id: conversationId, role: "user",      content: content.trim() },
              { conversation_id: conversationId, role: "assistant", content: reply },
            ]);

            const isFirstExchange = historyMessages.length === 0;
            await supabaseAdmin
              .from("conversations")
              .update({
                updated_at: now,
                last_message_at: now,
                ...(isFirstExchange ? { title: content.trim().slice(0, 50) } : {}),
              })
              .eq("id", conversationId);

            if (consumesCredit) {
              await supabaseAdmin.rpc("deduct_chat_credit", { p_user_id: user.id });
            }
          } catch (err) {
            console.error("Error saving chat message:", err);
          }
        })();
      } catch (error) {
        console.error("Stream error:", error);
        const errMsg = error instanceof Error ? error.message : "Błąd AI";
        controller.enqueue(
          encoder.encode(`\n\n---ERROR---\n${errMsg}`)
        );
        controller.close();
      }
    },
  });

  return new NextResponse(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
