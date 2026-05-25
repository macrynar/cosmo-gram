"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { Loader2 } from "lucide-react";

type PromptRow = {
  id: string;
  prompt_name: string;
  version: string;
  status: "draft" | "active" | "archived";
  rollout_pct: number;
  notes: string | null;
  created_at: string;
  stats: {
    readings_7d: number;
    thumbs_up: number;
    thumbs_total: number;
    avg_judge_score: number | null;
  };
};

export default function PromptsList() {
  const { session } = useAuth();
  const [rows, setRows] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!session) return;
    setLoading(true);
    const res = await fetch("/api/admin-prompt", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) { setError("Błąd ładowania"); setLoading(false); return; }
    setRows(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [session]);

  const updateStatus = async (id: string, status: string, rollout_pct?: number) => {
    if (!session) return;
    const update: Record<string, unknown> = { id, status };
    if (rollout_pct !== undefined) update.rollout_pct = rollout_pct;
    const res = await fetch("/api/admin-prompt", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(update),
    });
    if (res.ok) load();
    else {
      const err = await res.json();
      alert(err.error ?? "Błąd aktualizacji");
    }
  };

  const updateRollout = async (id: string, rollout_pct: number) => {
    if (!session) return;
    const res = await fetch("/api/admin-prompt", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id, rollout_pct }),
    });
    if (res.ok) load();
    else {
      const err = await res.json();
      alert(err.error ?? "Błąd (suma rollout musi być 0 lub 100)");
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Ładowanie...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  const STATUS_COLOR: Record<string, string> = {
    draft: "text-slate-400",
    active: "text-green-400",
    archived: "text-slate-600",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Prompty ({rows.length})</h1>
        <div className="flex gap-3">
          <Link href="/app/admin/prompts/compare" className="text-sm px-3 py-1.5 border border-slate-700 rounded-lg hover:bg-slate-800">Porównaj</Link>
          <Link href="/app/admin/prompts/new" className="text-sm px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-500">+ Nowy prompt</Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-left">
              <th className="pb-2 pr-4">Prompt</th>
              <th className="pb-2 pr-4">Wersja</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Rollout</th>
              <th className="pb-2 pr-4">Readings 7d</th>
              <th className="pb-2 pr-4">Thumbs</th>
              <th className="pb-2 pr-4">Judge</th>
              <th className="pb-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                <td className="py-2.5 pr-4 font-mono text-xs text-amber-300">{r.prompt_name}</td>
                <td className="py-2.5 pr-4 text-slate-300">{r.version}</td>
                <td className={`py-2.5 pr-4 font-medium ${STATUS_COLOR[r.status]}`}>{r.status}</td>
                <td className="py-2.5 pr-4">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={r.rollout_pct}
                    className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs"
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val !== r.rollout_pct) updateRollout(r.id, val);
                    }}
                  />
                  <span className="text-slate-500 ml-1">%</span>
                </td>
                <td className="py-2.5 pr-4 text-slate-300">{r.stats.readings_7d}</td>
                <td className="py-2.5 pr-4 text-slate-300">
                  {r.stats.thumbs_total > 0 ? `${r.stats.thumbs_up}/${r.stats.thumbs_total}` : "—"}
                </td>
                <td className="py-2.5 pr-4 text-slate-300">
                  {r.stats.avg_judge_score !== null ? r.stats.avg_judge_score.toFixed(1) : "—"}
                </td>
                <td className="py-2.5 flex gap-2 flex-wrap">
                  <Link href={`/app/admin/prompts/${r.id}/edit`} className="text-xs text-slate-400 hover:text-white">Edytuj</Link>
                  {r.status !== "active" && (
                    <button onClick={() => updateStatus(r.id, "active", 100)} className="text-xs text-green-400 hover:text-green-300">Aktywuj</button>
                  )}
                  {r.status === "active" && (
                    <button onClick={() => updateStatus(r.id, "archived")} className="text-xs text-slate-500 hover:text-slate-300">Archiwizuj</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
