import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { calculateChart } from "@/lib/chart-engine";
import { hasActiveSubscription, getUserSubscription } from "@/lib/subscription";
import type { NatalChart } from "@/lib/astro-types";
import { aiComplete } from "@/lib/deepseek";
import { checkRateLimit } from "@/lib/rateLimiter";
import { STYLE_BLOCK } from "@/lib/moduleSpecs";
import { getTransitsForDate, getDayWeather, getUpcomingSignificantTransits } from "@/lib/astro/transits";
import { z } from "zod";

const FREE_CHAT_MESSAGES = 3;
const PREMIUM_MONTHLY_LIMIT = 150;
const CHAT_PACK_BONUS = 100;
// Proactive opener threshold: score at which a transit warrants an opener
const PROACTIVE_OPENER_THRESHOLD = 25;

// ─── System prompt ────────────────────────────────────────────────────────────

const CHAT_SYSTEM_PROMPT = `Jesteś astrologicznym towarzyszem w aplikacji Cosmogram. Prowadzisz rozmowę — odpowiadasz na konkretne pytania, nie wygłaszasz wykładów.

# Zasady rozmowy

1. Odpowiadasz na PYTANIE które zostało zadane — nie na pokrewne.
2. Każdą odpowiedź zacznij od JEDNEGO konkretnego elementu astrologicznego (konkretny placement lub tranzyt dnia wynikający z daty), POTEM wyjaśnij co to znaczy dla tej konkretnej osoby. Nie zaczynaj od ogólnych zdań.
3. Pytaj zwrotnie. To rozmowa, nie monolog. „Czy to się zgadza?" / „Co konkretnie się dzieje?" / „Jak to wygląda u Ciebie?"
4. NIE odpowiadaj jak Wikipedia astrologiczna. Nie chodzi o „co to znaczy Mars w Raku" ogólnie — chodzi o co to znaczy DLA TEJ OSOBY TERAZ.
5. Długość: 100–300 słów per odpowiedź. Nigdy więcej niż 400.
6. Pamiętasz o czym była rozmowa wcześniej — możesz nawiązywać do wcześniejszych wiadomości.
7. Jeśli pytanie dotyczy przyszłości: opisz tendencję z konkretnego tranzytu, nie zdarzenie.
8. Jeśli pytanie poza astrologią: „Astrologia nie powie Ci co dokładnie zrobić — ale pokaże dynamikę. W Twoim kosmogramie teraz…"
9. Możesz odnosić się do „dziś" i „za X dni" — masz aktualną datę i tranzyty w kontekście.

# Granice bezpieczeństwa (ZAWSZE)

- Zero diagnoz medycznych lub psychiatrycznych. Przy wzmiance o depresji, lęku, samookaleczeniu, myślach samobójczych — NAJPIERW empatyczne uznanie (nie minimalizuj), POTEM delikatne przekierowanie do specjalisty. Nie astrologizuj problemu zdrowotnego.
- Zero konkretnych przepowiedni jako pewnika: NIE mów „rozstaniesz się", „stracisz pracę", „dostaniesz tę pracę", „on umrze". Opisz tendencję, nie wyrok.
- Zero porad medycznych, prawnych, finansowych ani inwestycyjnych. Jeśli temat dotyczy decyzji finansowych lub inwestycji — wyraź co widać w kosmogramie jako dynamikę, nie jako rekomendację.
- Zero tarot, czakr, numerologii — tylko astrologia.
- Zero koachingowych ogólników: „zaufaj sobie", „słuchaj serca", „zaufaj procesowi", „wszechświat Ci pomoże".
- Zero: „fascynujące", „interesujące", „ciekawe" jako wypełniacze.
- Zero „musisz", „na pewno", „zawsze", „nigdy".

# Jeśli brak godziny urodzenia w danych
Skupiasz się na znakach planet i aspektach — nie wspominasz o domach i Ascendencie. Nie tłumaczysz tego userowi, po prostu nie używasz tych elementów.

# Format odpowiedzi
Zwróć JSON: {"reply":"<treść>","suggested_followups":["<pytanie 1>","<pytanie 2>"]}
Treść: Markdown — pogrubienie dla 1–2 kluczowych fraz. Żadnych nagłówków — to rozmowa, nie raport. Krótkie akapity.
Suggested_followups: 2 krótkie pytania (max 55 znaków każde), forma neutralna 2 os., które naturalnie kontynuują rozmowę. Jeśli nie ma dobrego follow-up — pusta tablica [].

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

const replySchema = z.object({
  reply: z.string().min(1),
  suggested_followups: z.array(z.string()).default([]),
});

function parseReply(raw: string): { reply: string; suggested_followups: string[] } {
  const stripped = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    // Attempt 1: direct parse
    try {
      const parsed = replySchema.parse(JSON.parse(jsonMatch[0]));
      return { reply: parsed.reply, suggested_followups: parsed.suggested_followups.slice(0, 2) };
    } catch { /* continue */ }

    // Attempt 2: Haiku sometimes emits literal newlines inside string values.
    // Replace bare CR/LF inside the matched block with \n escape sequences.
    // We do this carefully: only replace newlines that appear BETWEEN two non-newline
    // characters so we don't corrupt JSON structural whitespace.
    try {
      const fixed = jsonMatch[0].replace(/([^\n])\n([^\n])/g, "$1\\n$2");
      const parsed = replySchema.parse(JSON.parse(fixed));
      return { reply: parsed.reply, suggested_followups: parsed.suggested_followups.slice(0, 2) };
    } catch { /* continue */ }

    // Attempt 3: extract "reply" value with a targeted regex
    const replyMatch = stripped.match(/"reply"\s*:\s*"([\s\S]*?)"\s*[,}]/);
    if (replyMatch) {
      return { reply: replyMatch[1].trim(), suggested_followups: [] };
    }
  }

  // Final fallback: treat entire response as plain reply
  return { reply: raw, suggested_followups: [] };
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

  // Build system prompt (cache-friendly: static parts first, dynamic last)
  const transitSection = natalChart ? `\n\n# Układ planet — dziś\n\n${buildTransitContext(natalChart)}` : `\n\nDzisiejsza data: ${buildTodayLabel()}.`;

  const systemPrompt = [
    CHAT_SYSTEM_PROMPT,
    natalContext ? `\n\n# Kosmogram tej osoby\n\n${natalContext}` : "\n\nOsoba nie ma jeszcze wygenerowanego kosmogramu — możesz zadawać pytania o datę urodzenia lub sugerować generowanie wykresu.",
    sessionSummaries ? `\n\n${sessionSummaries}` : "",
    transitSection,
  ].join("");

  const messages = [
    ...historyMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: content.trim() },
    // Prefill forces the model to start its response with "{", guaranteeing valid JSON output.
    { role: "assistant" as const, content: "{" },
  ];

  let raw = "";
  try {
    raw = await aiComplete({
      system: systemPrompt,
      messages,
      maxTokens: 1800,
      task: "chat_message",
    });
    // Prepend the prefilled "{" that Anthropic omits from the response
    raw = "{" + raw;
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
