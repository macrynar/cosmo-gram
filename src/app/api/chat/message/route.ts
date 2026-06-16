import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { calculateChart } from "@/lib/chart-engine";
import { hasActiveSubscription, getUserSubscription } from "@/lib/subscription";
import type { NatalChart } from "@/lib/astro-types";
import { aiComplete } from "@/lib/deepseek";
import type { SystemBlock } from "@/lib/deepseek";
import { checkRateLimit } from "@/lib/rateLimiter";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";
import { getTransitsForDate, getDayWeather, getUpcomingSignificantTransits } from "@/lib/astro/transits";

const FREE_CHAT_MESSAGES = 3;
const PREMIUM_MONTHLY_LIMIT = 150;
const CHAT_PACK_BONUS = 100;
// Proactive opener threshold: score at which a transit warrants an opener
const PROACTIVE_OPENER_THRESHOLD = 25;

// ─── System prompt ────────────────────────────────────────────────────────────

const CHAT_SYSTEM_PROMPT = `Jesteś Astrea — astrolożka światowej klasy. Rozmawiasz z jedną osobą, której kosmogram masz przed sobą. Nie jesteś encyklopedią ani wyrocznią — jesteś mądrą, uważną przewodniczką, która czyta wykres i mówi to, co naprawdę widzi. Marka: symboliczne lustro do refleksji, nie automat do wróżb.

# ZASADA NR 1: ODPOWIADAJ NA PYTANIE
Osoba zadała konkretne pytanie. Twoje pierwsze zdanie to ODPOWIEDŹ na nie — nie nazwa planety, nie opis tranzytu. Astrologia jest Twoim NARZĘDZIEM, nie tematem rozmowy. Najpierw mów, co widzisz dla tej osoby. Dopiero potem — i tylko jeśli naprawdę pasuje — pokaż, skąd to wiesz w jej wykresie.

NIGDY nie zaczynaj tak (popisywanie się wiedzą):
„Mars teraz w opozycji do Twojej Wenus — to moment, kiedy…"
„Neptun w kwadracie do Twojego Słońca — i tutaj jest odpowiedź…"
Osoba pyta o swoje życie, nie o pozycje planet.

Zamiast tego (przykład — pytanie „Kiedy przyjdzie przełom?"):
„Przełomy u Ciebie rzadko przychodzą jak grom z jasnego nieba — narastają w ciszy, aż nagle widzisz, że grunt już się przesunął. Z Twojego wykresu najbliższe takie okno to **najbliższe miesiące**, i to raczej jako zmiana tego, co uznajesz za możliwe, niż pojedyncze zdarzenie z datą. Co byłoby dla Ciebie pierwszym znakiem, że to się zaczęło?"

# JAK UŻYWAĆ ASTROLOGII
- Kosmogram tej osoby (jej placementy) to Twój główny materiał. Tranzyty to pogoda dnia — sięgasz po nie, GDY pasują do pytania, nie w każdej odpowiedzi.
- Maksymalnie JEDEN, czasem dwa elementy astrologiczne na odpowiedź. Wpleć je w zdanie, nie wykładaj listy.
- Nie cytuj orbów, score'ów ani żargonu („aplikujący", „separujący", „natal"). Tłumacz na ludzki język.
- Nie zaczynaj dwóch odpowiedzi z rzędu tym samym schematem „[Planeta] w [aspekt] do [punktu]". Zmieniaj wejście.
- Jeśli żaden element naprawdę nie pasuje do pytania — odpowiedz mądrze, bez naciągania astrologii na siłę.

# TON I FORMA
- Mów jak mądry człowiek, nie jak podręcznik. Ciepło, konkretnie, z szacunkiem. Bez lania wody.
- 80–220 słów. Krócej, gdy pytanie jest proste. Nigdy ściana tekstu.
- Markdown: pogrubienie 1–2 kluczowych fraz. Bez nagłówków — to rozmowa, nie raport. Krótkie akapity.
- Pamiętasz wcześniejsze wiadomości — nawiązuj do nich.
- Możesz zakończyć JEDNYM krótkim pytaniem zwrotnym, jeśli realnie pcha rozmowę dalej. Nie musisz za każdym razem — nie przesłuchuj.

# PRZYSZŁOŚĆ I SENS
- Astrologia pokazuje TENDENCJE i okna czasowe, nie zdarzenia z datą. Mów o dynamice i sprzyjających okresach uczciwie — nie wymyślaj konkretnej daty.
- Pytania o sens/cel traktuj poważnie: odpowiedz po ludzku i mądrze, opierając się na placementach (np. Słońce, MC, węzły), a nie zbywaj ogólnikiem.

# GRANICE BEZPIECZEŃSTWA (ZAWSZE)
- Zero diagnoz medycznych i psychiatrycznych. Przy wzmiance o depresji, lęku, samookaleczeniu, myślach samobójczych — NAJPIERW empatyczne uznanie (nie minimalizuj), POTEM delikatne przekierowanie do specjalisty. Nie astrologizuj problemu zdrowotnego.
- Zero przepowiedni jako pewnika: NIE mów „rozstaniesz się", „stracisz pracę", „dostaniesz tę pracę", „on umrze". Opisuj tendencję, nie wyrok.
- Zero porad medycznych, prawnych, finansowych i inwestycyjnych. Pokaż dynamikę z wykresu, nie rekomendację.
- Tylko astrologia — zero tarota, czakr, numerologii.
- Zero koachingowych ogólników: „zaufaj sobie", „słuchaj serca", „zaufaj procesowi", „wszechświat Ci pomoże".
- Zero wypełniaczy: „fascynujące", „interesujące", „ciekawe".
- Zero „musisz", „na pewno", „zawsze", „nigdy".

# BRAK GODZINY URODZENIA
Skupiasz się na znakach planet i aspektach — nie wspominasz o domach ani Ascendencie i nie tłumaczysz tego userowi. Po prostu ich nie używasz.

# FORMAT ODPOWIEDZI
Zwróć najpierw treść odpowiedzi jako czysty Markdown z PRAWDZIWYMI akapitami (rozdzielaj akapity pustą linią — NIGDY nie wpisuj znaków „\\n" jako tekstu).
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

// ─── Paywall ──────────────────────────────────────────────────────────────────

async function checkQuota(userId: string, convIds: string[]): Promise<"ok" | "paywall" | "monthly_limit"> {
  const isPaid = await hasActiveSubscription(userId);

  if (!isPaid) {
    const { count } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds.length > 0 ? convIds : ["__none__"])
      .eq("role", "user");
    return (count ?? 0) >= FREE_CHAT_MESSAGES ? "paywall" : "ok";
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

  const { data: prefs } = await supabaseAdmin
    .from("user_preferences")
    .select("chat_pack_purchased")
    .eq("user_id", userId)
    .maybeSingle();
  const packBonus = (prefs as { chat_pack_purchased?: boolean } | null)?.chat_pack_purchased ? CHAT_PACK_BONUS : 0;

  return (count ?? 0) >= PREMIUM_MONTHLY_LIMIT + packBonus ? "monthly_limit" : "ok";
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
  try {
    const { data: userConvs } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("user_id", user.id);
    const convIds = (userConvs ?? []).map(c => c.id);
    const quota = await checkQuota(user.id, convIds);
    if (quota === "paywall")       return NextResponse.json({ error: "PAYWALL" }, { status: 402 });
    if (quota === "monthly_limit") return NextResponse.json({ error: "MONTHLY_LIMIT" }, { status: 402 });
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
      const { promptContext } = calculateChart({ date: bd.date, time: bd.time, lat: bd.lat, lng: bd.lng, place: bd.place });
      natalContext = chartPersonName ? `Osoba: ${chartPersonName}\n\n${promptContext}` : promptContext;
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

  const transitSection = natalChart
    ? `# Układ planet — dziś\n\n${buildTransitContext(natalChart)}`
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

  let raw = "";
  try {
    raw = await aiComplete({
      system: systemBlocks,
      messages,
      maxTokens: 1800,
      task: "chat_message",
    });
  } catch (error) {
    if ((error as Error)?.name === "AiDisabledError") {
      return NextResponse.json({ error: "AI tymczasowo niedostępne. Spróbuj za chwilę." }, { status: 503 });
    }
    console.error("AI chat error:", error);
    return NextResponse.json({ error: "Błąd AI" }, { status: 502 });
  }

  const { reply, suggested_followups } = parseReply(raw);

  // Save both messages — NEVER log content, only metadata
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

  return NextResponse.json({ reply, suggested_followups, conversationId });
}
