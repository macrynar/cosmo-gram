"use client";

import type { Scenario } from "@/lib/travelScenarios";
import { SCENARIOS } from "@/lib/travelScenarios";

interface Props {
  selected: Scenario;
  onChange: (s: Scenario) => void;
}

export default function ScenarioPicker({ selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5 md:flex-wrap md:overflow-visible">
      {SCENARIOS.map((s) => {
        const isActive = selected.id === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onChange(s)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200 shrink-0 ${
              isActive
                ? "border-amber-500/60 bg-amber-900/25 text-amber-200"
                : "border-amber-900/30 bg-amber-900/8 text-slate-400 hover:border-amber-700/40 hover:text-slate-200"
            }`}
          >
            <span className="text-base leading-none">{s.emoji}</span>
            <span className="whitespace-nowrap">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
