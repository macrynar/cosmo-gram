"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { Loader2 } from "lucide-react";

type PromptRow = {
  id: string;
  prompt_name: string;
  version: string;
  status: string;
  stats: {
    readings_7d: number;
    thumbs_up: number;
    thumbs_total: number;
    avg_judge_score: number | null;
  };
};

function StatBlock({ row }: { row: PromptRow }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="text-xs text-slate-500 font-mono">{row.prompt_name} · {row.version} · {row.status}</div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Readings 7d</div>
          <div className="text-white font-bold text-lg">{row.stats.readings_7d}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Thumbs</div>
          <div className="text-white font-bold text-lg">
            {row.stats.thumbs_total > 0
              ? `${Math.round((row.stats.thumbs_up / row.stats.thumbs_total) * 100)}%`
              : "—"}
          </div>
          <div className="text-slate-500 text-xs">{row.stats.thumbs_up}/{row.stats.thumbs_total}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 col-span-2">
          <div className="text-slate-400 text-xs mb-1">Avg judge score</div>
          <div className="text-white font-bold text-lg">{row.stats.avg_judge_score?.toFixed(1) ?? "—"} / 5</div>
        </div>
      </div>
    </div>
  );
}

export default function PromptCompare() {
  const { session } = useAuth();
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetch("/api/admin-prompt", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then((data) => { setPrompts(data); setLoading(false); });
  }, [session]);

  const a = prompts.find((p) => p.id === idA);
  const b = prompts.find((p) => p.id === idB);

  if (loading) return <div className="flex gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Ładowanie...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Porównanie wersji</h1>
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <label className="block text-xs text-slate-400 mb-2">Wersja A</label>
          <select
            value={idA}
            onChange={(e) => setIdA(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— wybierz —</option>
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>{p.prompt_name} · {p.version}</option>
            ))}
          </select>
          {a && <div className="mt-4"><StatBlock row={a} /></div>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-2">Wersja B</label>
          <select
            value={idB}
            onChange={(e) => setIdB(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— wybierz —</option>
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>{p.prompt_name} · {p.version}</option>
            ))}
          </select>
          {b && <div className="mt-4"><StatBlock row={b} /></div>}
        </div>
      </div>
    </div>
  );
}
