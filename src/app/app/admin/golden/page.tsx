"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { Loader2, PlayCircle } from "lucide-react";

type GoldenChart = {
  id: string;
  name: string;
  description: string;
  prompt_names: string[];
  expected_traits: string[];
};

type PromptVersion = {
  id: string;
  prompt_name: string;
  version: string;
};

export default function GoldenTests() {
  const { session } = useAuth();
  const [charts, setCharts] = useState<GoldenChart[]>([]);
  const [prompts, setPrompts] = useState<PromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetch("/api/admin-prompt", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then((data: PromptVersion[]) => { setPrompts(data); setLoading(false); });
  }, [session]);

  const runSuite = async () => {
    if (!session || !selectedVersion) return;
    setRunning(true);
    setResult("");
    try {
      const res = await fetch("/api/admin-golden-test", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ prompt_version_id: selectedVersion }),
      });
      const data = await res.json();
      if (data.error) { setResult(`Błąd: ${data.error}`); return; }
      setResult(
        `Wyniki: ${data.passed}/${data.total} passed. ` +
        data.results?.map((r: { chart_name: string; passed: boolean }) => `${r.chart_name}: ${r.passed ? "✓" : "✗"}`).join(" | ")
      );
    } catch (err) {
      setResult(`Błąd: ${String(err)}`);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="flex gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Ładowanie...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Golden Test Suite</h1>

      <div className="flex items-end gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-xs text-slate-400 mb-1">Wersja do przetestowania</label>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— wybierz wersję —</option>
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>{p.prompt_name} · {p.version}</option>
            ))}
          </select>
        </div>
        <button
          onClick={runSuite}
          disabled={!selectedVersion || running}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-500 disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
          Uruchom suite
        </button>
      </div>

      {result && (
        <div className="mb-6 p-3 bg-slate-800 rounded-lg text-sm text-slate-300 font-mono leading-relaxed">
          {result}
        </div>
      )}

      <div className="text-sm text-slate-500">
        Suite testuje każdą wersję na golden chartach. Wyniki zapisywane w golden_test_runs.
        <br />Seed golden charts uruchom: <code className="text-amber-400">npx ts-node scripts/seed-golden-charts.ts</code>
      </div>
    </div>
  );
}
