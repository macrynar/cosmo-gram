import { NextRequest, NextResponse } from "next/server";
import { CHILD_SYSTEM_PROMPT, getAgeGroup, calcAgeYears } from "@/lib/prompts/child-v1";
import { validateReading, checkLength, buildRetryInstruction } from "@/lib/reading-validator";
import { deepSeekChat } from "@/lib/deepseek";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { name, birthDate, promptContext } = await req.json() as {
    name: string;
    birthDate: string;
    promptContext: string;
  };

  const apiKey = process.env.DEEPSEEK_API_KEY;
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
      try {
        finalText = await deepSeekChat({
          apiKey,
          system: CHILD_SYSTEM_PROMPT,
          messages: [{ role: "user", content: currentUserMessage }],
          maxTokens: 4500,
        });
      } catch (error) {
        console.error("DeepSeek API error:", error);
        return NextResponse.json({ error: "Błąd generowania interpretacji" }, { status: 500 });
      }

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
