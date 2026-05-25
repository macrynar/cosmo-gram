/**
 * One-shot script: inserts current hardcoded prompts into prompt_versions as v1.0 active 100%.
 * Run: npx ts-node --project tsconfig.scripts.json scripts/migrate-current-prompts.ts
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extracts the first backtick-template-literal assigned to a const named SYSTEM_PROMPT or similar
function extractConst(source: string, name: string): string {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*\`([\\s\\S]*?)\`\\s*;`, "m");
  const m = source.match(re);
  return m ? m[1].trim() : "";
}

const ROUTES: Array<{ name: string; file: string; constName?: string }> = [
  { name: "ai-natal",          file: "src/app/api/interpret/route.ts",      constName: "systemPrompt" },
  { name: "ai-daily",          file: "src/app/api/daily-reading/route.ts",  constName: "SYSTEM_PROMPT" },
  { name: "ai-synastry",       file: "src/app/api/astro-match/route.ts",    constName: "SYSTEM_PROMPT" },
  { name: "ai-child",          file: "src/app/api/ai-child/route.ts",       constName: "CHILD_SYSTEM_PROMPT" },
  { name: "ai-cosmo-map-city", file: "src/app/api/cosmo-map-city/route.ts", constName: "systemPrompt" },
];

async function main() {
  console.log("Migrating prompts to DB...\n");

  for (const route of ROUTES) {
    const filePath = path.join(process.cwd(), route.file);

    let systemPrompt = "";
    if (fs.existsSync(filePath)) {
      const src = fs.readFileSync(filePath, "utf-8");
      systemPrompt = extractConst(src, route.constName ?? "SYSTEM_PROMPT");
    }

    if (!systemPrompt) {
      console.warn(`⚠  ${route.name}: could not extract system prompt from ${route.file} — inserting placeholder`);
      systemPrompt = `[Prompt migrated from ${route.file} — edit in admin UI]`;
    }

    const { error } = await supabase.from("prompt_versions").upsert(
      {
        prompt_name: route.name,
        version: "v1.0",
        system_prompt: systemPrompt,
        user_prompt_template: "",
        config: { model: "deepseek-chat", temperature: 0.7, max_tokens: 4000, few_shot_count: 0 },
        status: "active",
        rollout_pct: 100,
        notes: "Migrated from hardcoded source",
      },
      { onConflict: "prompt_name,version" }
    );

    if (error) {
      console.error(`✗  ${route.name}: ${error.message}`);
    } else {
      console.log(`✓  ${route.name} v1.0 → active 100%`);
    }
  }

  console.log("\nDone. Run /app/admin/prompts to verify.");
}

main().catch(console.error);
