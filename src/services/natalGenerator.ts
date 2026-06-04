import { supabaseAdmin } from "@/lib/supabase-server";
import { generateModuleWithRetry } from "@/lib/deepseek";
import { buildSystemPrompt, buildUserPrompt, type GenerationContext } from "@/lib/moduleSpecs";
import { computeConfidenceScore } from "@/lib/confidence";
import { AstroModuleSchema, ALL_MODULE_IDS, type AstroModule, type ModuleId } from "@/lib/schemas/astroModule";

const PROMPT_VERSION = process.env.NATAL_PROMPT_VERSION ?? "v1";

const PREMIUM_IDS = new Set<ModuleId>(["love", "career", "shadows", "roots", "purpose"]);

// ─── Cache key ────────────────────────────────────────────────────────────────

async function computeCacheKey(
  userId: string,
  chartId: string,
  moduleId: string,
  grammaticalForm: string
): Promise<string> {
  const raw = `${userId}:${chartId}:${moduleId}:${PROMPT_VERSION}:${grammaticalForm}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Supabase cache helpers ──────────────────────────────────────────────────

async function loadCachedModules(
  userId: string,
  chartId: string,
): Promise<Map<ModuleId, AstroModule>> {
  const { data } = await supabaseAdmin
    .from("natal_modules_cache")
    .select("module_id, module_data, prompt_version")
    .eq("user_id", userId)
    .eq("chart_id", chartId)
    .eq("prompt_version", PROMPT_VERSION);

  const map = new Map<ModuleId, AstroModule>();
  for (const row of data ?? []) {
    try {
      const parsed = AstroModuleSchema.parse(row.module_data);
      map.set(parsed.id, parsed);
    } catch {
      // stale / malformed cache — skip, will regenerate
    }
  }
  return map;
}

async function saveModuleCache(userId: string, chartId: string, module: AstroModule): Promise<void> {
  await supabaseAdmin.from("natal_modules_cache").upsert(
    {
      cache_key:      module.cacheKey,
      user_id:        userId,
      chart_id:       chartId,
      module_id:      module.id,
      module_data:    module,
      prompt_version: PROMPT_VERSION,
    },
    { onConflict: "cache_key" }
  );
}

// ─── Main generator ───────────────────────────────────────────────────────────

export async function generateNatalKarta(ctx: GenerationContext): Promise<AstroModule[]> {
  const { user_id, chart_id, grammatical_form } = ctx;

  // 1. Load cached modules
  const cached = await loadCachedModules(user_id, chart_id);

  // 2. Which need generation?
  const toGenerate = ALL_MODULE_IDS.filter(id => !cached.has(id));
  if (toGenerate.length === 0) {
    return ALL_MODULE_IDS.map(id => cached.get(id)!);
  }

  const systemPrompt = buildSystemPrompt(grammatical_form);

  // 3. All needed modules in parallel — avoids sequential-batch timeout on Vercel
  const generated = await Promise.all(
    toGenerate.map(async (moduleId) => {
      const confidence = computeConfidenceScore(moduleId, ctx);
      const userPrompt = buildUserPrompt(ctx, moduleId, confidence);
      const aiOutput   = await generateModuleWithRetry(systemPrompt, userPrompt, moduleId);
      const cacheKey   = await computeCacheKey(user_id, chart_id, moduleId, grammatical_form);

      return AstroModuleSchema.parse({
        ...aiOutput,
        confidenceScore: confidence,
        isPremium:       PREMIUM_IDS.has(moduleId),
        cacheKey,
        promptVersion:   PROMPT_VERSION,
      });
    })
  );

  // Write cache async (don't block response)
  Promise.all(generated.map(m => saveModuleCache(user_id, chart_id, m)))
    .catch(err => console.error("[karta] cache write error:", err));

  // 4. Merge cached + generated in canonical order
  const allById = new Map([...cached, ...generated.map(m => [m.id, m] as [ModuleId, AstroModule])]);
  return ALL_MODULE_IDS.map(id => allById.get(id)!).filter(Boolean);
}
