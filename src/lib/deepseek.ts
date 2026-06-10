import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AstroModuleAIOutputSchema, type AstroModuleAIOutput } from "./schemas/astroModule";

const MAX_RETRIES = 2;
const BACKOFF_MS  = [1000, 3000] as const;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey });
}

// ─── generateModuleWithRetry (Claude Sonnet 4.6 — natal modules) ─────────────

export async function generateModuleWithRetry(
  systemPrompt:     string,
  userPrompt:       string,
  expectedModuleId: string,
  attempt           = 0
): Promise<AstroModuleAIOutput> {
  try {
    const response = await getClient().messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 4096,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const raw       = (response.content[0] as Anthropic.TextBlock).text?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonText  = jsonMatch ? jsonMatch[0] : raw;
    const obj       = JSON.parse(jsonText);

    return AstroModuleAIOutputSchema.parse({ ...obj, id: expectedModuleId });

  } catch (err) {
    const errDetail = err instanceof Error ? err.message : JSON.stringify(err);
    if (attempt < MAX_RETRIES) {
      console.warn(`[karta] module ${expectedModuleId} attempt ${attempt + 1} failed:`, errDetail);

      let retryPrompt = userPrompt;
      if (err instanceof z.ZodError) {
        const issues = err.issues.map(e => `- ${String(e.path.join("."))}: ${e.message}`).join("\n");
        retryPrompt += `\n\nPOPRZEDNIA PRÓBA MIAŁA BŁĘDY VALIDATION:\n${issues}\n\nPopraw i wygeneruj ponownie.`;
      }

      await new Promise(r => setTimeout(r, BACKOFF_MS[attempt]));
      return generateModuleWithRetry(systemPrompt, retryPrompt, expectedModuleId, attempt + 1);
    }

    const finalMsg = `Module ${expectedModuleId} failed after ${MAX_RETRIES} retries: ${errDetail}`;
    console.error(`[karta] ${finalMsg}`);
    throw new Error(finalMsg);
  }
}

// ─── deepSeekChat (Claude Haiku 4.5 — all other AI calls) ────────────────────
// apiKey param kept for backward compat — ignored; reads ANTHROPIC_API_KEY from env

type DeepSeekChatParams = {
  apiKey?: string;
  system?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  responseFormat?: "json_object";
};

export async function deepSeekChat({
  system,
  messages,
  maxTokens,
  temperature,
}: DeepSeekChatParams): Promise<string> {
  const response = await getClient().messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: maxTokens ?? 1024,
    ...(typeof temperature === "number" ? {} : {}),
    ...(system ? { system } : {}),
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  return (response.content[0] as Anthropic.TextBlock).text?.trim() ?? "";
}
