import { supabaseAdmin } from "@/lib/supabase-server";
import { generateModuleWithRetry, correctModuleWithHaiku } from "@/lib/deepseek";
import { buildSystemPrompt, buildUserPrompt, type GenerationContext } from "@/lib/moduleSpecs";
import { computeConfidenceScore } from "@/lib/confidence";
import { AstroModuleSchema, ALL_MODULE_IDS, type AstroModule, type ModuleId } from "@/lib/schemas/astroModule";
import { computeModuleMetrics } from "@/lib/astro/metrics";
import { getModuleTags } from "@/lib/personality-tags";

const PROMPT_VERSION = process.env.NATAL_PROMPT_VERSION ?? "v2";

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

// ─── Load-only (no generation) ───────────────────────────────────────────────

export async function getExistingKarta(userId: string, chartId: string): Promise<AstroModule[] | null> {
  const cached = await loadCachedModules(userId, chartId);
  if (cached.size === 0) return null;
  return ALL_MODULE_IDS.map(id => cached.get(id)!).filter(Boolean);
}

// Read modules by chart_id only — for public share pages (no user auth)
export async function getKartaByChartId(chartId: string): Promise<AstroModule[]> {
  const { data } = await supabaseAdmin
    .from("natal_modules_cache")
    .select("module_id, module_data")
    .eq("chart_id", chartId)
    .eq("prompt_version", PROMPT_VERSION);

  const map = new Map<ModuleId, AstroModule>();
  for (const row of data ?? []) {
    try {
      const parsed = AstroModuleSchema.parse(row.module_data);
      map.set(parsed.id, parsed);
    } catch { /* skip malformed */ }
  }
  return ALL_MODULE_IDS.map(id => map.get(id)!).filter(Boolean);
}

// ─── Main generator ───────────────────────────────────────────────────────────

export type KartaResult = {
  modules:   AstroModule[];
  failedIds: ModuleId[];
};

export async function generateNatalKarta(
  ctx: GenerationContext,
  onlyModuleIds?: ModuleId[]
): Promise<KartaResult> {
  const { user_id, chart_id, grammatical_form } = ctx;
  const targetIds = onlyModuleIds ?? ALL_MODULE_IDS;

  // 1. Load cached modules
  const cached = await loadCachedModules(user_id, chart_id);

  // 2. Which need generation?
  const toGenerate = targetIds.filter(id => !cached.has(id));
  if (toGenerate.length === 0) {
    return { modules: targetIds.map(id => cached.get(id)!).filter(Boolean), failedIds: [] };
  }

  const systemPrompt = buildSystemPrompt(grammatical_form);

  // 3. All modules in parallel with allSettled — partial failure allowed
  const results = await Promise.allSettled(
    toGenerate.map(async (moduleId) => {
      console.log(`[karta] generating module: ${moduleId}`);
      const confidence = computeConfidenceScore(moduleId, ctx);
      const preMetrics = computeModuleMetrics(ctx.natal_data, moduleId);
      const preTags    = getModuleTags(ctx.natal_data, moduleId);
      const userPrompt = buildUserPrompt(ctx, moduleId, confidence, { metrics: preMetrics, tags: preTags });
      const rawOutput  = await generateModuleWithRetry(systemPrompt, userPrompt, moduleId);
      const aiOutput   = await correctModuleWithHaiku(rawOutput);
      console.log(`[karta] module ${moduleId} AI output received, validating schema`);
      const cacheKey   = await computeCacheKey(user_id, chart_id, moduleId, grammatical_form);

      const mergedMeters = aiOutput.visualMeters.map((meter, i) => ({
        ...meter,
        label:    preMetrics[i]?.label    ?? meter.label,
        value:    preMetrics[i]?.value    ?? meter.value,
        category: preMetrics[i]?.category ?? meter.category,
      }));

      const parsed = AstroModuleSchema.parse({
        ...aiOutput,
        tags:            preTags,
        visualMeters:    mergedMeters,
        confidenceScore: confidence,
        isPremium:       PREMIUM_IDS.has(moduleId),
        cacheKey,
        promptVersion:   PROMPT_VERSION,
      });
      console.log(`[karta] module ${moduleId} schema valid`);
      return { moduleId, parsed };
    })
  );

  const generated: AstroModule[] = [];
  const failedIds: ModuleId[]    = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      generated.push(result.value.parsed);
    } else {
      console.error(`[karta] module ${toGenerate[i]} failed:`, result.reason);
      failedIds.push(toGenerate[i]);
    }
  });

  // Write cache for successful modules
  await Promise.all(generated.map(m => saveModuleCache(user_id, chart_id, m)))
    .catch(err => console.error("[karta] cache write error:", err));

  // 4. Merge cached + generated in canonical order
  const allById = new Map([...cached, ...generated.map(m => [m.id, m] as [ModuleId, AstroModule])]);
  const modules = targetIds.filter(id => !failedIds.includes(id)).map(id => allById.get(id)!).filter(Boolean);

  return { modules, failedIds };
}
