import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { isAuthorizedCron } from "@/lib/cronAuth";
import { render } from "@react-email/render";
import { MonthlyForecastEmail } from "@/components/emails/HoroscopeEmails";
import { getOrGenerateMonthContent } from "@/lib/calendar/cronGen";
import { getPrimaryReading } from "@/lib/readings";
import { Resend } from "resend";

export const maxDuration = 300; // generate for every premium user in one run
export const runtime = "nodejs";

// Lazy — avoid instantiating (and throwing on a missing key) at import/build time.
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Vercel Cron: GET /api/cron/monthly-forecast
 * Scheduled: 28th of each month at 6:00 PM UTC
 * Purpose: Send monthly forecast to Premium subscribers
 *
 * Security: Requires CRON_SECRET in Authorization header
 */

interface SubscriptionWithUser {
  user_id: string;
  email: string;
  name: string;
}

// Cron runs on the 28th → forecast the UPCOMING month (not the one that's ending).
function getUpcomingMonth(): { monthName: string; year: number; month: number } {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 2; // +1 → 1-indexed, +1 → next month
  if (month > 12) { month = 1; year += 1; }
  const monthName = new Intl.DateTimeFormat("pl-PL", { month: "long" }).format(new Date(year, month - 1));
  return { monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1), year, month };
}

async function getActivePremiumUsers(): Promise<SubscriptionWithUser[]> {
  // All premium subscriptions (active + trialing — both have premium access)
  const { data: subscriptions, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, monthly_forecast_sent_at")
    .in("status", ["active", "trialing"]);

  if (error || !subscriptions) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }

  // Filter: not sent in last 20 days (safety margin for monthly)
  const now = new Date();
  const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
  const eligibleUserIds = subscriptions
    .filter(
      (sub) => !sub.monthly_forecast_sent_at || new Date(sub.monthly_forecast_sent_at) < twentyDaysAgo
    )
    .map((sub) => sub.user_id);

  if (eligibleUserIds.length === 0) {
    console.log("No eligible users for monthly forecast");
    return [];
  }

  // Opt-OUT model: send to everyone EXCEPT those who explicitly unsubscribed.
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

async function sendMonthlyEmail(
  user: SubscriptionWithUser,
  forecastContent: string,
  monthName: string,
  year: number
): Promise<boolean> {
  const html = await render(
    MonthlyForecastEmail({
      userName: user.name,
      month: monthName,
      year,
      forecastContent,
      userId: user.user_id,
    })
  );

  try {
    const result = await getResend().emails.send({
      from: process.env.RESEND_FROM ?? process.env.RESEND_FROM_EMAIL ?? "Cosmogram <hello@cosmo-gram.com>",
      to: user.email,
      // Month in the subject keeps each send unique → Gmail won't thread + collapse.
      subject: `Twoja prognoza na nadchodzący miesiąc · ${monthName} ${year}`,
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
    type: "monthly",
    status,
    error_msg: errorMsg || null,
  });
}

async function updateSentTimestamp(userId: string): Promise<void> {
  await supabaseAdmin
    .from("subscriptions")
    .update({ monthly_forecast_sent_at: new Date().toISOString() })
    .eq("user_id", userId);
}

async function runMonthlyCron(req: NextRequest) {
  // Auth check
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron/monthly-forecast] Started");

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    const { monthName, year, month } = getUpcomingMonth();

    const users = await getActivePremiumUsers();
    console.log(`[cron/monthly-forecast] Found ${users.length} eligible users`);

    // Process users sequentially (safe under maxDuration; AI gen is the slow part)
    for (const user of users) {
      try {
        const reading = await getPrimaryReading(user.user_id);
        if (!reading) {
          skipped++;
          await logHoroscopeSend(user.user_id, "skipped", "Brak kosmogramu");
          continue;
        }

        // Generate this user's PRIMARY-chart monthly forecast if not cached, then send
        const content = await getOrGenerateMonthContent(user.user_id, reading.readingId, reading.chart, year, month);
        if (!content) {
          skipped++;
          await logHoroscopeSend(user.user_id, "skipped", "Generowanie nie powiodło się");
          continue;
        }

        const emailSent = await sendMonthlyEmail(user, content, monthName, year);
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
        console.error(`[cron/monthly-forecast] Error for user ${user.user_id}:`, errorMsg);
        failed++;
        errors.push(`${user.user_id}: ${errorMsg}`);
        await logHoroscopeSend(user.user_id, "failed", errorMsg.slice(0, 200));
      }
    }

    console.log(
      `[cron/monthly-forecast] Completed: sent=${sent}, failed=${failed}, skipped=${skipped}`
    );

    // Log cron run
    await supabaseAdmin.from("cron_runs").insert({
      name: "monthly-forecast",
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
    console.error("[cron/monthly-forecast] Fatal error:", errorMsg);

    await supabaseAdmin.from("cron_runs").insert({
      name: "monthly-forecast",
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
  return runMonthlyCron(req);
}

export async function POST(req: NextRequest) {
  return runMonthlyCron(req);
}
