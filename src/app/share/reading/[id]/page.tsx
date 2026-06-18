import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { NatalChart } from "@/lib/astro-types";
import { longitudeToSign } from "@/lib/astro-types";
import { getKartaByChartId } from "@/services/natalGenerator";
import ShareReadingClient from "./ShareReadingClient";

type Props = { params: Promise<{ id: string }> };

function bigThreeFromChart(chart: NatalChart | null): { sun: string | null; moon: string | null; asc: string | null } {
  if (!chart) return { sun: null, moon: null, asc: null };
  const sun  = chart.planets.find(p => p.name === "Słońce")?.sign ?? null;
  const moon = chart.planets.find(p => p.name === "Księżyc")?.sign ?? null;
  const asc  = chart.birthData.timeUnknown ? null : longitudeToSign(chart.ascendant).name;
  return { sun, moon, asc };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("readings")
    .select("name, chart_data")
    .eq("id", id)
    .single();

  const name  = data?.name ?? "Kosmogram Natalny";
  const chart = (data?.chart_data ?? null) as NatalChart | null;
  const { sun, moon, asc } = bigThreeFromChart(chart);

  const bigThreeParts = [
    sun  ? `Słońce w ${sun}`   : null,
    moon ? `Księżyc w ${moon}` : null,
    asc  ? `ASC w ${asc}`      : null,
  ].filter(Boolean);

  const subtitle    = bigThreeParts.length > 0 ? bigThreeParts.join(", ") : "Kosmogram Natalny";
  const title       = `${name} — ${subtitle}`;
  const description = `Kosmogram natalny: ${subtitle}. Stwórz swój własny na cosmo-gram.com`;
  const ogImageUrl  = `/share/reading/${id}/opengraph-image`;

  return {
    title,
    description,
    twitter: {
      card:        "summary_large_image",
      title,
      description,
      images:      [ogImageUrl],
    },
    openGraph: {
      title,
      description,
      siteName: "Cosmo-gram",
      images:   [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
  };
}

export default async function ShareReadingPage({ params }: Props) {
  const { id } = await params;

  const [{ data }, modules] = await Promise.all([
    supabaseAdmin
      .from("readings")
      .select("name, chart_data, interpretation, user_id")
      .eq("id", id)
      .single(),
    getKartaByChartId(id),
  ]);

  if (!data) notFound();

  const { sun, moon, asc } = bigThreeFromChart(data.chart_data as NatalChart | null);

  return (
    <ShareReadingClient
      name={data.name}
      chart={data.chart_data as NatalChart}
      interpretation={data.interpretation}
      kartaModules={modules}
      readingUserId={data.user_id as string}
      bigThree={{ sun, moon, asc }}
    />
  );
}
