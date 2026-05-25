"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { Loader2, Plus } from "lucide-react";

const PROMPT_NAMES = ["ai-natal", "ai-daily", "ai-synastry", "ai-child", "ai-chat", "ai-cosmo-map-city"];

export default function FewShotLibrary() {
  const { session } = useAuth();
  const [form, setForm] = useState({
    prompt_name: "ai-natal",
    input_data: "{}",
    output_markdown: "",
    quality_score: 5,
    tags: "",
    source_reading_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setError("");
    setSaving(true);

    let inputData: unknown;
    try { inputData = JSON.parse(form.input_data); } catch { setError("input_data musi być poprawnym JSON"); setSaving(false); return; }

    const res = await fetch("/api/admin-few-shot", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        prompt_name: form.prompt_name,
        input_data: inputData,
        output_markdown: form.output_markdown,
        quality_score: form.quality_score,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        source_reading_id: form.source_reading_id || null,
        active: true,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setForm((f) => ({ ...f, output_markdown: "", input_data: "{}", source_reading_id: "" }));
      setTimeout(() => setSaved(false), 3000);
    } else {
      const err = await res.json();
      setError(err.error ?? "Błąd zapisu");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Few-shot Library</h1>
      <p className="text-sm text-slate-500 mb-6">
        Dodaj wzorcowe interpretacje jako few-shot examples. AI użyje ich gdy{" "}
        <code className="text-amber-400">config.few_shot_count &gt; 0</code> dla danej wersji.
      </p>

      {error && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>}
      {saved && <div className="mb-4 p-3 bg-green-950/50 border border-green-800 rounded-lg text-green-300 text-sm">Exemplar zapisany ✓</div>}

      <form onSubmit={handleAdd} className="space-y-4">
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
            <label className="block text-xs text-slate-400 mb-1">Jakość (1-5)</label>
            <input
              type="number" min={1} max={5}
              value={form.quality_score}
              onChange={(e) => set("quality_score", parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Input data (JSON — to co idzie do AI)</label>
          <textarea
            rows={4}
            value={form.input_data}
            onChange={(e) => set("input_data", e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Wzorcowy output (pełna interpretacja)</label>
          <textarea
            required rows={12}
            value={form.output_markdown}
            onChange={(e) => set("output_markdown", e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm resize-y"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tagi (oddzielone przecinkami)</label>
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="saturn-heavy, mars-dominant"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Source reading ID (opcjonalnie)</label>
            <input
              value={form.source_reading_id}
              onChange={(e) => set("source_reading_id", e.target.value)}
              placeholder="UUID readingu"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-500 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Dodaj exemplar
        </button>
      </form>
    </div>
  );
}
