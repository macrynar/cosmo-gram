// Free teaser: List 1 „Twoja misja" generowany za darmo po wygenerowaniu
// kosmogramu — wabik konwersji free→premium. Idempotentny (raz na usera).

import { supabaseAdmin } from "@/lib/supabase-server";
import { getLetterTemplate, ensureUserLetterRow, generateAndStore, deliverUserLetter } from "@/lib/letters/store";

const MISSION_SLUG = "twoja-misja";

export async function ensureMissionTeaser(userId: string): Promise<{ created: boolean; reason?: string }> {
  const template = await getLetterTemplate(MISSION_SLUG);
  if (!template) return { created: false, reason: "no_template" };

  const { data: existing } = await supabaseAdmin
    .from("user_letters")
    .select("id")
    .eq("user_id", userId)
    .eq("letter_slug", MISSION_SLUG)
    .maybeSingle();
  if (existing) return { created: false, reason: "exists" };

  const rowId = await ensureUserLetterRow({ userId, slug: MISSION_SLUG, source: "drip", deliverAt: new Date().toISOString() });
  if (!rowId) return { created: false, reason: "no_row" };

  await generateAndStore(rowId);
  const res = await deliverUserLetter(rowId);
  return { created: res.delivered, reason: res.delivered ? undefined : res.reason };
}
