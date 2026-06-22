import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { render } from "@react-email/render";
import { WeeklyHoroscopeEmail } from "@/components/emails/HoroscopeEmails";
import { getOrGenerateWeekContent } from "@/lib/calendar/cronGen";
import type { NatalChart } from "@/lib/astro-types";
import { Resend } from "resend";

export const maxDuration = 300; // generate for every premium user in one run
export const runtime = "nodejs";

// Lazy — avoid instantiating (and throwing on a missing key) at import/build time.
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Vercel Cron: GET /api/cron/weekly-horoscope
 * Scheduled: Every Sunday at 6:00 PM UTC
 * Purpose: Send weekly horoscope to Premium subscribers
 *
 * Security: Requires CRON_SECRET in Authorization header
 */

interface SubscriptionWithUser {
  user_id: string;
  email: string;
  name: string;
}

function getWeekBoundaries(): { start: string; end: string } {
  const now = new Date();
  // Get Monday of current week (ISO)
  const dayOfWeek = now.getUTCDay();
  const diff = now.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(new Date(now.setUTCDate(diff)));
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);

  const start = monday.toISOString().slice(0, 10);
  const end = sunday.toISOString().slice(0, 10);
  return { start, end };
}

async function getActivePremiumUsers(): Promise<SubscriptionWithUser[]> {
  // All premium subscriptions (active + trialing — both have premium access)
  const { data: subscriptions, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, weekly_horoscope_sent_at")
    .in("status", ["active", "trialing"]);

  if (error || !subscriptions) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }

  // Filter: not sent in last 6 days (safety margin against double-send)
  const now = new Date();
  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const eligibleUserIds = subscriptions
    .filter(
      (sub) => !sub.weekly_horoscope_sent_at || new Date(sub.weekly_horoscope_sent_at) < sixDaysAgo
    )
    .map((sub) => sub.user_id);

  if (eligibleUserIds.length === 0) {
    console.log("No eligible users for weekly horoscope");
    return [];
  }

  // Opt-OUT model: email_horoscope defaults to true, so send to everyone EXCEPT
  // those who explicitly unsubscribed (= false). Users with no row are included.
  const { data: unsub } = await supabaseAdmin
    .from("user_preferences")
    .select("user_id")
    .eq("email_horoscope", false)
    .in("user_id", eligibleUserIds);
  const unsubscribed = new Set((unsub ?? []).map((p) => p.user_id));

  // Get email + name for eligible users
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (authError || !users) {
    console.error("Error listing users:", authError);
    return [];
  }

  const eligible = new Set(eligibleUserIds);
  return users
    .filter((u) => eligible.has(u.id) && !unsubscribed.has(u.id) && u.email)
    .map((u) => ({
      user_id: u.id,
      email: u.email || "",
      name: u.user_metadata?.name || u.email?.split("@")[0] || "użytkowniku",
    }));
}

async function getUserLatestChart(userId: string): Promise<{ readingId: string; chart: NatalChart } | null> {
  const { data } = await supabaseAdmin
    .from("readings")
    .select("id, chart_data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.id || !data?.chart_data) return null;
  return { readingId: data.id, chart: data.chart_data as NatalChart };
}

async function sendWeeklyEmail(
  user: SubscriptionWithUser,
  horoscopeContent: string
): Promise<boolean> {
  const { start: weekStart, end: weekEnd } = getWeekBoundaries();

  const html = await render(
    WeeklyHoroscopeEmail({
      userName: user.name,
      weekStart,
      weekEnd,
      horoscopeContent,
      userId: user.user_id,
    })
  );

  try {
    const result = await getResend().emails.send({
      from: process.env.RESEND_FROM ?? process.env.RESEND_FROM_EMAIL ?? "Cosmogram <hello@cosmo-gram.com>",
      to: user.email,
      subject: `Twoja tygodniówka astrologiczna ${weekStart} – ${weekEnd}`,
      html,
      replyTo: "hello@cosmo-gram.com",
    });

    if (result.error) {
      console.error(`Failed to send email to ${user.email}:`, result.error);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Error sending email to ${user.email}:`, err);
    return false;
  }
}

async function logHoroscopeSend(
  userId: string,
  status: "sent" | "failed" | "skipped",
  errorMsg?: string
): Promise<void> {
  await supabaseAdmin.from("horoscope_send_logs").insert({
    user_id: userId,
    type: "weekly",
    status,
    error_msg: errorMsg || null,
  });
}

async function updateSentTimestamp(userId: string): Promise<void> {
  await supabaseAdmin
    .from("subscriptions")
    .update({ weekly_horoscope_sent_at: new Date().toISOString() })
    .eq("user_id", userId);
}

async function runWeeklyCron(req: NextRequest) {
  // Auth check
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron/weekly-horoscope] Started");

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    const users = await getActivePremiumUsers();
    console.log(`[cron/weekly-horoscope] Found ${users.length} eligible users`);

    const { start: weekStart } = getWeekBoundaries();

    // Process users sequentially (safe under maxDuration; AI gen is the slow part)
    for (const user of users) {
      try {
        const reading = await getUserLatestChart(user.user_id);
        if (!reading) {
          skipped++;
          await logHoroscopeSend(user.user_id, "skipped", "Brak kosmogramu");
          continue;
        }

        // Generate the week reading for this user if not yet cached, then send
        const content = await getOrGenerateWeekContent(user.user_id, reading.readingId, reading.chart, weekStart);
        if (!content) {
          skipped++;
          await logHoroscopeSend(user.user_id, "skipped", "Generowanie nie powiodło się");
          continue;
        }

        const emailSent = await sendWeeklyEmail(user, content);
        if (emailSent) {
          sent++;
          await updateSentTimestamp(user.user_id);
          await logHoroscopeSend(user.user_id, "sent");
        } else {
          failed++;
          await logHoroscopeSend(user.user_id, "failed", "Resend API error");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[cron/weekly-horoscope] Error for user ${user.user_id}:`, errorMsg);
        failed++;
        errors.push(`${user.user_id}: ${errorMsg}`);
        await logHoroscopeSend(user.user_id, "failed", errorMsg.slice(0, 200));
      }
    }

    console.log(
      `[cron/weekly-horoscope] Completed: sent=${sent}, failed=${failed}, skipped=${skipped}`
    );

    // Log cron run
    await supabaseAdmin.from("cron_runs").insert({
      name: "weekly-horoscope",
      status: failed === 0 && (sent > 0 || skipped > 0) ? "ok" : "partial",
      metadata: { sent, failed, skipped, errors: errors.slice(0, 5) },
    });

    return NextResponse.json({
      success: true,
      sent,
      failed,
      skipped,
      errors: errors.slice(0, 5),
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[cron/weekly-horoscope] Fatal error:", errorMsg);

    await supabaseAdmin.from("cron_runs").insert({
      name: "weekly-horoscope",
      status: "error",
      metadata: { error: errorMsg },
    });

    return NextResponse.json(
      { error: "Cron failed", message: errorMsg },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return runWeeklyCron(req);
}

export async function POST(req: NextRequest) {
  return runWeeklyCron(req);
}
