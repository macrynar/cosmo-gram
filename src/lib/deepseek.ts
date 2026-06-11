import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AstroModuleAIOutputSchema, type AstroModuleAIOutput } from "./schemas/astroModule";
import { supabaseAdmin } from "./supabase-server";
import path from "path";
import fs from "fs";

const MAX_RETRIES = 2;
const BACKOFF_MS  = [1000, 3000] as const;

function loadAiFixture(name: string): unknown {
  const fixturePath = path.join(process.cwd(), "tests", "fixtures", "ai", name);
  return JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey });
}

async function logAiCall(entry: {
  task: string;
  model: string;
  input_tokens?: number;
  output_tokens?: number;
  latency_ms?: number;
  status: "ok" | "error" | "retry";
  error_msg?: string;
}) {
  // Fire-and-forget — never let logging break the main call
  void supabaseAdmin.from("ai_call_logs").insert(entry);
}

// ─── generateModuleWithRetry (Claude Sonnet 4.6 — natal modules) ─────────────

export class AiDisabledError extends Error {
  constructor() { super("AI_DISABLED"); this.name = "AiDisabledError"; }
}

export async function generateModuleWithRetry(
  systemPrompt:     string,
  userPrompt:       string,
  expectedModuleId: string,
  attempt           = 0
): Promise<AstroModuleAIOutput> {
  if (process.env.AI_DISABLED === "true") throw new AiDisabledError();
  if (process.env.AI_MOCK === "true") {
    const fixture = loadAiFixture(`modules/${expectedModuleId}.json`);
    return AstroModuleAIOutputSchema.parse({ ...(fixture as object), id: expectedModuleId });
  }

  const model = "claude-sonnet-4-6";
  const t0    = Date.now();

  try {
    const response = await getClient().messages.create({
      model,
      max_tokens: 4096,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const latency_ms    = Date.now() - t0;
    const input_tokens  = response.usage?.input_tokens;
    const output_tokens = response.usage?.output_tokens;

    const raw       = (response.content[0] as Anthropic.TextBlock).text?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonText  = jsonMatch ? jsonMatch[0] : raw;
    const obj       = JSON.parse(jsonText);

    const result = AstroModuleAIOutputSchema.parse({ ...obj, id: expectedModuleId });

    logAiCall({ task: `natal-module:${expectedModuleId}`, model, input_tokens, output_tokens, latency_ms, status: "ok" });
    return result;

  } catch (err) {
    const latency_ms = Date.now() - t0;
    const errDetail  = err instanceof Error ? err.message : JSON.stringify(err);

    if (attempt < MAX_RETRIES) {
      console.warn(`[karta] module ${expectedModuleId} attempt ${attempt + 1} failed:`, errDetail);
      logAiCall({ task: `natal-module:${expectedModuleId}`, model, latency_ms, status: "retry", error_msg: errDetail.slice(0, 500) });

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
    logAiCall({ task: `natal-module:${expectedModuleId}`, model, latency_ms, status: "error", error_msg: finalMsg.slice(0, 500) });
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
  task?: string;
  responseFormat?: "json_object";
};

export async function deepSeekChat({
  system,
  messages,
  maxTokens,
  temperature,
  task = "chat",
}: DeepSeekChatParams): Promise<string> {
  if (process.env.AI_DISABLED === "true") throw new AiDisabledError();
  if (process.env.AI_MOCK === "true") {
    return fs.readFileSync(
      path.join(process.cwd(), "tests", "fixtures", "ai", "chat-response.txt"),
      "utf-8"
    );
  }

  const model = "claude-haiku-4-5-20251001";
  const t0    = Date.now();

  try {
    const response = await getClient().messages.create({
      model,
      max_tokens: maxTokens ?? 1024,
      ...(typeof temperature === "number" ? {} : {}),
      ...(system ? { system } : {}),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const latency_ms    = Date.now() - t0;
    const input_tokens  = response.usage?.input_tokens;
    const output_tokens = response.usage?.output_tokens;

    logAiCall({ task, model, input_tokens, output_tokens, latency_ms, status: "ok" });

    return (response.content[0] as Anthropic.TextBlock).text?.trim() ?? "";

  } catch (err) {
    const latency_ms = Date.now() - t0;
    const errDetail  = err instanceof Error ? err.message : JSON.stringify(err);
    logAiCall({ task, model, latency_ms, status: "error", error_msg: errDetail.slice(0, 500) });
    throw err;
  }
}
