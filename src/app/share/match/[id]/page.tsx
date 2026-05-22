import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { CompatibilityResult } from "@/app/api/astro-match/route";
import ShareMatchClient from "./ShareMatchClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("matches")
    .select("person1_name, person2_name, overall_score")
    .eq("id", id)
    .single();

  const p1 = data?.person1_name ?? "Osoba 1";
  const p2 = data?.person2_name ?? "Osoba 2";
  const score = data?.overall_score ?? 0;

  return {
    title: `${p1} × ${p2} — Astro Match ${score}/100 | Cosmogram`,
    description: `Kompatybilność astrologiczna ${p1} i ${p2}: ${score}/100. Sprawdź swoją na cosmogram.pl`,
    openGraph: {
      title: `${p1} × ${p2} — Astro Match | Cosmogram`,
      description: `Kompatybilność: ${score}/100. Sprawdź swoją na cosmogram.pl`,
      siteName: "Cosmogram",
    },
  };
}

export default async function ShareMatchPage({ params }: Props) {
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("matches")
    .select("person1_name, person2_name, overall_score, compatibility_data")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <ShareMatchClient
      person1Name={data.person1_name}
      person2Name={data.person2_name}
      result={data.compatibility_data as CompatibilityResult}
    />
  );
}
