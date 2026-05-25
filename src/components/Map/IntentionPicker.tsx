"use client";

import type { Intention } from "@/lib/astrocartography";

const INTENTIONS: Array<{
  id: Intention;
  label: string;
  emoji: string;
  description: string;
  activeClass: string;
}> = [
  {
    id: "love",
    label: "Miłość",
    emoji: "♀",
    description: "Wenus i Księżyc",
    activeClass: "border-pink-500/60 bg-pink-900/20 text-pink-200",
  },
  {
    id: "career",
    label: "Kariera",
    emoji: "☉",
    description: "Słońce, Jowisz, Mars",
    activeClass: "border-amber-500/60 bg-amber-900/20 text-amber-200",
  },
  {
    id: "peace",
    label: "Spokój",
    emoji: "☽",
    description: "Księżyc, Saturn, Neptun",
    activeClass: "border-violet-500/60 bg-violet-900/20 text-violet-200",
  },
];

interface Props {
  selected: Intention | null;
  onChange: (intention: Intention | null) => void;
}

export default function IntentionPicker({ selected, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {INTENTIONS.map((item) => {
        const isActive = selected === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(isActive ? null : item.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
              isActive
                ? item.activeClass
                : "border-amber-900/30 bg-amber-900/10 text-slate-400 hover:border-amber-700/40 hover:text-slate-200"
            }`}
          >
            <span className="text-base leading-none">{item.emoji}</span>
            <span>{item.label}</span>
            {isActive && (
              <span className="text-[10px] opacity-70 hidden sm:inline">{item.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
