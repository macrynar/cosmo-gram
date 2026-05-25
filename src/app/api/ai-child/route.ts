import { NextRequest } from "next/server";
import { CHILD_SYSTEM_PROMPT, getAgeGroup, calcAgeYears } from "@/lib/prompts/child-v1";

export const runtime = "edge";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { name, birthDate, promptContext } = await req.json() as {
    name: string;
    birthDate: string;
    promptContext: string;
  };

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Brak klucza API" }), { status: 500 });
  }

  const ageYears = calcAgeYears(birthDate);
  const ageGroup = getAgeGroup(ageYears);

  const userMessage = `Imię dziecka: ${name || "nieznane"}
Wiek: ${ageYears} lat (${ageGroup})

Dane kosmogramu:
${promptContext}

Proszę o pełną interpretację karty urodzeniowej dziecka dla rodzica.`;

  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  let dsResponse: Response;
  try {
    dsResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: CHILD_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 4500,
        stream: true,
      }),
    });
  } catch (err) {
    console.error("ai-child fetch error:", err);
    return new Response(JSON.stringify({ error: "Błąd generowania interpretacji" }), { status: 500 });
  }

  if (!dsResponse.ok || !dsResponse.body) {
    console.error("ai-child DeepSeek non-ok:", dsResponse.status);
    return new Response(JSON.stringify({ error: "Błąd generowania interpretacji" }), { status: 500 });
  }

  const encoder = new TextEncoder();
  const dsBody = dsResponse.body;

  const readable = new ReadableStream({
    async start(controller) {
      const reader = dsBody.getReader();
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
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) controller.enqueue(encoder.encode(content));
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
