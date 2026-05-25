import { supabaseAdmin } from "@/lib/supabase-server";

export type PromptVersion = {
  id: string;
  prompt_name: string;
  version: string;
  system_prompt: string;
  user_prompt_template: string;
  config: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    few_shot_count?: number;
  };
};

export async function resolvePromptVersion(
  promptName: string,
  userId: string
): Promise<PromptVersion | null> {
  const { data: versions, error } = await supabaseAdmin
    .from("prompt_versions")
    .select("id, prompt_name, version, system_prompt, user_prompt_template, config, rollout_pct")
    .eq("prompt_name", promptName)
    .eq("status", "active")
    .gt("rollout_pct", 0)
    .order("version", { ascending: true });

  if (error || !versions || versions.length === 0) return null;

  // Deterministic A/B: SHA-256 hash of "userId:promptName" → bucket 0-99
  const hashInput = new TextEncoder().encode(`${userId}:${promptName}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", hashInput);
  const hashArray = new Uint8Array(hashBuffer);
  const bucket =
    (((hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3]) >>> 0) %
    100;

  let cumulative = 0;
  for (const v of versions) {
    cumulative += v.rollout_pct as number;
    if (bucket < cumulative) return v as PromptVersion;
  }

  return versions[versions.length - 1] as PromptVersion;
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}
