import { z } from "zod";
import { AstroModuleAIOutputSchema, type AstroModuleAIOutput } from "./schemas/astroModule";

// ─── generateModuleWithRetry ─────────────────────────────────────────────────

const MAX_RETRIES = 2;
const BACKOFF_MS  = [1000, 3000] as const;

export async function generateModuleWithRetry(
  systemPrompt:     string,
  userPrompt:       string,
  expectedModuleId: string,
  attempt           = 0
): Promise<AstroModuleAIOutput> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not set");

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model:           process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
        temperature:     0.7,
        max_tokens:      4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt   },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`DeepSeek API error (${res.status}): ${await res.text()}`);
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw  = data.choices?.[0]?.message?.content?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonText  = jsonMatch ? jsonMatch[0] : raw;
    const obj  = JSON.parse(jsonText);

    return AstroModuleAIOutputSchema.parse({ ...obj, id: expectedModuleId });

  } catch (err) {
    if (attempt < MAX_RETRIES) {
      console.warn(`[karta] module ${expectedModuleId} attempt ${attempt + 1} failed:`, err);

      let retryPrompt = userPrompt;
      if (err instanceof z.ZodError) {
        const issues = err.issues.map(e => `- ${String(e.path.join("."))}: ${e.message}`).join("\n");
        retryPrompt += `\n\nPOPRZEDNIA PRÓBA MIAŁA BŁĘDY VALIDATION:\n${issues}\n\nPopraw i wygeneruj ponownie.`;
      }

      await new Promise(r => setTimeout(r, BACKOFF_MS[attempt]));
      return generateModuleWithRetry(systemPrompt, retryPrompt, expectedModuleId, attempt + 1);
    }

    throw new Error(`Module ${expectedModuleId} failed after ${MAX_RETRIES} retries: ${err}`);
  }
}

// ─── deepSeekChat (legacy) ───────────────────────────────────────────────────

type DeepSeekRole = "system" | "user" | "assistant";

type DeepSeekMessage = {
  role: DeepSeekRole;
  content: string;
};

type DeepSeekChatParams = {
  apiKey: string;
  system?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  responseFormat?: "json_object";
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function deepSeekChat({
  apiKey,
  system,
  messages,
  maxTokens,
  temperature,
  model,
  responseFormat,
}: DeepSeekChatParams): Promise<string> {
  const finalMessages: DeepSeekMessage[] = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model ?? process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      messages: finalMessages,
      ...(typeof maxTokens === "number" ? { max_tokens: maxTokens } : {}),
      ...(typeof temperature === "number" ? { temperature } : {}),
      ...(responseFormat ? { response_format: { type: responseFormat } } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as DeepSeekResponse;
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
