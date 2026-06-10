import { NextRequest } from "next/server";
import { CHILD_SYSTEM_PROMPT, getAgeGroup, calcAgeYears } from "@/lib/prompts/child-v1";
import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "edge";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const { name, birthDate, promptContext, placements, aspects, nodes } = await req.json() as {
    name: string;
    birthDate: string;
    promptContext: string;
    placements?: ChartPlacement[];
    aspects?: NatalAspect[];
    nodes?: ChartNodes;
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Brak klucza API" }), { status: 500 });
  }

  const ageYears = calcAgeYears(birthDate);
  const ageGroup = getAgeGroup(ageYears);
  const childName = name || "Dziecko";

  let userMessage: string;
  if (placements && placements.length > 0) {
    const timeUnknown = placements.every((p) => p.house === null);
    const timeNote = timeUnknown
      ? "\n\nUWAGA: Godzina urodzenia nieznana — brak Ascendentu i domów. W sekcji 1 pomiń Ascendent. We wszystkich sekcjach pomiń numery domów."
      : "";
    userMessage = `Imię dziecka: ${childName}
Wiek: ${ageYears} lat (${ageGroup})

placements:
${JSON.stringify(placements, null, 2)}

major_aspects:
${JSON.stringify(aspects ?? [], null, 2)}

nodes:
${JSON.stringify(nodes ?? {}, null, 2)}
${timeNote}

Napisz pełną interpretację karty urodzeniowej dziecka dla rodzica. Zacznij BEZPOŚREDNIO od "## 🌱 1. Kim jest ${childName}" — zero wprowadzenia, zero powtarzania instrukcji.`;
  } else {
    userMessage = `Imię dziecka: ${childName}
Wiek: ${ageYears} lat (${ageGroup})

Dane kosmogramu:
${promptContext}

Napisz pełną interpretację karty urodzeniowej dziecka dla rodzica. Zacznij BEZPOŚREDNIO od "## 🌱 1. Kim jest ${childName}" — zero wprowadzenia.`;
  }

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
        max_tokens: 4500,
        stream: true,
        system: CHILD_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
  } catch (err) {
    console.error("ai-child fetch error:", err);
    return new Response(JSON.stringify({ error: "Błąd generowania interpretacji" }), { status: 500 });
  }

  if (!anthropicResponse.ok || !anthropicResponse.body) {
    console.error("ai-child Anthropic non-ok:", anthropicResponse.status);
    return new Response(JSON.stringify({ error: "Błąd generowania interpretacji" }), { status: 500 });
  }

  const encoder = new TextEncoder();
  const body = anthropicResponse.body;

  const readable = new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
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
            } catch { /* incomplete chunk */ }
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
    },
  });
}
