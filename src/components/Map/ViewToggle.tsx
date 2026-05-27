"use client";

import { LayoutGrid, Map } from "lucide-react";

export type ViewMode = "places" | "map";

interface Props {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

export default function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/40">
      <button
        onClick={() => onChange("places")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          value === "places"
            ? "bg-amber-800/40 text-amber-200 border border-amber-600/40"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Lista
      </button>
      <button
        onClick={() => onChange("map")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          value === "map"
            ? "bg-amber-800/40 text-amber-200 border border-amber-600/40"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Map className="w-3.5 h-3.5" />
        Mapa
      </button>
    </div>
  );
}
