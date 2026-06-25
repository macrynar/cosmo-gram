import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getPrimaryReadingId } from "@/lib/readings";

export type ChartOption = {
  id: string;
  type: "natal" | "child";
  name: string;
  birth_date: string;
  chart_data: unknown;
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const [{ data: readings }, { data: children }, primaryReadingId] = await Promise.all([
    supabaseAdmin
      .from("readings")
      .select("id, name, birth_date, birth_place, chart_data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("children")
      .select("id, name, birth_date, chart_data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    getPrimaryReadingId(user.id),
  ]);

  const charts: ChartOption[] = [
    ...(readings ?? []).map(r => ({
      id: r.id,
      type: "natal" as const,
      name: r.name || `${(r.birth_place as string).split(",")[0]} · ${r.birth_date}`,
      birth_date: r.birth_date,
      chart_data: r.chart_data,
    })),
    ...(children ?? []).map(c => ({
      id: c.id,
      type: "child" as const,
      name: c.name,
      birth_date: c.birth_date,
      chart_data: c.chart_data,
    })),
  ];

  return NextResponse.json({ charts, primaryReadingId });
}
