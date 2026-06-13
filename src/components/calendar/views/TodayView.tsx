"use client";

import { ArrowRight } from "lucide-react";
import TodayBar from "@/components/calendar/TodayBar";
import { ASPECT_LABEL_PL } from "@/lib/i18n/astro";
import type { NatalChart } from "@/lib/astro-types";
import type { TransitWindow, SkyEvent } from "@/lib/astro/layers";

const MONTH_SHORT: Record<number, string> = {
  1: "sty", 2: "lut", 3: "mar", 4: "kwi", 5: "maj", 6: "cze",
  7: "lip", 8: "sie", 9: "wrz", 10: "paź", 11: "lis", 12: "gru",
};

function formatPeak(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth() + 1]}`;
}

type Props = {
  chart:           NatalChart;
  isPremium:       boolean;
  todayWindow:     TransitWindow | null;
  skyEvents:       SkyEvent[];
  upcomingWindows: TransitWindow[];
  onWindowClick:   () => void;
};

export default function TodayView({
  chart, isPremium, todayWindow, skyEvents, upcomingWindows, onWindowClick,
}: Props) {
  return (
    <div className="space-y-4">
      <TodayBar
        chart={chart}
        isPremium={isPremium}
        activeWindow={todayWindow}
        skyEvents={skyEvents}
        onWindowClick={onWindowClick}
      />

      {isPremium && upcomingWindows.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Co przed Tobą
          </p>
          <div className="space-y-2">
            {upcomingWindows.map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div
                  className="w-1.5 h-8 rounded-full shrink-0"
                  style={{
                    background: w.favorable
                      ? "rgba(255,174,61,0.60)"
                      : "rgba(224,134,90,0.60)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium leading-snug truncate">
                    {w.transitPlanet} {ASPECT_LABEL_PL[w.aspectType] ?? w.aspectType} do{" "}
                    {w.natalPoint}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {w.character} · peak {formatPeak(w.peak)}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isPremium && (
        <div
          className="glass-card rounded-2xl p-5 text-center"
          style={{ border: "0.5px solid rgba(255,174,61,0.20)" }}
        >
          <p className="text-sm text-slate-300 mb-1 font-medium">
            Odblokuj prognozy okien i sezonów
          </p>
          <p className="text-xs text-slate-500">
            Aktywuj Premium, żeby zobaczyć nadchodzące tranzyty.
          </p>
        </div>
      )}
    </div>
  );
}
