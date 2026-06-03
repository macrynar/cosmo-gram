"use client";

export type CalendarFilter = "all" | "love" | "career" | "energy" | "mind";

const FILTERS: { id: CalendarFilter; label: string; activeColor: string }[] = [
  { id: "all",    label: "Wszystkie",           activeColor: "bg-amber-700/80 border-amber-500/50 text-white" },
  { id: "love",   label: "💞 Miłość",           activeColor: "bg-rose-700/70 border-rose-500/50 text-white" },
  { id: "career", label: "💼 Kariera",          activeColor: "bg-amber-700/70 border-amber-500/50 text-white" },
  { id: "energy", label: "⚡ Energia",          activeColor: "bg-orange-700/70 border-orange-500/50 text-white" },
  { id: "mind",   label: "🧠 Komunikacja",      activeColor: "bg-teal-700/70 border-teal-500/50 text-white" },
];

type Props = { active: CalendarFilter; onChange: (f: CalendarFilter) => void };

export default function IntentionFilter({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {FILTERS.map(({ id, label, activeColor }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
            active === id
              ? activeColor
              : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
