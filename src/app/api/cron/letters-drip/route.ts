import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getActiveLetterTemplates, generateAndStore, deliverUserLetter, ensureUserLetterRow } from "@/lib/letters/store";
import { planDripAction, type DripTemplateLite, type DripExistingLite } from "@/lib/letters/schedule";
import { sendLetterEmail } from "@/lib/letters/email";
import { AiDisabledError } from "@/lib/deepseek";

// Vercel Cron — dzienny drip listów. Pre-generacja 24-48 h przed dostarczeniem,
// dostarczenie + dyscyplina częstotliwości (≥7 dni między listami) liczy planDripAction.
export const runtime = "nodejs";
const BATCH_SIZE = 100;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.AI_DISABLED === "true") {
    return NextResponse.json({ skipped: true, reason: "AI_DISABLED" });
  }

  const now = new Date();

  // Płatnicy
  const { data: subs } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .in("status", ["active", "trialing"])
    .limit(BATCH_SIZE);
  const userIds = [...new Set((subs ?? []).map((s) => s.user_id as string))];

  if (userIds.length === 0) {
    await supabaseAdmin.from("cron_runs").insert({ name: "letters-drip", status: "ok", metadata: { delivered: 0, pregenerated: 0 } });
    return NextResponse.json({ delivered: 0, pregenerated: 0 });
  }

  // Szablony czasowe (drip)
  const templates: DripTemplateLite[] = (await getActiveLetterTemplates("letter"))
    .filter((t) => t.trigger_type === "time")
    .map((t) => ({ slug: t.slug, days_from_natal: t.trigger_value?.days_from_natal ?? 9999, sort_order: t.sort_order }));

  // Kotwica = najstarszy kosmogram usera; istniejące listy dripu
  const [{ data: readings }, { data: letters }] = await Promise.all([
    supabaseAdmin.from("readings").select("user_id, created_at").in("user_id", userIds).order("created_at", { ascending: true }),
    supabaseAdmin.from("user_letters").select("id, user_id, letter_slug, status, delivered_at").in("user_id", userIds).eq("source", "drip"),
  ]);

  const anchorByUser = new Map<string, Date>();
  for (const r of readings ?? []) {
    if (!anchorByUser.has(r.user_id)) anchorByUser.set(r.user_id, new Date(r.created_at as string));
  }
  const lettersByUser = new Map<string, Array<{ id: string; slug: string; status: DripExistingLite["status"]; delivered_at: string | null }>>();
  for (const l of letters ?? []) {
    const arr = lettersByUser.get(l.user_id) ?? [];
    arr.push({ id: l.id as string, slug: l.letter_slug as string, status: l.status as DripExistingLite["status"], delivered_at: l.delivered_at as string | null });
    lettersByUser.set(l.user_id, arr);
  }

  let delivered = 0, pregenerated = 0, failed = 0;

  for (const userId of userIds) {
    const anchor = anchorByUser.get(userId);
    if (!anchor) continue; // brak kosmogramu

    const existing = lettersByUser.get(userId) ?? [];
    const lastDeliveredAt = existing
      .map((e) => e.delivered_at)
      .filter(Boolean)
      .map((d) => new Date(d as string))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    const plan = planDripAction({
      templates,
      existing: existing.map((e) => ({ slug: e.slug, status: e.status })),
      anchor,
      now,
      lastDeliveredAt,
    });
    if (!plan) continue;

    try {
      // 1. Wiersz (scheduled) — jeśli brak
      let rowId = existing.find((e) => e.slug === plan.slug)?.id ?? null;
      if (plan.create || !rowId) {
        rowId = await ensureUserLetterRow({ userId, slug: plan.slug, source: "drip", deliverAt: plan.deliverAt });
      }
      if (!rowId) { failed++; continue; }

      // 2. Pre-generacja (scheduled → generated), idempotentnie (cache)
      const gen = await generateAndStore(rowId);
      if (gen.generated) pregenerated++;

      // 3. Dostarczenie, gdy dzień nadszedł i odstęp pozwala
      if (plan.deliver) {
        const res = await deliverUserLetter(rowId);
        if (res.delivered) {
          delivered++;
          await sendLetterEmail({ userId, userLetterId: rowId }).catch((e) =>
            console.error(`[cron/letters-drip] email failed userId=${userId}:`, e)
          );
        }
      }
    } catch (err) {
      if (err instanceof AiDisabledError) break;
      console.error(`[cron/letters-drip] userId=${userId} slug=${plan.slug} failed:`, err);
      failed++;
    }
  }

  await supabaseAdmin.from("cron_runs").insert({
    name: "letters-drip",
    status: failed === 0 ? "ok" : delivered + pregenerated > 0 ? "partial" : "error",
    metadata: { delivered, pregenerated, failed },
  });

  return NextResponse.json({ delivered, pregenerated, failed });
}
