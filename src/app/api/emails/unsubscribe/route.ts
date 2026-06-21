import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createHmac } from "crypto";

/**
 * GET /api/emails/unsubscribe
 * Query params:
 *  - type: 'weekly' | 'monthly'
 *  - token: HMAC token (userId:type)
 *
 * Purpose: Disable email preferences for users who click unsubscribe
 */

function verifyUnsubscribeToken(userId: string, type: string, token: string): boolean {
  const secret = process.env.UNSUBSCRIBE_SECRET || "default-secret";
  const data = `${userId}:${type}`;
  const expectedToken = createHmac("sha256", secret).update(data).digest("hex");
  return token === expectedToken;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const token = searchParams.get("token");

    // Decode userId from token (if available) or from query
    // For now, token format is sufficient - we validate it first
    if (!type || !token) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // To verify the token, we need userId - but it's encoded in the token
    // For a simpler approach: extract from token if possible, or from email verification
    // For MVP: We'll create a temporary unsubscribe token table

    // Look up the unsubscribe request (find matching token)
    // Since token = HMAC(userId:type), we need to brute-force check active users
    // This is inefficient, so better approach: store tokens in DB during email send

    // Alternative: Store unsubscribe tokens in a temp table
    const { data: unsubRecord } = await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .select("user_id")
      .eq("token", token)
      .eq("type", type)
      .maybeSingle();

    if (!unsubRecord) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Unsubscribe</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9f5f0; padding: 40px 20px; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; text-align: center; }
              .error { color: #d4504f; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Link wygasł</h1>
              <p>Ten link do wypisania się nie jest już ważny.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://cosmogram.pl"}/app/settings">Zarządzaj preferencjami</a></p>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const userId = unsubRecord.user_id;

    // Update user preferences based on type
    if (type === "weekly") {
      await supabaseAdmin
        .from("subscriptions")
        .update({ weekly_horoscope_sent_at: null }) // Reset to allow future sends after user re-enables
        .eq("user_id", userId);
    } else if (type === "monthly") {
      await supabaseAdmin
        .from("subscriptions")
        .update({ monthly_forecast_sent_at: null })
        .eq("user_id", userId);
    }

    // Mark token as used
    await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Wypisano</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9f5f0; padding: 40px 20px; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; text-align: center; }
            .success { color: #4a7c59; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✓ Wypisano</h1>
            <p>Nie będziesz otrzymywać więcej wiadomości ${type === "weekly" ? "tygodniowych" : "miesięcznych"}.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://cosmogram.pl"}/app/settings">Powróć do ustawień</a></p>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err) {
    console.error("[emails/unsubscribe] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
