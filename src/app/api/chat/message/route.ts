import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { calculateChart } from "@/lib/chart-engine";
import { hasActiveSubscription } from "@/lib/subscription";
import type { NatalChart } from "@/lib/astro-types";

const FREE_CHAT_MESSAGES = 3;

const CHAT_SYSTEM_PROMPT = `Jesteś astrologicznym towarzyszem w aplikacji Cosmogram. Prowadzisz rozmowę - odpowiadasz na konkretne pytania, nie wygłaszasz wykładów.

# Zasady rozmowy

1. Odpowiadasz na PYTANIE które zostało zadane - nie na pokrewne.
2. Każdą odpowiedź zacznij od JEDNEGO konkretnego elementu astrologicznego (konkretny placement lub tranzyt dnia wynikający z daty), POTEM wyjaśnij co to znaczy dla tej konkretnej osoby. Nie zaczynaj od ogólnych zdań.
3. Pytaj zwrotnie. To rozmowa, nie monolog. "Czy to się zgadza?" / "Co konkretnie się dzieje?" / "Jak to wygląda u Ciebie?"
4. NIE odpowiadaj jak Wikipedia astrologiczna. Nie chodzi o "co to znaczy Mars w Raku" ogólnie - chodzi o co to znaczy DLA TEJ OSOBY TERAZ.
5. Długość: 100-300 słów per odpowiedź. Nigdy więcej niż 400.
6. Pamiętasz o czym była rozmowa wcześniej - możesz nawiązywać do wcześniejszych wiadomości.
7. Jeśli pytanie dotyczy przyszłości: opisz tendencję z konkretnego tranzytu, nie zdarzenie.
8. Jeśli pytanie poza astrologią: "Astrologia nie powie Ci co dokładnie zrobić - ale pokaże dynamikę. W Twoim kosmogramie teraz..."

# Zakazy (NIGDY)
- Zero diagnoz medycznych lub psychiatrycznych. Przy wzmiance o depresji/lęku - sugerujesz konsultację ze specjalistą.
- Zero przepowiadania konkretnych zdarzeń ("rozstaniesz się", "stracisz pracę", "dostaniesz tę pracę").
- Zero "musisz", "na pewno", "zawsze", "nigdy".
- Zero tarot, czakr, numerologii - tylko astrologia.
- Zero koachingowych ogólników: "zaufaj sobie", "słuchaj serca", "zaufaj procesowi", "wszechświat Ci pomoże".
- Zero: "fascynujące", "interesujące", "ciekawe" jako wypełniacze.

# Jeśli brak godziny urodzenia w danych
Skupiasz się na znakach planet i aspektach - nie wspominasz o domach i Ascendencie. Nie tłumaczysz tego userowi, po prostu nie używasz tych elementów.

# Format odpowiedzi
Markdown: pogrubienie dla 1-2 kluczowych fraz. Żadnych nagłówków - to rozmowa, nie raport. Krótkie akapity.`;

function buildTodayLabel(): string {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Warsaw",
  }).format(new Date());
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
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

  // Paywall: check message quota for free users
  try {
    const isPaid = await hasActiveSubscription(user.id);
    if (!isPaid) {
      const { data: userConvs } = await supabaseAdmin
        .from("conversations")
        .select("id")
        .eq("user_id", user.id);
      const convIds = (userConvs ?? []).map(c => c.id);
      if (convIds.length > 0) {
        const { count } = await supabaseAdmin
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", convIds)
          .eq("role", "user");
        if (false && (count ?? 0) >= FREE_CHAT_MESSAGES) {
          return NextResponse.json({ error: "PAYWALL" }, { status: 402 });
        }
      }
    }
  } catch { /* paywall check failed gracefully — allow message */ }

  // Verify conversation ownership
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id, title")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!conv) return NextResponse.json({ error: "Nie znaleziono rozmowy" }, { status: 404 });

  // Get chart context — passed from frontend per-message
  let natalContext = "";
  let chartPersonName = "";
  try {
    let chartData: NatalChart | null = null;

    if (chartContextId && chartContextType === "child") {
      const { data } = await supabaseAdmin
        .from("children")
        .select("chart_data, name")
        .eq("id", chartContextId)
        .single();
      if (data?.chart_data) { chartData = data.chart_data as NatalChart; chartPersonName = data.name; }
    } else if (chartContextId && chartContextType === "natal") {
      const { data } = await supabaseAdmin
        .from("readings")
        .select("chart_data, name")
        .eq("id", chartContextId)
        .single();
      if (data?.chart_data) { chartData = data.chart_data as NatalChart; chartPersonName = data.name; }
    } else {
      // fallback: latest natal reading
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
      const bd = chartData.birthData;
      const { promptContext } = calculateChart({ date: bd.date, time: bd.time, lat: bd.lat, lng: bd.lng, place: bd.place });
      natalContext = chartPersonName ? `Osoba: ${chartPersonName}\n\n${promptContext}` : promptContext;
    }
  } catch { /* use empty context */ }

  // Get last 10 messages for context
  const { data: history } = await supabaseAdmin
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(10);

  const historyMessages = (history ?? []).reverse();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: "Interpretacja AI chwilowo niedostępna. Spróbuj ponownie za chwilę.",
    });
  }

  const todayLabel = buildTodayLabel();
  const systemPrompt = natalContext
    ? `${CHAT_SYSTEM_PROMPT}\n\n# Kosmogram tej osoby\n\nDzisiaj jest ${todayLabel}.\n\n${natalContext}`
    : `${CHAT_SYSTEM_PROMPT}\n\nDzisiaj jest ${todayLabel}.\n\nOsoba nie ma jeszcze wygenerowanego kosmogramu - możesz zadawać pytania o datę urodzenia lub sugerować generowanie wykresu.`;

  const messages = [
    ...historyMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: content.trim() },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    console.error("Anthropic chat error:", await response.text());
    return NextResponse.json({ error: "Błąd AI" }, { status: 502 });
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const reply = data.content?.find(b => b.type === "text")?.text ?? "";

  // Save both messages
  await supabaseAdmin.from("messages").insert([
    { conversation_id: conversationId, role: "user", content: content.trim() },
    { conversation_id: conversationId, role: "assistant", content: reply },
  ]);

  // Update conversation timestamp
  const isFirstExchange = historyMessages.length === 0;
  const titleUpdate = isFirstExchange
    ? { updated_at: new Date().toISOString(), title: content.trim().slice(0, 50) }
    : { updated_at: new Date().toISOString() };

  await supabaseAdmin
    .from("conversations")
    .update(titleUpdate)
    .eq("id", conversationId);

  return NextResponse.json({ reply, conversationId });
}
