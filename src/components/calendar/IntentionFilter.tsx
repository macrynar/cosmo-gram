"use client";

export type CalendarFilter = "all" | "love" | "career" | "peace";

const FILTERS: { id: CalendarFilter; label: string }[] = [
  { id: "all",    label: "Wszystkie" },
  { id: "love",   label: "💞 Miłość" },
  { id: "career", label: "🌟 Kariera" },
  { id: "peace",  label: "🕊 Spokój" },
];

type Props = { active: CalendarFilter; onChange: (f: CalendarFilter) => void };

export default function IntentionFilter({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {FILTERS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            active === id
              ? "bg-amber-700/80 text-white border border-amber-500/50"
              : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
