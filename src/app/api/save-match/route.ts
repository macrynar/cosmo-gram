import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Nieprawidłowy token" }, { status: 401 });

  const body = await req.json() as {
    person1Name: string; person1BirthDate: string; person1BirthTime: string; person1BirthPlace: string;
    person2Name: string; person2BirthDate: string; person2BirthTime: string; person2BirthPlace: string;
    overallScore: number; compatibilityData: unknown;
  };

  const defaultName = `${body.person1Name || "Osoba 1"} × ${body.person2Name || "Osoba 2"}`;

  const { data: inserted, error } = await supabaseAdmin.from("matches").insert({
    user_id: user.id,
    name: defaultName,
    person1_name: body.person1Name,
    person1_birth_date: body.person1BirthDate,
    person1_birth_time: body.person1BirthTime,
    person1_birth_place: body.person1BirthPlace,
    person2_name: body.person2Name,
    person2_birth_date: body.person2BirthDate,
    person2_birth_time: body.person2BirthTime,
    person2_birth_place: body.person2BirthPlace,
    overall_score: body.overallScore,
    compatibility_data: body.compatibilityData,
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: inserted?.id });
}
