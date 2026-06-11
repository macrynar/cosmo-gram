import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sendDailyHoroscopeEmail } from "@/lib/email";

// Vercel Cron calls this at 06:00 UTC every day
// Secured by CRON_SECRET env var
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Warsaw",
  }).format(new Date());

  // 1. Get opted-in users
  const { data: prefs, error: prefsErr } = await supabaseAdmin
    .from("user_preferences")
    .select("user_id")
    .eq("email_horoscope", true);

  if (prefsErr || !prefs?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const userIds = prefs.map(p => p.user_id);

  // 2. Get their most recent reading's sun sign
  const { data: readings } = await supabaseAdmin
    .from("readings")
    .select("user_id, chart_data")
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  // Keep only the most recent reading per user
  const latestByUser = new Map<string, { sun_sign: string }>();
  for (const r of readings ?? []) {
    if (!latestByUser.has(r.user_id)) {
      const sun = (r.chart_data?.planets as { name: string; sign: string }[] | undefined)
        ?.find(p => p.name === "Słońce" || p.name === "Sun");
      if (sun?.sign) latestByUser.set(r.user_id, { sun_sign: sun.sign });
    }
  }

  // 3. Get emails from auth.admin
  const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map(authUsers.map(u => [u.id, u.email ?? ""]));

  // 4. Send emails
  let sent = 0;
  const results = await Promise.allSettled(
    userIds.map(async (userId) => {
      const email = emailById.get(userId);
      const info  = latestByUser.get(userId);
      if (!email || !info) return;

      await sendDailyHoroscopeEmail(email, info.sun_sign, today, userId);
      sent++;
    })
  );

  const failed = results.filter(r => r.status === "rejected").length;
  console.log(`[cron/daily-horoscope] sent=${sent} failed=${failed} date=${today}`);

  await supabaseAdmin.from("cron_runs").insert({
    name: "daily-horoscope",
    status: failed === 0 ? "ok" : sent > 0 ? "partial" : "error",
    metadata: { sent, failed, date: today },
  });

  return NextResponse.json({ sent, failed });
}
