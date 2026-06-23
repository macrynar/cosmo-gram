import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// Treść listu/raportu do czytnika. Tylko właściciel (sprawdzane po user_id).
export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Brak id" }, { status: 400 });

  const { data: letter } = await supabaseAdmin
    .from("user_letters")
    .select("id, letter_slug, content_md, status, placement_snapshot, read_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!letter || !letter.content_md) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  const { data: template } = await supabaseAdmin
    .from("astrea_letter_templates")
    .select("title, kind, tier")
    .eq("slug", letter.letter_slug)
    .maybeSingle();

  const snapshot = (letter.placement_snapshot ?? {}) as { signature_label?: string };

  return NextResponse.json({
    id: letter.id,
    title: template?.title ?? "List od Astrei",
    kind: template?.kind ?? "letter",
    tier: template?.tier ?? "premium",
    content_md: letter.content_md,
    signature_label: snapshot.signature_label ?? null,
    read_at: letter.read_at,
  });
}
