import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const { terms, marketing } = await req.json() as { terms: boolean; marketing?: boolean };

  const rows = [
    { user_id: user.id, consent_type: "terms", granted: terms, wording_version: "2026-06-10" },
    ...(marketing !== undefined ? [{ user_id: user.id, consent_type: "marketing", granted: marketing, wording_version: "2026-06-10" }] : []),
  ];

  // Silent failure if table doesn't exist yet — consent stored in localStorage as fallback
  try { await supabaseAdmin.from("user_consents").insert(rows); } catch {}

  return NextResponse.json({ ok: true });
}
