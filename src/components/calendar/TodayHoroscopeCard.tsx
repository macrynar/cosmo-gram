"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { getMoonRhythm, type SkyEvent } from "@/lib/astro/layers";
import { SIGN_LOCATIVE } from "@/lib/i18n/astro";
import type { NatalChart } from "@/lib/astro-types";
import { useAuth } from "@/components/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Horoscope = {
  headline:   string;
  main:       string;
  reflection: string;
  weather: {
    intensity: number;
    element:   string;
    character: string;
  };
};

type Props = {
  chart:     NatalChart | null;
  isPremium: boolean;
  skyEvents: SkyEvent[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEEKDAY: Record<string, string> = {
  Monday: "Poniedziałek", Tuesday: "Wtorek", Wednesday: "Środa",
  Thursday: "Czwartek", Friday: "Piątek", Saturday: "Sobota", Sunday: "Niedziela",
};
const MONTH_LONG: Record<number, string> = {
  1:"stycznia",2:"lutego",3:"marca",4:"kwietnia",5:"maja",6:"czerwca",
  7:"lipca",8:"sierpnia",9:"września",10:"października",11:"listopada",12:"grudnia",
};

function formatDatePL(d: Date): { weekday: string; day: number; month: string } {
  const wdEN = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  return {
    weekday: WEEKDAY[wdEN] ?? wdEN,
    day:     d.getUTCDate(),
    month:   MONTH_LONG[d.getUTCMonth() + 1],
  };
}

const INTENSITY_LABELS = ["", "bardzo spokojny", "spokojny", "umiarkowany", "intensywny", "bardzo intensywny"];

function sessionKey(date: string) { return `today_horo_${date}`; }

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-5 rounded-full bg-white/8 w-3/4" />
      <div className="space-y-2">
        <div className="h-3 rounded-full bg-white/8 w-full" />
        <div className="h-3 rounded-full bg-white/8 w-5/6" />
        <div className="h-3 rounded-full bg-white/8 w-full" />
        <div className="h-3 rounded-full bg-white/8 w-4/6" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TodayHoroscopeCard({ chart, isPremium, skyEvents }: Props) {
  const { session } = useAuth();
  const today    = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const { weekday, day, month } = formatDatePL(new Date(todayISO + "T12:00:00Z"));

  const rhythm = useMemo(() => {
    if (!chart) return null;
    return getMoonRhythm(today, isPremium ? chart : undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart?.birthData?.date, isPremium]);

  const signLoc   = rhythm ? (SIGN_LOCATIVE[rhythm.sign] ?? rhythm.sign) : null;
  const houseText = isPremium && rhythm?.natalHouse ? ` · ${rhythm.natalHouse}. dom` : "";

  let signChangeText = "";
  if (rhythm?.nextSignChangeISO) {
    const diffH = Math.round((new Date(rhythm.nextSignChangeISO).getTime() - today.getTime()) / 3_600_000);
    if (diffH >= 0 && diffH < 24) {
      signChangeText = diffH < 1 ? "zmiana znaku za chwilę" : `zmiana znaku za ~${diffH}h`;
    }
  }

  const retroEvent = skyEvents.find(e => e.type === "retro_start" || e.type === "retro_end");

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const [horo,     setHoro]     = useState<Horoscope | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(sessionKey(todayISO));
    return raw ? (JSON.parse(raw) as Horoscope) : null;
  });
  const [checking, setChecking] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // Mount: check DB cache only (check_only=true), never auto-generate
  useEffect(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(sessionKey(todayISO)) : null;
    if (raw) { setHoro(JSON.parse(raw) as Horoscope); return; }
    if (!session || !isPremium) return;

    setHoro(null); setError("");
    setChecking(true);
    fetch(`/api/daily-personal-horoscope?date=${todayISO}&check_only=true`, { headers: authHeader })
      .then(async r => {
        if (r.ok) {
          const d = await r.json() as { headline: string | null };
          if (d.headline) {
            const full = d as unknown as Horoscope;
            setHoro(full);
            sessionStorage.setItem(sessionKey(todayISO), JSON.stringify(full));
          }
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayISO, session, isPremium]);

  async function handleGenerate() {
    if (!session || loading) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/daily-personal-horoscope?date=${todayISO}`, { headers: authHeader });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error((b as { error?: string }).error ?? "Błąd"); }
      const data = await res.json() as Horoscope;
      setHoro(data);
      sessionStorage.setItem(sessionKey(todayISO), JSON.stringify(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally { setLoading(false); }
  }

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden"
      style={{ border: "0.5px solid rgba(255,174,61,0.20)" }}
    >
      {/* ── Header ── */}
      <div
        className="px-5 py-4"
        style={{ background: "rgba(255,174,61,0.06)", borderBottom: "0.5px solid rgba(255,174,61,0.12)" }}
      >
        {/* Date */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-amber-400/60 uppercase tracking-widest mb-0.5">
              Horoskop dzienny
            </p>
            <h2 className="text-xl font-semibold text-white capitalize leading-tight">
              {weekday}, {day} {month}
            </h2>
          </div>
          {/* Weather badge — only when generated */}
          {horo?.weather && (
            <div
              className="flex flex-col items-end gap-0.5 shrink-0 pt-0.5"
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,174,61,0.12)", color: "#FFAE3D" }}
              >
                {horo.weather.character}
              </span>
              <span className="text-[10px] text-slate-500">
                {horo.weather.element} · {INTENSITY_LABELS[horo.weather.intensity]}
              </span>
            </div>
          )}
        </div>

        {/* Moon + sky context row */}
        {(signLoc || retroEvent) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2">
            {signLoc && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Moon className="w-3 h-3 text-slate-500" />
                Księżyc w <span className="text-slate-300 font-medium ml-0.5">{signLoc}{houseText}</span>
                {signChangeText && (
                  <span className="text-slate-600 ml-1">· {signChangeText}</span>
                )}
              </span>
            )}
            {retroEvent?.planet && (
              <span className="text-xs font-medium" style={{ color: "rgba(255,174,61,0.55)" }}>
                {retroEvent.planet} {retroEvent.type === "retro_start" ? "℞" : "D"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-5">
        {!isPremium ? (
          /* Free user */
          <div className="space-y-4">
            <p className="text-sm text-slate-400 leading-relaxed">
              Personalny horoskop na każdy dzień — interpretacja tranzytów dopasowana do Twojego kosmogramu.
            </p>
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, #FFAE3D 0%, #E0B566 100%)",
                color: "#07050f",
                boxShadow: "0 4px 20px rgba(255,174,61,0.25)",
              }}
            >
              <Lock className="w-4 h-4" />
              Odblokuj Premium
            </Link>
          </div>
        ) : checking ? (
          <Skeleton />
        ) : horo ? (
          /* Horoscope content */
          <AnimatePresence mode="wait">
            <motion.div
              key="horo-content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Headline */}
              <h3 className="text-base font-semibold text-white leading-snug">
                {horo.headline}
              </h3>

              {/* Main */}
              <div className="space-y-2.5">
                {horo.main.split(/\n\n?/).filter(Boolean).map((para, i) => (
                  <p key={i} className="text-sm text-slate-300 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>

              {/* Reflection */}
              <div
                className="rounded-xl px-4 py-3 mt-1"
                style={{ background: "rgba(255,174,61,0.05)", border: "0.5px solid rgba(255,174,61,0.15)" }}
              >
                <p className="text-xs font-semibold text-amber-400/60 uppercase tracking-wider mb-1">
                  Refleksja na dziś
                </p>
                <p className="text-sm text-slate-300 italic leading-relaxed">
                  {horo.reflection}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          /* Generate button */
          <div className="space-y-4">
            <p className="text-sm text-slate-400 leading-relaxed">
              Personalny horoskop na dziś — interpretacja Twoich tranzytów w ludzkim języku.
            </p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <motion.button
              onClick={handleGenerate}
              disabled={loading}
              whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{
                background: loading
                  ? "rgba(255,174,61,0.15)"
                  : "linear-gradient(135deg, #FFAE3D 0%, #E0B566 100%)",
                color: loading ? "#FFAE3D" : "#07050f",
                boxShadow: loading ? "none" : "0 4px 20px rgba(255,174,61,0.25)",
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,174,61,0.25)", borderTopColor: "#FFAE3D" }} />
                  <span style={{ color: "#FFAE3D" }}>Generuję horoskop…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Wygeneruj horoskop na dziś
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
