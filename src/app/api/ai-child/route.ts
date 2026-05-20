import { NextRequest, NextResponse } from "next/server";
import { CHILD_SYSTEM_PROMPT, getAgeGroup, calcAgeYears } from "@/lib/prompts/child-v1";

export async function POST(req: NextRequest) {
  const { name, birthDate, promptContext } = await req.json() as {
    name: string;
    birthDate: string;
    promptContext: string;
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Brak klucza API" }, { status: 500 });
  }

  const ageYears = calcAgeYears(birthDate);
  const ageGroup = getAgeGroup(ageYears);

  const userMessage = `Imię dziecka: ${name || "nieznane"}
Wiek: ${ageYears} lat (${ageGroup})

Dane kosmogramu:
${promptContext}

Proszę o pełną interpretację karty urodzeniowej dziecka dla rodzica.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4500,
        system: CHILD_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json({ error: "Błąd generowania interpretacji" }, { status: 500 });
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const text = data.content?.find((b) => b.type === "text")?.text ?? "";
    return NextResponse.json({ interpretation: text });
  } catch (err) {
    console.error("ai-child error:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
