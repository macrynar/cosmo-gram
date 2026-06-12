import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { aiComplete } from "@/lib/deepseek";

const SUMMARY_PROMPT = `Podsumuj tę rozmowę astrologiczną w 3–5 zdaniach. Uwzględnij:
- główne tematy i pytania usera
- wątki emocjonalne lub obszary życia, których dotyczyła rozmowa
- sprawy, do których user chciał wrócić lub które zostały otwarte

Pisz w 2 os. liczby pojedynczej, forma neutralna (bez "powiedziałeś/powiedziałaś"). Tylko podsumowanie — bez nagłówków, bez wstępu.`;

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const { conversationId } = await req.json() as { conversationId: string };
  if (!conversationId) return NextResponse.json({ error: "Brak conversationId" }, { status: 400 });

  // Verify ownership
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id, summary, summary_updated_at")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!conv) return NextResponse.json({ error: "Nie znaleziono rozmowy" }, { status: 404 });
  if (conv.summary) return NextResponse.json({ summary: conv.summary });

  // Load messages — only content, never stored in ai_call_logs (see aiComplete call below)
  const { data: msgs } = await supabaseAdmin
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(40);

  if (!msgs || msgs.length < 2) {
    return NextResponse.json({ summary: null });
  }

  const transcript = msgs
    .map(m => `${m.role === "user" ? "User" : "Asystent"}: ${m.content}`)
    .join("\n\n");

  let summary = "";
  try {
    summary = await aiComplete({
      system: SUMMARY_PROMPT,
      messages: [{ role: "user", content: transcript }],
      maxTokens: 250,
      // PRIVACY: task name only — message content NEVER in ai_call_logs
      task: "chat_summary",
    });
  } catch {
    return NextResponse.json({ error: "Błąd AI" }, { status: 502 });
  }

  await supabaseAdmin
    .from("conversations")
    .update({ summary, summary_updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json({ summary });
}
