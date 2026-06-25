import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AstroModuleAIOutputSchema, type AstroModuleAIOutput } from "./schemas/astroModule";
import { STYLE_BLOCK } from "./moduleSpecs";
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

// ─── correctModuleWithHaiku (language/style correction pass) ─────────────────
// Runs claude-haiku-4-5 over the generated module to fix ONLY:
//   1. Polish language errors (declension, rusycyzmy: Wenera→Wenus)
//   2. Violations of the gender-neutral style (STYLE_BLOCK rules)
// Logs a diff metric (# of changed chars) to ai_call_logs.

const CORRECTION_SYSTEM = `Jesteś korektorem tekstu astrologicznego w aplikacji Cosmogram.

Twoje zadanie: popraw WYŁĄCZNIE następujące błędy w przekazanym JSON modułu.
NICZEGO NIE DODAWAJ. NIE zmieniaj treści, argumentów, sensu ani stylu poza wymienionymi błędami.

POPRAWIAJ:
1. Błędy deklinacyjne polszczyzny (np. "Wag" → "Wagi", "w Baran" → "w Baranie")
2. Rusycyzmy: "Wenera" → "Wenus" (Wenus jest nieodmienna), "Jowisz" odmieniony błędnie → sprawdź
3. Naruszenia reguł stylu bezrodzajowego (dotyczy WSZYSTKICH pól: content, quote, tactics, visualMeters.archetype, tags):

${STYLE_BLOCK}

4. Tryb hipoteczny + imiesiłów rodzajowy w 2. osobie:
   ŹLE: "jakbyś stał", "jakbyś stała", "gdybyś chciał", "gdybyś chciała", "jakbyś był/była"
   DOBRZE: "kiedy stoisz", "gdy chcesz", "w tej sytuacji"
5. Brak przecinka przed "który/która/które" w zdaniach względnych (w archetypach metryk):
   ŹLE: "terapeuta który..." → DOBRZE: "terapeuta, który..."

ZWRÓĆ: TYLKO poprawiony obiekt JSON. Zero komentarza, zero \`\`\`json wrapperów.
Jeśli nie ma błędów — zwróć oryginalny JSON bez zmian.`;

export async function correctModuleWithHaiku(
  module: AstroModuleAIOutput
): Promise<AstroModuleAIOutput> {
  if (process.env.AI_DISABLED === "true" || process.env.AI_MOCK === "true") {
    return module;
  }

  const model = "claude-haiku-4-5-20251001";
  const t0    = Date.now();
  const inputJson = JSON.stringify(module);

  try {
    const response = await getClient().messages.create({
      model,
      max_tokens: 4096,
      system:     CORRECTION_SYSTEM,
      messages:   [{ role: "user", content: `Popraw ten JSON modułu:\n\n${inputJson}` }],
    });

    const latency_ms    = Date.now() - t0;
    const input_tokens  = response.usage?.input_tokens;
    const output_tokens = response.usage?.output_tokens;

    const raw       = (response.content[0] as Anthropic.TextBlock).text?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonText  = jsonMatch ? jsonMatch[0] : raw;
    const obj       = JSON.parse(jsonText);
    const corrected = AstroModuleAIOutputSchema.parse({ ...obj, id: module.id });

    // Log diff size as quality metric
    const outputJson = JSON.stringify(corrected);
    const diffChars = [...outputJson].filter((c, i) => c !== inputJson[i]).length;

    logAiCall({
      task: `natal-correction:${module.id}`,
      model,
      input_tokens,
      output_tokens,
      latency_ms,
      status: "ok",
      error_msg: diffChars > 0 ? `diff_chars:${diffChars}` : undefined,
    });

    return corrected;
  } catch (err) {
    // Correction pass is best-effort — never fail the main flow
    const latency_ms = Date.now() - t0;
    const errDetail  = err instanceof Error ? err.message : JSON.stringify(err);
    console.warn(`[karta] correction pass failed for ${module.id}:`, errDetail);
    logAiCall({ task: `natal-correction:${module.id}`, model, latency_ms, status: "error", error_msg: errDetail.slice(0, 500) });
    return module;
  }
}

// ─── correctCalendarText (Haiku correction pass for plain text) ───────────────
// Lightweight version of correctModuleWithHaiku for calendar free-text strings.
// Best-effort — always returns the original text on error.

const CALENDAR_CORRECTION_SYSTEM = `Jesteś korektorem tekstu astrologicznego po polsku.
Popraw WYŁĄCZNIE poniższe błędy — nie zmieniaj sensu ani struktury:
1. Błędy deklinacyjne (np. "w Baran" → "w Baranie", "w Byk" → "w Byku")
2. Błędne formy gramatyczne (np. "robi się elektryczne" → "robi się elektrycznie", "robi się głośne" → "robi się głośno")
3. Rusycyzmy i kalki językowe
4. Formy rodzajowe w 2. osobie (np. "jesteś gotowy/gotowa" → "jesteś w gotowości")
Zwróć TYLKO poprawiony tekst, zero komentarzy.`;

export async function correctCalendarText(text: string, task: string): Promise<string> {
  if (process.env.AI_DISABLED === "true" || process.env.AI_MOCK === "true") return text;
  if (!text.trim()) return text;

  const model = "claude-haiku-4-5-20251001";
  const t0    = Date.now();
  try {
    const corrected = await aiComplete({
      model,
      system:    CALENDAR_CORRECTION_SYSTEM,
      messages:  [{ role: "user", content: text }],
      // Korekta jest ~tej samej długości co wejście. Polski jest gęstszy tokenowo
      // (~2.5–3 znaki/token), więc dawne /4 zaniżało budżet i URYWAŁO tekst w połowie
      // zdania. text.length/2 to bezpieczna górna granica tokenów + zapas.
      maxTokens: Math.min(Math.ceil(text.length / 2) + 256, 2048),
      task:      `cal-correction:${task}`,
    });
    if (!corrected || corrected.length > text.length * 2) return text; // sanity
    return corrected;
  } catch (err) {
    const latency_ms = Date.now() - t0;
    const errMsg = err instanceof Error ? err.message : String(err);
    logAiCall({ task: `cal-correction:${task}`, model, latency_ms, status: "error", error_msg: errMsg.slice(0, 200) });
    return text;
  }
}

// ─── aiComplete (Claude Haiku 4.5 — all other AI calls) ────────────────────
// apiKey param kept for backward compat — ignored; reads ANTHROPIC_API_KEY from env

export type SystemBlock = { type: "text"; text: string; cache_control?: { type: "ephemeral" } };

type AiCompleteParams = {
  apiKey?: string;
  system?: string | SystemBlock[];
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  task?: string;
  responseFormat?: "json_object";
  /** Pod AI_MOCK: ścieżka fixture względem tests/fixtures/ai/ (np. "letters/standard.md"). */
  mockFixture?: string;
};

export async function aiComplete({
  system,
  messages,
  maxTokens,
  temperature,
  model: modelOverride,
  task = "chat",
  mockFixture,
}: AiCompleteParams): Promise<string> {
  if (process.env.AI_DISABLED === "true") throw new AiDisabledError();
  if (process.env.AI_MOCK === "true") {
    return fs.readFileSync(
      path.join(process.cwd(), "tests", "fixtures", "ai", mockFixture ?? "chat-response.txt"),
      "utf-8"
    );
  }

  const model = modelOverride ?? "claude-haiku-4-5-20251001";
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
