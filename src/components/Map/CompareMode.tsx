"use client";

import { useState } from "react";
import { Users, X } from "lucide-react";

interface LibraryProfile {
  id: string;
  name: string;
  birth_date: string;
}

interface Props {
  profiles: LibraryProfile[];
  selectedProfileId: string | null;
  onSelect: (profileId: string | null) => void;
  loading: boolean;
}

export default function CompareMode({ profiles, selectedProfileId, onSelect, loading }: Props) {
  const [open, setOpen] = useState(false);
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  if (selectedProfile) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-900/15 border border-amber-700/30 text-sm">
        <Users className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-amber-200 font-medium">{selectedProfile.name}</span>
        {loading && <span className="text-xs text-slate-500">Obliczam…</span>}
        <button
          onClick={() => onSelect(null)}
          className="ml-auto text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 border border-amber-900/20 hover:border-amber-700/40 hover:text-slate-200 transition-all"
      >
        <Users className="w-3.5 h-3.5" />
        Tryb porównania
      </button>

      {open && profiles.length > 0 && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] rounded-xl border border-amber-900/30 bg-[#0b0719]/95 backdrop-blur shadow-xl z-40 overflow-hidden">
          <div className="px-3 py-2 text-[11px] text-slate-500 border-b border-amber-900/20">
            Wybierz profil do porównania
          </div>
          {profiles.map((p) => (
            <button
              key={p.id}
              onMouseDown={() => { onSelect(p.id); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-amber-900/20 hover:text-white transition-colors border-b border-amber-900/10 last:border-0"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-slate-500 text-xs ml-2">{p.birth_date}</span>
            </button>
          ))}
        </div>
      )}

      {open && profiles.length === 0 && (
        <div className="absolute top-full left-0 mt-1 rounded-xl border border-amber-900/30 bg-[#0b0719]/95 backdrop-blur shadow-xl z-40 p-3 text-xs text-slate-500 min-w-[180px]">
          Brak profili w bibliotece.
        </div>
      )}
    </div>
  );
}
