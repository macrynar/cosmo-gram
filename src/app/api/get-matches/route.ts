import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ matches: [] });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ matches: [] });

  const { data } = await supabaseAdmin
    .from("matches")
    .select("id, name, person1_name, person2_name, overall_score, created_at, compatibility_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ matches: data ?? [], count: data?.length ?? 0 });
}
