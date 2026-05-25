import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reading_id, thumbs, dimensions } = (await req.json()) as {
    reading_id: string;
    thumbs: 1 | -1;
    dimensions?: Record<string, number>;
  };

  if (!reading_id || (thumbs !== 1 && thumbs !== -1)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Verify this reading belongs to the user
  const { data: reading } = await supabaseAdmin
    .from("readings")
    .select("id, user_id")
    .eq("id", reading_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!reading) return NextResponse.json({ error: "Reading not found" }, { status: 404 });

  await supabaseAdmin
    .from("readings")
    .update({
      rating_thumbs: thumbs,
      rating_dimensions: dimensions ?? null,
      rated_at: new Date().toISOString(),
    })
    .eq("id", reading_id);

  return NextResponse.json({ ok: true });
}
