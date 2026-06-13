"use client";

import Link from "next/link";
import TodayBar from "@/components/calendar/TodayBar";
import WhenBest from "@/components/calendar/WhenBest";
import { ASPECT_LABEL_PL } from "@/lib/i18n/astro";
import { DOMAIN_META, windowToDomain } from "@/lib/astro/domains";
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
    <div className="space-y-3">

      {/* Today bar */}
      <TodayBar
        chart={chart}
        isPremium={isPremium}
        activeWindow={todayWindow}
        skyEvents={skyEvents}
        onWindowClick={onWindowClick}
      />

      {/* Kiedy najlepiej */}
      <WhenBest chart={chart} isPremium={isPremium} />

      {/* Co przed Tobą — premium only */}
      {isPremium && upcomingWindows.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Nadchodzące
          </p>
          <div className="divide-y divide-white/5">
            {upcomingWindows.map((w, i) => {
              const domain = windowToDomain(w);
              const color  = domain ? DOMAIN_META[domain].color : (w.favorable ? "#E0B566" : "#E07055");
              return (
                <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {/* Color accent */}
                  <div
                    className="w-1 h-10 rounded-full shrink-0"
                    style={{ background: color, opacity: w.favorable ? 0.7 : 0.45 }}
                  />
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium leading-snug">
                      {w.transitPlanet}{" "}
                      <span className="text-slate-400 font-normal">
                        {ASPECT_LABEL_PL[w.aspectType] ?? w.aspectType} do
                      </span>{" "}
                      {w.natalPoint}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: `${color}99` }}>
                      {w.character === "wspierające" ? "sprzyja" : "napięcie"} · peak {formatPeak(w.peak)}
                    </p>
                  </div>
                  {/* Peak badge */}
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      background: `${color}15`,
                      color,
                      border: `0.5px solid ${color}30`,
                    }}
                  >
                    {formatPeak(w.peak)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Free upsell — only if no premium content visible */}
      {!isPremium && (
        <Link
          href="/pricing"
          className="block glass-card rounded-2xl p-5 text-center transition-colors hover:bg-white/5"
          style={{ border: "0.5px solid rgba(255,174,61,0.20)" }}
        >
          <p className="text-sm text-slate-300 mb-1 font-medium">
            Odblokuj prognozy okien i sezonów
          </p>
          <p className="text-xs text-slate-500">
            Aktywuj Premium →
          </p>
        </Link>
      )}
    </div>
  );
}
