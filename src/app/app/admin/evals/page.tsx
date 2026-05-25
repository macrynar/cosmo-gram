"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { Loader2, PlayCircle } from "lucide-react";

type EvalRow = {
  id: string;
  reading_id: string;
  scores: Record<string, number>;
  reasoning: string;
  judge_model: string;
  evaluated_at: string;
  prompt_version_id: string;
};

export default function EvalsDashboard() {
  const { session } = useAuth();
  const [evals, setEvals] = useState<EvalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string>("");

  const load = async () => {
    if (!session) return;
    // Fetch via supabase directly isn't available client-side for admin tables, so we'd need another endpoint.
    // For now, use the admin-prompt endpoint to get an idea, and reading_evaluations can be added to admin-prompt GET.
    // Placeholder: show empty state with run button.
    setLoading(false);
    setEvals([]);
  };

  useEffect(() => { load(); }, [session]);

  const runEval = async () => {
    if (!session) return;
    setRunning(true);
    setRunResult("");
    try {
      const res = await fetch("/api/admin-eval-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ limit: 20 }),
      });
      const data = await res.json();
      if (data.debug_error) {
        setRunResult(`BŁĄD: ${data.debug_error}`);
      } else if (data.error) {
        setRunResult(`BŁĄD: ${data.error}`);
      } else {
        const parts = [`Ewaluowano: ${data.evaluated ?? 0} readings.`];
        if (data.debug_since) parts.push(`Okno: od ${data.debug_since}`);
        if (data.message) parts.push(data.message);
        if (data.avg_scores && Object.keys(data.avg_scores).length > 0) parts.push(`Avg: ${JSON.stringify(data.avg_scores)}`);
        if (data.errors?.length) parts.push(`Errors: ${data.errors.join(", ")}`);
        setRunResult(parts.join(" | "));
      }
    } catch (err) {
      setRunResult(`Błąd: ${String(err)}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Ewaluacje Claude-as-judge</h1>
        <button
          onClick={runEval}
          disabled={running}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-500 disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
          Uruchom eval (20 readings)
        </button>
      </div>

      {runResult && (
        <div className="mb-6 p-3 bg-slate-800 rounded-lg text-sm text-slate-300 font-mono">
          {runResult}
        </div>
      )}

      {loading ? (
        <div className="flex gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Ładowanie...</div>
      ) : (
        <div className="text-slate-500 text-sm">
          Kliknij "Uruchom eval" żeby ocenić ostatnie readingi. Wyniki zapisywane w tabeli reading_evaluations.
          <br /><br />
          <span className="text-slate-600">5 wymiarów: accuracy · engagement · specificity · no_jargon · grammar (1-5 każdy)</span>
        </div>
      )}
    </div>
  );
}
