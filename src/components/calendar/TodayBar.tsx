"use client";

import { useEffect, useMemo } from "react";
import { Moon } from "lucide-react";
import { getMoonRhythm, moonRhythmSentence, type TransitWindow, type SkyEvent } from "@/lib/astro/layers";
import { SIGN_LOCATIVE } from "@/lib/i18n/astro";
import type { NatalChart } from "@/lib/astro-types";

const MONTH_SHORT: Record<number, string> = {
  1: "sty", 2: "lut", 3: "mar", 4: "kwi", 5: "maj", 6: "cze",
  7: "lip", 8: "sie", 9: "wrz", 10: "paź", 11: "lis", 12: "gru",
};

type Props = {
  chart:        NatalChart | null;
  isPremium:    boolean;
  activeWindow: TransitWindow | null;   // fast window active today
  skyEvents:    SkyEvent[];             // events active/starting today
  onWindowClick?: () => void;
};

export default function TodayBar({ chart, isPremium, activeWindow, skyEvents, onWindowClick }: Props) {
  const now = new Date();

  const rhythm = useMemo(() => {
    if (!chart) return null;
    return getMoonRhythm(now, isPremium ? chart : undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart?.birthData?.date, isPremium]);

  useEffect(() => {
    if (!chart) return;
    import("posthog-js").then(({ default: ph }) =>
      ph?.capture("today_bar_viewed", {
        moon_sign: rhythm?.sign,
        has_active_window: !!activeWindow,
        has_retro: skyEvents.some(e => e.type === "retro_start" || e.type === "retro_end"),
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart?.birthData?.date]);

  if (!chart || !rhythm) return null;

  const signLoc   = SIGN_LOCATIVE[rhythm.sign] ?? rhythm.sign;
  const houseText = isPremium && rhythm.natalHouse
    ? ` · ${rhythm.natalHouse}. dom`
    : "";

  const sentence  = moonRhythmSentence(rhythm);

  // Next sign change time (display in locale — no tz conversion, UTC approx)
  let signChangeText = "";
  if (rhythm.nextSignChangeISO) {
    const changeDate = new Date(rhythm.nextSignChangeISO);
    const diffH = Math.round((changeDate.getTime() - now.getTime()) / 3_600_000);
    if (diffH >= 0 && diffH < 48) {
      signChangeText = diffH < 1
        ? " · zmiana znaku za chwilę"
        : ` · zmiana znaku za ~${diffH}h`;
    }
  }

  // Active retrograde event (if any)
  const retroEvent = skyEvents.find(e => e.type === "retro_start" || e.type === "retro_end");
  const retroText  = retroEvent?.planet
    ? ` · ${retroEvent.planet} ${retroEvent.type === "retro_start" ? "℞" : "D"}`
    : "";

  // Active window mention
  const windowText = activeWindow
    ? ` · aktywne okno: ${activeWindow.transitPlanet}`
    : "";

  const today = now;
  const dayStr = today.getDate();
  const monStr = MONTH_SHORT[today.getMonth() + 1];
  const weekday = today.toLocaleDateString("pl-PL", { weekday: "long" });

  return (
    <div
      className="glass-card rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1"
      style={{ borderColor: "rgba(148,163,184,0.10)" }}
    >
      {/* Date */}
      <span className="text-sm font-semibold text-white capitalize">
        {weekday}, {dayStr} {monStr}
      </span>

      <span className="text-slate-600 text-xs">·</span>

      {/* Moon */}
      <span className="flex items-center gap-1 text-sm text-slate-300">
        <Moon className="w-3.5 h-3.5 text-indigo-400" />
        Księżyc w <span className="text-indigo-300 font-medium ml-0.5">{signLoc}{houseText}</span>
        {signChangeText && <span className="text-slate-500 text-xs">{signChangeText}</span>}
      </span>

      <span className="text-slate-600 text-xs">·</span>

      {/* Rhythm sentence */}
      <span className="text-xs text-slate-400 flex-1 min-w-0">{sentence}</span>

      {/* Active window/retro */}
      {(activeWindow || retroEvent) && (
        <span className="text-xs text-slate-500 shrink-0">
          {retroEvent ? (
            <span className="text-amber-400/70">{retroText.replace(" · ", "")}</span>
          ) : activeWindow ? (
            <button
              onClick={onWindowClick}
              className="text-amber-400/70 hover:text-amber-300 transition-colors underline-offset-2 hover:underline"
            >
              {windowText.replace(" · ", "")}
            </button>
          ) : null}
        </span>
      )}
    </div>
  );
}
