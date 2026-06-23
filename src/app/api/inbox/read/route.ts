import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// Oznacza pozycję skrzynki jako przeczytaną. Dla listu/raportu ustawia też
// read_at + status='read' na user_letters. Zwraca nowy licznik nieprzeczytanych.
export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "Brak id" }, { status: 400 });

  const now = new Date().toISOString();
  const { data: item } = await supabaseAdmin
    .from("inbox_items")
    .update({ read_at: now })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("read_at", null)
    .select("ref_id, type")
    .maybeSingle();

  if (item?.ref_id && (item.type === "letter" || item.type === "report")) {
    await supabaseAdmin
      .from("user_letters")
      .update({ read_at: now, status: "read" })
      .eq("id", item.ref_id)
      .eq("user_id", user.id);
  }

  const { count } = await supabaseAdmin
    .from("inbox_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return NextResponse.json({ ok: true, unread: count ?? 0 });
}
