"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";

type Row = { key: string; cost: number; calls: number };
type CostData = {
  generatedAt: string;
  totals: {
    cost7d: number; cost30d: number; calls7d: number; calls30d: number;
    payers: number; costPerPayer7d: number | null;
  };
  byTask: Row[];
  byModel: Row[];
  topUsers: Row[];
  note: string | null;
};

const usd = (n: number) => `$${n.toFixed(2)}`;

export default function AiCostPage() {
  const { session } = useAuth();
  const [data, setData] = useState<CostData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch("/api/admin-ai-cost", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? `HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [session]);

  if (error) return <p className="text-red-400 text-sm">Błąd: {error}</p>;
  if (!data) return <p className="text-slate-500 text-sm">Ładowanie…</p>;

  const t = data.totals;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-white mb-1">Koszt AI</h1>
        <p className="text-xs text-slate-500">
          Z ai_call_logs, cennik modeli (aiCosts.ts). Wygenerowano {new Date(data.generatedAt).toLocaleString("pl-PL")}.
        </p>
        {data.note && <p className="text-xs text-amber-400 mt-1">{data.note}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Koszt 7 dni" value={usd(t.cost7d)} sub={`${t.calls7d} wywołań`} />
        <Stat label="Koszt 30 dni" value={usd(t.cost30d)} sub={`${t.calls30d} wywołań`} />
        <Stat label="Aktywni płatnicy" value={String(t.payers)} sub="active + trialing" />
        <Stat
          label="Koszt / płatnik (7d)"
          value={t.costPerPayer7d != null ? usd(t.costPerPayer7d) : "—"}
          sub="tydzień"
        />
      </div>

      <Table title="Koszt wg zadania (30d)" rows={data.byTask} keyLabel="Zadanie" />
      <Table title="Koszt wg modelu (30d)" rows={data.byModel} keyLabel="Model" />
      <Table title="Top 20 userów wg kosztu (30d)" rows={data.topUsers} keyLabel="user_id" />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0a0814] p-4">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-white mt-1">{value}</p>
      <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>
    </div>
  );
}

function Table({ title, rows, keyLabel }: { title: string; rows: Row[]; keyLabel: string }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-slate-300 mb-2">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-600">Brak danych.</p>
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0814] text-slate-500 text-xs">
              <tr>
                <th className="text-left font-normal px-4 py-2">{keyLabel}</th>
                <th className="text-right font-normal px-4 py-2">Koszt</th>
                <th className="text-right font-normal px-4 py-2">Wywołań</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-slate-800/60">
                  <td className="px-4 py-2 text-slate-300 font-mono text-xs truncate max-w-[280px]">{r.key}</td>
                  <td className="px-4 py-2 text-right text-white">{usd(r.cost)}</td>
                  <td className="px-4 py-2 text-right text-slate-400">{r.calls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
