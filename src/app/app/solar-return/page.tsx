"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";
import { computeTopTransits } from "@/lib/chart-engine";
import type { NatalChart } from "@/lib/astro-types";
import { ROUTES } from "@/lib/routes";
import { TrendingUp, AlertTriangle, Lock, Star } from "lucide-react";

type SavedReading = {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  chart_data: NatalChart;
};

const SHORT_MONTHS = ["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"];
const FULL_MONTHS  = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];

function nextBirthday(birthDate: string): { date: Date; daysUntil: number; year: number } {
  const today = new Date();
  const birth = new Date(birthDate + "T12:00:00Z");
  const m = birth.getUTCMonth();
  const d = birth.getUTCDate();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  let candidate = new Date(Date.UTC(today.getUTCFullYear(), m, d));
  if (candidate < todayUTC) {
    candidate = new Date(Date.UTC(today.getUTCFullYear() + 1, m, d));
  }
  const daysUntil = Math.round((candidate.getTime() - todayUTC.getTime()) / 86400000);
  return { date: candidate, daysUntil, year: candidate.getUTCFullYear() };
}

function formatBirthdayDate(date: Date): string {
  return `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]}`;
}

const PLANET_THEME: Record<string, string> = {
  "Słońce":   "Rok tożsamości i wyrażania siebie",
  "Księżyc":  "Rok emocji i życia wewnętrznego",
  "Merkury":  "Rok komunikacji i kluczowych decyzji",
  "Wenus":    "Rok relacji, miłości i piękna",
  "Mars":     "Rok działania, ambicji i energii",
  "Jowisz":  "Rok wzrostu, expansji i nowych możliwości",
  "Saturn":   "Rok odpowiedzialności, budowania i dojrzewania",
  "Uran":     "Rok przełomów i nieoczekiwanych zmian",
  "Neptun":   "Rok duchowości, intuicji i marzeń",
  "Pluton":   "Rok głębokiej transformacji",
};

