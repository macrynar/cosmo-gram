// Warstwa store: ładowanie szablonów i wykresu usera + generacja z CACHE.
// Zasada kosztu: generacja RAZ na (user, list), nigdy auto-regen.

import { supabaseAdmin } from "@/lib/supabase-server";
import { generateLetterContent } from "@/lib/letters/generate";
import { splitSignature } from "@/lib/letters/validate";
import { getPostHogClient } from "@/lib/posthog-server";
import type { NatalChart } from "@/lib/astro-types";
import type { LetterTemplate, UserLetter } from "@/types/letters";

// Zajawka do skrzynki: pierwsze zdania ciała listu bez znaczników Markdown.
export function buildPreview(contentMd: string, max = 160): string {
  const { body } = splitSignature(contentMd);
  const plain = body
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  return plain.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export async function getLetterTemplate(slug: string): Promise<LetterTemplate | null> {
  const { data } = await supabaseAdmin
    .from("astrea_letter_templates")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as LetterTemplate | null) ?? null;
}

export async function getActiveLetterTemplates(kind: "letter" | "report" = "letter"): Promise<LetterTemplate[]> {
  const { data } = await supabaseAdmin
    .from("astrea_letter_templates")
    .select("*")
    .eq("is_active", true)
    .eq("kind", kind)
    .order("sort_order", { ascending: true });
  return (data as LetterTemplate[] | null) ?? [];
}

// Wykres „główny" usera: jawny primary_reading_id, inaczej najstarszy (jak cron horoskopu).
export async function getPrimaryChartForUser(userId: string): Promise<NatalChart | null> {
  const [{ data: readings }, { data: pref }] = await Promise.all([
    supabaseAdmin.from("readings").select("id, chart_data, created_at").eq("user_id", userId).order("created_at", { ascending: true }),
    supabaseAdmin.from("user_preferences").select("primary_reading_id").eq("user_id", userId).maybeSingle(),
  ]);
  if (!readings?.length) return null;
  const primaryId = (pref?.primary_reading_id as string | null) ?? null;
  const byId = new Map(readings.map((r) => [r.id, r.chart_data as NatalChart | null]));
  const chart = (primaryId ? byId.get(primaryId) : null) ?? (readings[0].chart_data as NatalChart | null);
  return chart ?? null;
}

export interface GenerateResult {
  generated: boolean;
  reason?: "cached" | "no_user_letter" | "no_template" | "no_chart" | "error";
  validationOk?: boolean;
}

// Generuje treść dla istniejącego wiersza user_letters i zapisuje (status → generated).
// Idempotentne: jeśli content_md już jest — nie rusza (cache, koszt, spójność emocjonalna).
export async function generateAndStore(userLetterId: string): Promise<GenerateResult> {
  const { data: ul } = await supabaseAdmin
    .from("user_letters")
    .select("*")
    .eq("id", userLetterId)
    .maybeSingle();
  const row = ul as UserLetter | null;
  if (!row) return { generated: false, reason: "no_user_letter" };
  if (row.content_md) return { generated: false, reason: "cached" };

  const template = await getLetterTemplate(row.letter_slug);
  if (!template) return { generated: false, reason: "no_template" };

  const chart = await getPrimaryChartForUser(row.user_id);
  if (!chart) return { generated: false, reason: "no_chart" };

  const gen = await generateLetterContent({ template, chart, userId: row.user_id });

  await supabaseAdmin
    .from("user_letters")
    .update({
      content_md: gen.content_md,
      status: "generated",
      generated_at: new Date().toISOString(),
      model: gen.model,
      ai_prompt_version: gen.ai_prompt_version,
      prompt_version_id: gen.prompt_version_id,
      placement_snapshot: { ...gen.placement_snapshot, signature_label: gen.signature_label },
    })
    .eq("id", userLetterId)
    .is("content_md", null); // twardy guard: nigdy nie nadpisuj istniejącej treści

  return { generated: true, validationOk: gen.validation.ok };
}

export interface DeliverResult {
  delivered: boolean;
  reason?: "already" | "no_user_letter" | "no_content" | "no_template";
  inboxId?: string;
}

// Dostarczenie do skrzynki: status → delivered, delivered_at, pozycja inbox_items.
// Idempotentne: jeśli już dostarczony, nie powtarza. Email = osobny kanał (Faza 4).
export async function deliverUserLetter(userLetterId: string): Promise<DeliverResult> {
  const { data: ul } = await supabaseAdmin
    .from("user_letters")
    .select("*")
    .eq("id", userLetterId)
    .maybeSingle();
  const row = ul as UserLetter | null;
  if (!row) return { delivered: false, reason: "no_user_letter" };
  if (row.status === "delivered" || row.status === "read") return { delivered: false, reason: "already" };
  if (!row.content_md) return { delivered: false, reason: "no_content" };

  const template = await getLetterTemplate(row.letter_slug);
  if (!template) return { delivered: false, reason: "no_template" };

  const now = new Date().toISOString();
  const { data: inbox } = await supabaseAdmin
    .from("inbox_items")
    .insert({
      user_id: row.user_id,
      type: template.kind === "report" ? "report" : "letter",
      ref_id: row.id,
      title: template.title,
      preview: buildPreview(row.content_md),
      delivered_at: now,
    })
    .select("id")
    .single();

  await supabaseAdmin
    .from("user_letters")
    .update({ status: "delivered", delivered_at: now })
    .eq("id", userLetterId)
    .in("status", ["scheduled", "generated"]); // nie cofaj read/delivered

  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    try {
      getPostHogClient().capture({
        distinctId: row.user_id,
        event: "letter_delivered",
        properties: { letter_slug: row.letter_slug, kind: template.kind, source: row.source },
      });
    } catch { /* telemetria best-effort */ }
  }

  return { delivered: true, inboxId: inbox?.id as string | undefined };
}

// Tworzy wiersz user_letters dla (user, slug), jeśli nie istnieje. Zwraca id.
// Idempotencję dla dripu pilnuje też unikalny indeks (user_id, letter_slug) WHERE source='drip'.
export async function ensureUserLetterRow(params: {
  userId: string;
  slug: string;
  source: "drip" | "one_time_purchase";
  deliverAt?: string | null;
}): Promise<string | null> {
  const { userId, slug, source, deliverAt } = params;
  const { data: existing } = await supabaseAdmin
    .from("user_letters")
    .select("id")
    .eq("user_id", userId)
    .eq("letter_slug", slug)
    .eq("source", source)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: created } = await supabaseAdmin
    .from("user_letters")
    .insert({ user_id: userId, letter_slug: slug, source, status: "scheduled", deliver_at: deliverAt ?? null })
    .select("id")
    .single();
  return (created?.id as string | undefined) ?? null;
}
