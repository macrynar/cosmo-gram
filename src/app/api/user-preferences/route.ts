import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const ALLOWED_FIELDS = new Set(["chat_data_warning_dismissed", "email_horoscope"]);

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;

  // Whitelist updatable fields
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(k)) update[k] = v;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Brak dozwolonych pól" }, { status: 400 });
  }

  await supabaseAdmin
    .from("user_preferences")
    .upsert({ user_id: user.id, ...update, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  return NextResponse.json({ ok: true });
}
