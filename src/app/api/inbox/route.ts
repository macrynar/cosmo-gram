import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// Lista pozycji skrzynki + licznik nieprzeczytanych dla zalogowanego usera.
export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const [{ data: items }, { count }] = await Promise.all([
    supabaseAdmin
      .from("inbox_items")
      .select("id, type, ref_id, title, preview, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("inbox_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  return NextResponse.json({ items: items ?? [], unread: count ?? 0 });
}
