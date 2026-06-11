"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { getTransitsForDate, getDayWeather, getUpcomingSignificantTransits } from "@/lib/astro/transits";
import type { UpcomingTransit } from "@/lib/astro/transits";
import type { NatalChart } from "@/lib/astro-types";
import Link from "next/link";
import { Flame, Droplets, Wind, Mountain, Sparkles, Lock, RefreshCw, ChevronRight, TrendingUp, AlertTriangle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PersonalHoroscope = {
  headline:   string;
  main:       string;
  reflection: string;
  weather:    { intensity: number; element: string; character: string };
  cached:     boolean;
};

type DayWeatherData = {
  intensity: number;
  element:   string;
  character: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ELEMENT_ICON: Record<string, React.ReactNode> = {
  "Ogień":     <Flame    className="w-4 h-4" />,
  "Woda":      <Droplets className="w-4 h-4" />,
  "Powietrze": <Wind     className="w-4 h-4" />,
  "Ziemia":    <Mountain className="w-4 h-4" />,
  "Mieszany":  <Sparkles className="w-4 h-4" />,
};

const ELEMENT_COLOR: Record<string, string> = {
  "Ogień":     "text-orange-400 border-orange-700/40 bg-orange-950/20",
  "Woda":      "text-blue-400 border-blue-700/40 bg-blue-950/20",
  "Powietrze": "text-teal-400 border-teal-700/40 bg-teal-950/20",
  "Ziemia":    "text-amber-500 border-amber-700/40 bg-amber-950/20",
  "Mieszany":  "text-slate-400 border-slate-700/40 bg-slate-900/20",
};

function IntensityDots({ value }: { value: number }) {
  return (
    <div className="flex gap-1 items-center">
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full transition-all ${
            i <= value ? "bg-amber-400 shadow-[0_0_6px_rgba(212,175,55,0.6)]" : "bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

function WeatherBadge({ weather }: { weather: DayWeatherData }) {
  const cls = ELEMENT_COLOR[weather.element] ?? ELEMENT_COLOR["Mieszany"];
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-medium ${cls}`}>
      {ELEMENT_ICON[weather.element]}
      <span className="capitalize">{weather.character}</span>
      <IntensityDots value={weather.intensity} />
    </div>
  );
}

function ParagraphBlock({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").filter(Boolean).map((p, i) => (
        <p key={i} className="text-slate-300 leading-relaxed text-sm mb-4 last:mb-0">{p}</p>
      ))}
    </>
  );
}

const CARD: React.CSSProperties = {
  background:     "rgba(5,4,14,0.55)",
  border:         "0.5px solid rgba(212,175,55,0.14)",
  backdropFilter: "blur(18px)",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function HoroscopePage() {
  const { user, session } = useAuth();
  const [isPremium, setIsPremium]         = useState(false);
  const [horoscope, setHoroscope]         = useState<PersonalHoroscope | null>(null);
  const [weather, setWeather]             = useState<DayWeatherData | null>(null);
  const [upcomingTransits, setUpcoming]   = useState<UpcomingTransit[]>([]);
  const [loading, setLoading]             = useState(true);
  const [generating, setGenerating]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const today   = new Date().toISOString().slice(0, 10);
  const todayPl = new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  useEffect(() => {
    if (!user || !session) return;

    async function load() {
      setLoading(true);
      try {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user!.id)
          .maybeSingle();
        const premium = sub?.status === "active" || sub?.status === "trialing";
        setIsPremium(premium);

        const { data: reading } = await supabase
          .from("readings")
          .select("chart_data")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (reading?.chart_data) {
          const chart = reading.chart_data as NatalChart;
          const transits = getTransitsForDate(chart, new Date(`${today}T12:00:00Z`));
          const w = getDayWeather(transits);
          setWeather({ intensity: w.intensity, element: w.element, character: w.character });
          const upcoming = getUpcomingSignificantTransits(chart, 14, new Date(`${today}T12:00:00Z`));
          setUpcoming(upcoming.slice(0, 3));

          // PostHog
          if (typeof window !== "undefined") {
            import("posthog-js").then(({ default: ph }) =>
              ph?.capture("horoscope_weather_viewed", { element: w.element, intensity: w.intensity, is_premium: premium })
            );
          }
        }

        if (premium) {
          const res = await fetch(`/api/daily-personal-horoscope?date=${today}`, {
            headers: { Authorization: `Bearer ${session!.access_token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setHoroscope(data);
            import("posthog-js").then(({ default: ph }) =>
              ph?.capture("personal_horoscope_viewed", { cached: data.cached })
            );
          } else if (res.status !== 404) {
            setError("Nie udało się załadować horoskopu.");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function generateNow() {
    if (!session) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/daily-personal-horoscope?date=${today}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        setHoroscope(await res.json());
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Błąd generowania.");
      }
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">

      <div>
        <p className="text-xs uppercase tracking-widest text-amber-500/50 mb-1">Horoskop</p>
        <h1 className="text-2xl font-light text-white capitalize">{todayPl}</h1>
      </div>

      {/* Pogoda dnia — widoczna dla wszystkich */}
      {weather && (
        <div className="rounded-2xl p-5" style={CARD}>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Energia dnia</p>
          <WeatherBadge weather={weather} />
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            {weather.intensity >= 4
              ? "Dziś dużo się dzieje w Twoim kosmogramie — aktywne tranzyty tworzą wyraźną energię."
              : weather.intensity >= 2
              ? "Umiarkowana aktywność tranzytów — dobry dzień na skupienie."
              : "Spokojny dzień bez silnych tranzytów — dobry czas na regenerację."}
          </p>
        </div>
      )}

      {/* Nadchodzące tranzyty — deterministic, no AI, available for all with chart */}
      {upcomingTransits.length > 0 && (
        <div className="rounded-2xl p-5 space-y-3" style={CARD}>
          <p className="text-xs uppercase tracking-widest text-slate-500">Zbliżające się okna</p>
          {upcomingTransits.map((t, i) => {
            const datePl = new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "short" }).format(new Date(t.date + "T12:00:00Z"));
            const aspectPl: Record<string, string> = { conjunction: "koniunkcja", opposition: "opozycja", square: "kwadrat", trine: "trygon", sextile: "sekstyl" };
            return (
              <button
                key={i}
                onClick={() => import("posthog-js").then(({ default: ph }) => ph?.capture("upcoming_transit_banner_clicked", { planet: t.transitPlanet, aspect: t.aspectType, date: t.date }))}
                className="w-full flex items-start gap-3 text-left"
              >
                {t.favorable
                  ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70 shrink-0 mt-0.5" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200 leading-snug">
                    <span className="font-medium">{t.transitPlanet}</span>
                    {" "}{aspectPl[t.aspectType] ?? t.aspectType}{" "}
                    <span className="text-slate-400">do natalnego {t.natalPoint}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{datePl} · orb {t.orbDegrees.toFixed(1)}°{t.applying ? " · aplikacyjny" : ""}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Premium: horoskop personalny */}
      {isPremium && (
        <>
          {horoscope ? (
            <div className="rounded-2xl p-5 space-y-4" style={CARD}>
              <h2 className="text-lg font-light text-amber-200 leading-snug">{horoscope.headline}</h2>
              <ParagraphBlock text={horoscope.main} />
              {horoscope.reflection && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "rgba(212,175,55,0.05)", border: "0.5px solid rgba(212,175,55,0.18)" }}
                >
                  <p className="text-xs uppercase tracking-widest text-amber-500/50 mb-2">Refleksja</p>
                  <p className="text-slate-300 text-sm italic leading-relaxed">{horoscope.reflection}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl p-6 text-center" style={CARD}>
              <p className="text-slate-400 text-sm mb-4">
                {error ?? "Personalny horoskop na dziś nie jest jeszcze gotowy."}
              </p>
              <button
                onClick={generateNow}
                disabled={generating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-amber-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 disabled:opacity-60 transition-all"
              >
                {generating
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generuję...</>
                  : <><Sparkles className="w-4 h-4" /> Wygeneruj horoskop</>}
              </button>
            </div>
          )}
        </>
      )}

      {/* Free: lock + upsell */}
      {!isPremium && (
        <div className="rounded-2xl p-5" style={{ ...CARD, border: "0.5px solid rgba(212,175,55,0.08)" }}>
          <div className="flex items-center gap-3 mb-3">
            <Lock className="w-4 h-4 text-amber-500/50 shrink-0" />
            <p className="text-sm font-medium text-slate-300">Personalny horoskop tranzytowy</p>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mb-4">
            Horoskop oparty o aktywne tranzyty planet do Twojego konkretnego kosmogramu — nie o znak Słońca.
            Codziennie nowy, generowany z pozycji planet względem Twoich planet natalnych.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Odblokuj w Premium <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

    </div>
  );
}
