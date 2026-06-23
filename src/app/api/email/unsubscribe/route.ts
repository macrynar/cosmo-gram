import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET /api/email/unsubscribe?id=<user_id>[&type=letters]
// One-click unsubscribe (no auth needed — link in email).
// type=letters → wypis z Listów od Astrei; domyślnie z codziennych horoskopów.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("id");
  const type = url.searchParams.get("type");
  if (!userId) return new NextResponse("Bad request", { status: 400 });

  const field = type === "letters" ? "email_letters" : "email_horoscope";
  await supabaseAdmin
    .from("user_preferences")
    .upsert({ user_id: userId, [field]: false, updated_at: new Date().toISOString() });

  const what = type === "letters" ? "Listów od Astrei" : "codziennych horoskopów";
  return new NextResponse(
    `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><title>Wypisano</title>
    <style>body{background:#050508;color:#94a3b8;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .card{background:rgba(212,175,55,0.06);border:0.5px solid rgba(212,175,55,0.18);border-radius:16px;padding:40px;text-align:center;max-width:400px}
    h1{color:#F3E5AB;font-weight:400;font-size:22px;margin:0 0 12px}p{font-size:14px;line-height:1.7;margin:0 0 20px}
    a{color:#D4AF37;font-size:13px}</style></head>
    <body><div class="card"><h1>✦ Wypisano</h1>
    <p>Nie będziesz już otrzymywać ${what}. Możesz ponownie włączyć powiadomienia w ustawieniach konta.</p>
    <a href="https://www.cosmo-gram.com/app/settings/notifications">Zarządzaj powiadomieniami</a></div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
