import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { NatalChart } from "@/lib/astro-types";
import { getKartaByChartId } from "@/services/natalGenerator";
import ShareReadingClient from "./ShareReadingClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("readings")
    .select("name, birth_place, birth_date")
    .eq("id", id)
    .single();

  const name = data?.name ?? "Kosmogram Natalny";
  const place = data?.birth_place?.split(",")[0] ?? "";

  return {
    title: `${name} | Cosmogram`,
    description: `Kosmogram natalny${place ? ` z ${place}` : ""}. Stwórz swój własny na cosmogram.pl`,
    openGraph: {
      title: `${name} | Cosmogram`,
      description: `Kosmogram natalny${place ? ` z ${place}` : ""}. Stwórz swój własny na cosmogram.pl`,
      siteName: "Cosmogram",
    },
  };
}

export default async function ShareReadingPage({ params }: Props) {
  const { id } = await params;

  const [{ data }, modules] = await Promise.all([
    supabaseAdmin
      .from("readings")
      .select("name, birth_date, birth_place, chart_data, interpretation")
      .eq("id", id)
      .single(),
    getKartaByChartId(id),
  ]);

  if (!data) notFound();

  return (
    <ShareReadingClient
      name={data.name}
      birthDate={data.birth_date}
      birthPlace={data.birth_place}
      chart={data.chart_data as NatalChart}
      interpretation={data.interpretation}
      kartaModules={modules}
    />
  );
}
