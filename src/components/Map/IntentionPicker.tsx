"use client";

import { INTENTIONS, type IntentionId } from "@/lib/intentions";

interface Props {
  value: IntentionId;
  onChange: (id: IntentionId) => void;
}

export default function IntentionPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
      {INTENTIONS.map((intention) => (
        <button
          key={intention.id}
          onClick={() => onChange(intention.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm whitespace-nowrap font-medium transition-all shrink-0 border ${
            value === intention.id
              ? "bg-amber-800/40 text-amber-100 border-amber-600/50"
              : "text-slate-400 border-slate-700/40 hover:text-slate-200 hover:border-slate-600/60"
          }`}
        >
          <span>{intention.emoji}</span>
          <span>{intention.label}</span>
        </button>
      ))}
    </div>
  );
}
