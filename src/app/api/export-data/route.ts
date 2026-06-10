import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const uid = user.id;

  const [readings, matches, children, notes, conversations] = await Promise.all([
    supabaseAdmin.from("readings").select("*").eq("user_id", uid),
    supabaseAdmin.from("matches").select("id,name,person1_name,person2_name,overall_score,created_at").eq("user_id", uid),
    supabaseAdmin.from("children").select("id,name,birth_date,birth_place,created_at").eq("user_id", uid),
    supabaseAdmin.from("calendar_notes").select("id,date,note,created_at").eq("user_id", uid),
    supabaseAdmin.from("conversations").select("id,title,created_at").eq("user_id", uid),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: uid, email: user.email },
    readings: readings.data ?? [],
    matches: matches.data ?? [],
    children_charts: children.data ?? [],
    calendar_notes: notes.data ?? [],
    conversations: conversations.data ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cosmogram-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
