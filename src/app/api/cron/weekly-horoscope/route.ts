import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { render } from "@react-email/render";
import { WeeklyHoroscopeEmail } from "@/components/emails/HoroscopeEmails";
import { Resend } from "resend";
import { createHmac } from "crypto";

export const maxDuration = 60;
export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Vercel Cron: POST /api/cron/weekly-horoscope
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

function generateUnsubscribeToken(userId: string, type: "weekly" | "monthly"): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || "default-secret";
  const data = `${userId}:${type}`;
  return createHmac("sha256", secret).update(data).digest("hex");
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
  // Get all active Premium subscriptions
  const { data: subscriptions, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, weekly_horoscope_sent_at")
    .eq("status", "active");

  if (error || !subscriptions) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }

  // Filter: not sent in last 6 days (safety margin)
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

  // Get email + name for eligible users
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (authError || !users) {
    console.error("Error listing users:", authError);
    return [];
  }

  return users
    .filter((u) => eligibleUserIds.includes(u.id) && u.email)
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

async function getOrGenerateWeekInterpretation(
  userId: string,
  readingId: string
): Promise<{ content: string; generated: boolean } | null> {
  const { start: weekStart } = getWeekBoundaries();

  // Try to get cached interpretation
  const { data: cached } = await supabaseAdmin
    .from("week_interpretations")
    .select("content")
    .eq("user_id", userId)
    .eq("reading_id", readingId)
    .eq("iso_week", weekStart)
    .maybeSingle();

  if (cached) {
    return { content: cached.content, generated: false };
  }

  // If not cached, we cannot generate during cron (would exceed timeout)
  // Return null to skip this user
  console.log(`Week interpretation not cached for user ${userId}, skipping`);
  return null;
}

async function sendWeeklyEmail(
  user: SubscriptionWithUser,
  horoscopeContent: string
): Promise<boolean> {
  const { start: weekStart, end: weekEnd } = getWeekBoundaries();
  const unsubscribeToken = generateUnsubscribeToken(user.user_id, "weekly");

  // Store the token in the database for verification during unsubscribe
  await supabaseAdmin.from("email_unsubscribe_tokens").insert({
    user_id: user.user_id,
    token: unsubscribeToken,
    type: "weekly",
  });

  const html = await render(
    WeeklyHoroscopeEmail({
      userName: user.name,
      weekStart,
      weekEnd,
      horoscopeContent,
      unsubscribeToken,
      userId: user.user_id,
    })
  );

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@cosmogram.pl",
      to: user.email,
      subject: `Twoja tygodniówka astrologiczna ${weekStart} – ${weekEnd}`,
      html,
      replyTo: "hello@cosmogram.pl",
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

export async function POST(req: NextRequest) {
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

    // Process users sequentially (safe under timeout)
    for (const user of users) {
      try {
        // Get latest reading
        const readingId = await getUserLatestReading(user.user_id);
        if (!readingId) {
          console.log(`[cron/weekly-horoscope] User ${user.user_id} has no reading`);
          skipped++;
          await logHoroscopeSend(user.user_id, "skipped", "No natal chart");
          continue;
        }

        // Get cached week interpretation (don't generate new ones during cron)
        const interpretation = await getOrGenerateWeekInterpretation(user.user_id, readingId);
        if (!interpretation) {
          skipped++;
          await logHoroscopeSend(user.user_id, "skipped", "Week interpretation not cached");
          continue;
        }

        // Send email
        const emailSent = await sendWeeklyEmail(user, interpretation.content);
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
