"use client";

import SeasonsCard from "@/components/calendar/SeasonsCard";
import YearReadingCard from "@/components/calendar/YearReadingCard";
import type { Season } from "@/lib/astro/layers";

type Props = {
  seasons:   Season[];
  isPremium: boolean;
  readingId: string | null;
  year:      number;
};

export default function YearView({ seasons, isPremium, readingId, year }: Props) {
  return (
    <div className="space-y-4">
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

      {/* YearWheel placeholder — Faza 5 */}
      <div
        className="glass-card rounded-2xl p-6 flex items-center justify-center"
        style={{ minHeight: 180, border: "0.5px dashed rgba(255,174,61,0.15)" }}
      >
        <p className="text-xs text-slate-600">Koło roku — wkrótce</p>
      </div>
    </div>
  );
}
