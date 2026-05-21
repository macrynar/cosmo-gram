import { NextRequest, NextResponse } from "next/server";
import { CHILD_SYSTEM_PROMPT, getAgeGroup, calcAgeYears } from "@/lib/prompts/child-v1";
import { validateReading, checkLength, buildRetryInstruction } from "@/lib/reading-validator";

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

  let currentUserMessage = userMessage;
  let finalText = "";
  let qualityWarning = false;

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
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
          messages: [{ role: "user", content: currentUserMessage }],
        }),
      });

      if (!response.ok) {
        console.error("Anthropic API error:", await response.text());
        return NextResponse.json({ error: "Błąd generowania interpretacji" }, { status: 500 });
      }

      const data = await response.json() as { content: Array<{ type: string; text: string }> };
      finalText = data.content?.find((b) => b.type === "text")?.text ?? "";

      const { issues } = validateReading(finalText);
      const { ok: lengthOk } = checkLength(finalText, "child");

      if (issues.length === 0 && lengthOk) break;

      if (attempt < 2) {
        const retryMsg = buildRetryInstruction([
          ...issues,
          ...(!lengthOk ? ["LENGTH_EXCEEDED"] : []),
        ]);
        currentUserMessage = `${userMessage}\n\n${retryMsg}`;
        console.warn(`ai-child attempt ${attempt + 1} failed validation:`, issues);
      } else {
        qualityWarning = true;
        console.error("ai-child: 3 attempts failed validation, returning last version");
      }
    }

    return NextResponse.json({ interpretation: finalText, ...(qualityWarning ? { quality_warning: true } : {}) });
  } catch (err) {
    console.error("ai-child error:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