export default function SolarReturnPage() {
  const router     = useRouter();
  const params     = useSearchParams();
  const { session, loading: authLoading } = useAuth();

  const readingId = params.get("reading_id");

  const [reading, setReading] = useState<SavedReading | null>(null);
  const [loading, setLoading] = useState(true);

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const loadReading = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch("/api/get-readings", { headers: authHeader });
      const { readings } = await res.json() as { readings: SavedReading[] };
      const found = readingId
        ? readings.find((r: SavedReading) => r.id === readingId) ?? readings[0]
        : readings[0];
      setReading(found ?? null);
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, readingId]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { router.push(ROUTES.public.login.path); return; }
    loadReading();
  }, [authLoading, session, loadReading, router]);

  const srData = useMemo(() => {
    if (!reading) return null;
    const { date, daysUntil, year } = nextBirthday(reading.birth_date);
    const transits = computeTopTransits(reading.chart_data, date);
    return { date, daysUntil, year, transits };
  }, [reading]);

  const SUPPORTING_THEME = (planet: string) => PLANET_THEME[planet] ?? "Rok szczególnej energii";

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-60 pointer-events-none" />
      <Navbar />

      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {loading && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Wczytuję…</p>
          </div>
        )}

        {!loading && !reading && (
          <div className="glass-card rounded-2xl p-10 text-center">
            <CosmoIcon className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-white mb-2">Brak kosmogramu</h2>
            <Link href={ROUTES.app.cosmogram.path} className="text-amber-400 text-sm hover:text-amber-300 transition-colors">
              Stwórz swój kosmogram →
            </Link>
          </div>
        )}

        {!loading && reading && srData && (
          <>
            {/* Hero */}
            <div className="text-center mb-10">
              <p className="text-slate-500 text-sm uppercase tracking-widest mb-2">Solar Return</p>
              <h1 className="text-4xl sm:text-5xl font-semibold text-white font-brand mb-3">
                Twój rok <span className="gradient-text text-glow">{srData.year}</span>
              </h1>
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <span>Zaczyna się</span>
                <span className="text-amber-300 font-semibold">{formatBirthdayDate(srData.date)} {srData.year}</span>
                {srData.daysUntil === 0 && <span className="text-amber-400 font-bold">— Dziś!</span>}
                {srData.daysUntil === 1 && <span className="text-slate-500">· jutro</span>}
                {srData.daysUntil > 1 && srData.daysUntil <= 14 && (
                  <span className="text-slate-500">· za {srData.daysUntil} dni</span>
                )}
                {srData.daysUntil > 14 && (
                  <span className="text-slate-500">· za {srData.daysUntil} dni</span>
                )}
              </div>
              {reading.name && (
                <p className="text-slate-600 text-xs mt-1">dla {reading.name}</p>
              )}
            </div>

            {/* Key themes from transits on birthday */}
            <div className="space-y-3 mb-8">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">
                Kluczowe energie Twojego roku
              </h2>

              {srData.transits.supporting && (
                <div className="glass-card rounded-2xl p-5 border border-emerald-800/30 bg-emerald-950/10">
                  <div className="flex gap-3 items-start">
                    <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-emerald-400/80 font-semibold uppercase tracking-wider mb-1">
                        Główna energia roku
                      </p>
                      <p className="text-base text-white font-medium mb-1">
                        {SUPPORTING_THEME(srData.transits.supporting.transit_planet)}
                      </p>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {srData.transits.supporting.transit_planet} w {srData.transits.supporting.transit_sign}{" "}
                        aktywuje Twojego {srData.transits.supporting.natal_planet} —{" "}
                        {srData.transits.supporting.aspect_type === "harmonia" || srData.transits.supporting.aspect_type === "dobre wsparcie"
                          ? "sprzyjający aspekt, który będzie wspierał Cię przez wiele miesięcy"
                          : "znaczący aspekt kształtujący ten rok"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {srData.transits.challenging && (
                <div className="glass-card rounded-2xl p-5 border border-amber-800/25 bg-amber-950/10">
                  <div className="flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-400/80 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-amber-400/60 font-semibold uppercase tracking-wider mb-1">
                        Główne wyzwanie roku
                      </p>
                      <p className="text-base text-white font-medium mb-1">
                        {srData.transits.challenging.transit_planet} — obszar do świadomej pracy
                      </p>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {srData.transits.challenging.transit_planet} w {srData.transits.challenging.transit_sign}{" "}
                        tworzy napięcie z Twoim {srData.transits.challenging.natal_planet} —{" "}
                        wyzwanie, które daje możliwość wzrostu, gdy je zaakceptujesz
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!srData.transits.supporting && !srData.transits.challenging && (
                <div className="glass-card rounded-2xl p-5 border border-white/10 text-center">
                  <p className="text-slate-400 text-sm">Brak wyraźnych aspektów w dniu Solar Return — spokojny początek roku.</p>
                </div>
              )}
            </div>

            {/* Premium gate — full report */}
            <div className="glass-card rounded-2xl p-6 border border-amber-700/30 bg-gradient-to-b from-amber-950/20 to-transparent">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-amber-700/30 shrink-0">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-white">Pełen raport Solar Return</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-700/30 border border-amber-600/40 text-amber-300 font-medium">Premium</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">
                    12 stron: tematy roku z miesięcznym breakdownem, najlepsze daty dla ważnych decyzji,
                    wyzwania i okna rozwoju, spersonalizowane intencje na każdy kwartał.
                  </p>
                  <div className="space-y-2 mb-4">
                    {[
                      "Przełomowe daty roku (wg tranzytów)",
                      "Każdy kwartał z osobnym focusem",
                      "Spersonalizowane afirmacje i intencje",
                      "PDF do pobrania i wydruku",
                    ].map(item => (
                      <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                        <Star className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-700 to-amber-500 text-white shadow-lg shadow-amber-950/40 hover:shadow-amber-800/40 transition-all">
                      Wykup raport — 39 zł
                    </button>
                    <Link
                      href={ROUTES.app.settings.path + "/subscription"}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
                    >
                      Lub aktywuj Premium
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href={ROUTES.app.calendar.path} className="text-slate-600 text-sm hover:text-slate-400 transition-colors">
                ← Wróć do Kalendarza
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
