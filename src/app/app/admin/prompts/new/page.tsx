"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { Loader2 } from "lucide-react";

const PROMPT_NAMES = [
  "ai-natal",
  "ai-daily",
  "ai-synastry",
  "ai-child",
  "ai-chat",
  "ai-cosmo-map-city",
];

const PLACEHOLDERS: Record<string, string> = {
  "ai-natal": "{{birth_data}}, {{grammatical_form}}, {{user_name}}",
  "ai-daily": "{{birth_data}}, {{grammatical_form}}, {{transit_supporting}}, {{transit_challenging}}, {{moon_phase}}, {{date}}",
  "ai-synastry": "{{person_a_data}}, {{person_b_data}}, {{scores}}",
  "ai-child": "{{birth_data}}, {{child_name}}, {{age_group}}",
  "ai-chat": "{{birth_data}}, {{message}}, {{history}}",
  "ai-cosmo-map-city": "{{city_name}}, {{active_lines}}, {{scenario_label}}",
};

export default function PromptNew() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    prompt_name: "ai-natal",
    version: "",
    system_prompt: "",
    user_prompt_template: "",
    config: '{"model":"deepseek-chat","temperature":0.7,"max_tokens":4000,"few_shot_count":0}',
    status: "draft",
    rollout_pct: 0,
    notes: "",
  });

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setError("");
    setLoading(true);

    let config: unknown;
    try { config = JSON.parse(form.config); } catch { setError("Config musi być poprawnym JSON"); setLoading(false); return; }

    const res = await fetch("/api/admin-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ...form, config }),
    });

    setLoading(false);
    if (res.ok) {
      router.push("/app/admin/prompts");
    } else {
      const err = await res.json();
      setError(err.error ?? "Błąd zapisu");
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-6">Nowy prompt</h1>
      {error && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Prompt name</label>
            <select
              value={form.prompt_name}
              onChange={(e) => set("prompt_name", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            >
              {PROMPT_NAMES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Wersja (np. v1.1)</label>
            <input
              required
              value={form.version}
              onChange={(e) => set("version", e.target.value)}
              placeholder="v1.1"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">System prompt</label>
          <textarea
            required
            rows={14}
            value={form.system_prompt}
            onChange={(e) => set("system_prompt", e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono resize-y"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            User prompt template
            <span className="ml-2 text-slate-600">Dostępne: {PLACEHOLDERS[form.prompt_name]}</span>
          </label>
          <textarea
            rows={6}
            value={form.user_prompt_template}
            onChange={(e) => set("user_prompt_template", e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono resize-y"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Config (JSON)</label>
          <textarea
            rows={4}
            value={form.config}
            onChange={(e) => set("config", e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono resize-y"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Rollout %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.rollout_pct}
              onChange={(e) => set("rollout_pct", parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notatki</label>
            <input
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-500 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Zapisz
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-slate-700 rounded-lg text-sm hover:bg-slate-800">
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
