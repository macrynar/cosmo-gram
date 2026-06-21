import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { render } from "@react-email/render";
import { MonthlyForecastEmail } from "@/components/emails/HoroscopeEmails";
import { Resend } from "resend";

export const maxDuration = 60;
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

function getCurrentMonthBoundaries(): { monthName: string; year: number } {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const monthName = new Intl.DateTimeFormat("pl-PL", { month: "long" }).format(
    new Date(year, month - 1)
  );
  return { monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1), year };
}

async function getActivePremiumUsers(): Promise<SubscriptionWithUser[]> {
  // Get all active Premium subscriptions
  const { data: subscriptions, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, monthly_forecast_sent_at")
    .eq("status", "active");

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

  const { data: prefs, error: prefsError } = await supabaseAdmin
    .from("user_preferences")
    .select("user_id")
    .eq("email_horoscope", true)
    .in("user_id", eligibleUserIds);

  if (prefsError || !prefs?.length) {
    console.error("Error fetching user_preferences:", prefsError);
    return [];
  }

  const optedIn = new Set(prefs.map((p) => p.user_id));

  // Get email + name for eligible users
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (authError || !users) {
    console.error("Error listing users:", authError);
    return [];
  }

  return users
    .filter((u) => eligibleUserIds.includes(u.id) && optedIn.has(u.id) && u.email)
    .map((u) => ({
      user_id: u.id,
      email: u.email || "",
      name: u.user_metadata?.name || u.email?.split("@")[0] || "użytkowniku",
    }));
}

async function getUserLatestReading(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("readings")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id || null;
}

async function getOrGenerateMonthlyForecast(
  userId: string,
  readingId: string,
  month: number,
  year: number
): Promise<{ content: string } | null> {
  // Try to get cached forecast
  const { data: cached } = await supabaseAdmin
    .from("monthly_summaries")
    .select("summary_text")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (cached?.summary_text) {
    return { content: cached.summary_text };
  }

  // If not cached, we cannot generate during cron (would exceed timeout)
  console.log(`Monthly forecast not cached for user ${userId}, skipping`);
  return null;
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
      subject: `Twoja prognoza na ${monthName} ${year}`,
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
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron/monthly-forecast] Started");

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    const { monthName, year } = getCurrentMonthBoundaries();
    const month = new Date().getUTCMonth() + 1;

    const users = await getActivePremiumUsers();
    console.log(`[cron/monthly-forecast] Found ${users.length} eligible users`);

    // Process users sequentially (safe under timeout)
    for (const user of users) {
      try {
        // Get latest reading
        const readingId = await getUserLatestReading(user.user_id);
        if (!readingId) {
          console.log(`[cron/monthly-forecast] User ${user.user_id} has no reading`);
          skipped++;
          await logHoroscopeSend(user.user_id, "skipped", "No natal chart");
          continue;
        }

        // Get cached monthly forecast (don't generate new ones during cron)
        const forecast = await getOrGenerateMonthlyForecast(user.user_id, readingId, month, year);
        if (!forecast) {
          skipped++;
          await logHoroscopeSend(user.user_id, "skipped", "Monthly forecast not cached");
          continue;
        }

        // Send email
        const emailSent = await sendMonthlyEmail(user, forecast.content, monthName, year);
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
