// Rdzeń dripu listów — współdzielony przez cron (route) i ręczny trigger (skrypt).
// Eventy mają priorytet nad czasowymi; wspólna dyscyplina ≤1 list/tydzień.

import { supabaseAdmin } from "@/lib/supabase-server";
import { getActiveLetterTemplates, generateAndStore, deliverUserLetter, ensureUserLetterRow } from "@/lib/letters/store";
import { planDripAction, MIN_GAP_DAYS, type DripTemplateLite, type DripExistingLite } from "@/lib/letters/schedule";
import { detectEvents } from "@/lib/letters/events";
import { sendLetterEmail } from "@/lib/letters/email";
import { AiDisabledError } from "@/lib/deepseek";
import type { NatalChart } from "@/lib/astro-types";

const BATCH_SIZE = 100;
const DAY_MS = 86_400_000;

export interface DripResult {
  delivered: number;
  events: number;
  pregenerated: number;
  failed: number;
}

export async function runLettersDrip(now: Date = new Date()): Promise<DripResult> {
  const { data: subs } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .in("status", ["active", "trialing"])
    .limit(BATCH_SIZE);
  const userIds = [...new Set((subs ?? []).map((s) => s.user_id as string))];

  if (userIds.length === 0) {
    await supabaseAdmin.from("cron_runs").insert({ name: "letters-drip", status: "ok", metadata: { delivered: 0, events: 0, pregenerated: 0 } });
    return { delivered: 0, events: 0, pregenerated: 0, failed: 0 };
  }

  const timeTemplates: DripTemplateLite[] = (await getActiveLetterTemplates("letter"))
    .filter((t) => t.trigger_type === "time")
    .map((t) => ({ slug: t.slug, days_from_natal: t.trigger_value?.days_from_natal ?? 9999, sort_order: t.sort_order }));

  const [{ data: readings }, { data: letters }, { data: prefs }] = await Promise.all([
    supabaseAdmin.from("readings").select("id, user_id, created_at, chart_data").in("user_id", userIds).order("created_at", { ascending: true }),
    supabaseAdmin.from("user_letters").select("id, user_id, letter_slug, status, delivered_at, source, event_key").in("user_id", userIds),
    supabaseAdmin.from("user_preferences").select("user_id, primary_reading_id").in("user_id", userIds),
  ]);

  const primaryRid = new Map((prefs ?? []).map((p) => [p.user_id, p.primary_reading_id as string | null]));
  const anchorByUser = new Map<string, Date>();
  const oldestChart = new Map<string, NatalChart>();
  const byReadingId = new Map<string, NatalChart>();
  for (const r of readings ?? []) {
    if (!anchorByUser.has(r.user_id)) anchorByUser.set(r.user_id, new Date(r.created_at as string));
    if (r.chart_data) {
      byReadingId.set(r.id as string, r.chart_data as NatalChart);
      if (!oldestChart.has(r.user_id)) oldestChart.set(r.user_id, r.chart_data as NatalChart);
    }
  }
  const chartFor = (userId: string): NatalChart | undefined => {
    const rid = primaryRid.get(userId);
    return (rid ? byReadingId.get(rid) : undefined) ?? oldestChart.get(userId);
  };

  type LetterRow = { id: string; slug: string; status: DripExistingLite["status"]; delivered_at: string | null; source: string; event_key: string | null };
  const lettersByUser = new Map<string, LetterRow[]>();
  for (const l of letters ?? []) {
    const arr = lettersByUser.get(l.user_id) ?? [];
    arr.push({ id: l.id as string, slug: l.letter_slug as string, status: l.status as DripExistingLite["status"], delivered_at: l.delivered_at as string | null, source: l.source as string, event_key: l.event_key as string | null });
    lettersByUser.set(l.user_id, arr);
  }

  let delivered = 0, events = 0, pregenerated = 0, failed = 0;

  for (const userId of userIds) {
    const all = lettersByUser.get(userId) ?? [];
    const lastDeliveredAt = all
      .map((e) => e.delivered_at).filter(Boolean)
      .map((d) => new Date(d as string)).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const freqOK = !lastDeliveredAt || now.getTime() - lastDeliveredAt.getTime() >= MIN_GAP_DAYS * DAY_MS;

    try {
      let handled = false;
      const chart = chartFor(userId);
      if (freqOK && chart) {
        const deliveredKeys = new Set(all.filter((l) => l.source === "event").map((l) => l.event_key ?? ""));
        const ev = detectEvents(chart, now).find((e) => !deliveredKeys.has(e.event_key));
        if (ev) {
          const rowId = await ensureUserLetterRow({ userId, slug: ev.slug, source: "event", eventKey: ev.event_key, deliverAt: now.toISOString() });
          if (rowId) {
            await generateAndStore(rowId, { eventContext: ev.context });
            const res = await deliverUserLetter(rowId);
            if (res.delivered) {
              delivered++; events++; handled = true;
              await sendLetterEmail({ userId, userLetterId: rowId }).catch((e) => console.error(`[letters-drip] event email failed userId=${userId}:`, e));
            }
          }
        }
      }

      const anchor = anchorByUser.get(userId);
      if (!handled && anchor) {
        const drip = all.filter((l) => l.source === "drip");
        const plan = planDripAction({
          templates: timeTemplates,
          existing: drip.map((e) => ({ slug: e.slug, status: e.status })),
          anchor, now, lastDeliveredAt,
        });
        if (plan) {
          let rowId = drip.find((e) => e.slug === plan.slug)?.id ?? null;
          if (plan.create || !rowId) {
            rowId = await ensureUserLetterRow({ userId, slug: plan.slug, source: "drip", deliverAt: plan.deliverAt });
          }
          if (rowId) {
            const gen = await generateAndStore(rowId);
            if (gen.generated) pregenerated++;
            if (plan.deliver) {
              const res = await deliverUserLetter(rowId);
              if (res.delivered) {
                delivered++;
                await sendLetterEmail({ userId, userLetterId: rowId }).catch((e) => console.error(`[letters-drip] email failed userId=${userId}:`, e));
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof AiDisabledError) break;
      console.error(`[letters-drip] userId=${userId} failed:`, err);
      failed++;
    }
  }

  await supabaseAdmin.from("cron_runs").insert({
    name: "letters-drip",
    status: failed === 0 ? "ok" : delivered + pregenerated > 0 ? "partial" : "error",
    metadata: { delivered, events, pregenerated, failed },
  });

  return { delivered, events, pregenerated, failed };
}
