"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { Loader2, PlayCircle } from "lucide-react";

type RunResult = {
  evaluated: number;
  avg_scores?: Record<string, number>;
  errors?: string[];
  message?: string;
  debug_error?: string;
  error?: string;
};

const DIM_LABELS: Record<string, string> = {
  accuracy: "Accuracy",
  engagement: "Engagement",
  specificity: "Specificity",
  no_jargon: "No Jargon",
  grammar: "Grammar",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = ((value - 1) / 4) * 100;
  const color = value >= 4 ? "bg-green-500" : value >= 3 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-24 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-300 w-6 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

export default function EvalsDashboard() {
  const { session } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  useEffect(() => {}, [session]);

  const runEval = async () => {
    if (!session) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin-eval-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ limit: 20 }),
      });
      setResult(await res.json());
    } catch (err) {
      setResult({ evaluated: 0, error: String(err) });
    } finally {
      setRunning(false);
    }
  };

  const scores = result?.avg_scores;
  const hasError = result?.debug_error || result?.error;

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

      {result && (
        <div className="mb-6 space-y-4">
          {hasError ? (
            <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-sm">
              {result.debug_error ?? result.error}
            </div>
          ) : (
            <>
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Oceniono w tej sesji</div>
                <div className="text-2xl font-bold">{result.evaluated} <span className="text-slate-500 text-base font-normal">readingów</span></div>
                {result.message && <div className="text-xs text-slate-500 mt-1">{result.message}</div>}
              </div>

              {scores && Object.keys(scores).length > 0 && (
                <div className="p-4 bg-slate-800 rounded-lg space-y-2">
                  <div className="text-sm text-slate-400 mb-3">Średnie oceny (skala 1–5)</div>
                  {Object.entries(scores).map(([dim, val]) => (
                    <ScoreBar key={dim} label={DIM_LABELS[dim] ?? dim} value={Math.round(val * 10) / 10} />
                  ))}
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg">
                  <div className="text-xs text-slate-500 mb-2">Błędy ({result.errors.length})</div>
                  <ul className="space-y-1">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-400 font-mono break-all">{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!result && (
        <div className="text-slate-500 text-sm">
          Kliknij "Uruchom eval" żeby ocenić ostatnie readingi. Wyniki zapisywane w tabeli reading_evaluations.
          <br /><br />
          <span className="text-slate-600">5 wymiarów: accuracy · engagement · specificity · no_jargon · grammar (1-5 każdy)</span>
        </div>
      )}
    </div>
  );
}
