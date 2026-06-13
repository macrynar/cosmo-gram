"use client";

import SeasonsCard from "@/components/calendar/SeasonsCard";
import YearReadingCard from "@/components/calendar/YearReadingCard";
import YearWheel from "@/components/calendar/YearWheel";
import type { Season } from "@/lib/astro/layers";
import type { NatalChart } from "@/lib/astro-types";

type Props = {
  seasons:   Season[];
  isPremium: boolean;
  readingId: string | null;
  year:      number;
  chart:     NatalChart | null;
  onDayClick?: (date: string) => void;
};

export default function YearView({ seasons, isPremium, readingId, year, chart, onDayClick }: Props) {
  return (
    <div className="space-y-4">
      {/* Year wheel */}
      {chart && (
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Koło roku {year}
          </p>
          <YearWheel
            year={year}
            seasons={seasons}
            chart={chart}
            isPremium={isPremium}
            onDayClick={onDayClick}
          />
        </div>
      )}

      {/* Seasons list */}
      {seasons.length > 0 ? (
        <SeasonsCard
          seasons={seasons}
          isPremium={isPremium}
          readingId={readingId}
          defaultExpanded
        />
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-slate-500 text-sm">Brak aktywnych sezonów.</p>
        </div>
      )}

      {/* Year reading card */}
      {readingId && (
        <YearReadingCard year={year} readingId={readingId} isPremium={isPremium} />
      )}
    </div>
  );
}
