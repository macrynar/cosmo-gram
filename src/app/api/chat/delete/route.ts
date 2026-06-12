import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const conversationId = req.nextUrl.searchParams.get("id");
  const deleteAll = req.nextUrl.searchParams.get("all") === "1";

  if (deleteAll) {
    // Delete all conversations (and messages via FK cascade) for this user
    await supabaseAdmin
      .from("messages")
      .delete()
      .in(
        "conversation_id",
        (await supabaseAdmin
          .from("conversations")
          .select("id")
          .eq("user_id", user.id)).data?.map(c => c.id) ?? []
      );
    await supabaseAdmin.from("conversations").delete().eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (!conversationId) return NextResponse.json({ error: "Brak id" }, { status: 400 });

  // Verify ownership before deleting
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!conv) return NextResponse.json({ error: "Nie znaleziono rozmowy" }, { status: 404 });

  // Messages deleted via FK ON DELETE CASCADE
  await supabaseAdmin.from("conversations").delete().eq("id", conversationId);

  return NextResponse.json({ ok: true });
}
