"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { Loader2 } from "lucide-react";

export default function PromptEdit() {
  const { session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    system_prompt: "",
    user_prompt_template: "",
    config: "{}",
    status: "draft",
    rollout_pct: 0,
    notes: "",
  });
  const [meta, setMeta] = useState({ prompt_name: "", version: "" });

  useEffect(() => {
    if (!session || !id) return;
    fetch(`/api/admin-prompt?id=${id}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then((data) => {
        setMeta({ prompt_name: data.prompt_name, version: data.version });
        setForm({
          system_prompt: data.system_prompt ?? "",
          user_prompt_template: data.user_prompt_template ?? "",
          config: JSON.stringify(data.config ?? {}, null, 2),
          status: data.status ?? "draft",
          rollout_pct: data.rollout_pct ?? 0,
          notes: data.notes ?? "",
        });
        setLoading(false);
      })
      .catch(() => { setError("Nie można załadować"); setLoading(false); });
  }, [session, id]);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setError("");
    setSaving(true);

    let config: unknown;
    try { config = JSON.parse(form.config); } catch { setError("Config musi być poprawnym JSON"); setSaving(false); return; }

    const res = await fetch("/api/admin-prompt", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id, ...form, config }),
    });

    setSaving(false);
    if (res.ok) router.push("/app/admin/prompts");
    else {
      const err = await res.json();
      setError(err.error ?? "Błąd zapisu");
    }
  };

  if (loading) return <div className="flex gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Ładowanie...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-1">Edycja promptu</h1>
      <p className="text-sm text-slate-500 mb-6 font-mono">{meta.prompt_name} · {meta.version}</p>
      {error && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">System prompt</label>
          <textarea
            required rows={16}
            value={form.system_prompt}
            onChange={(e) => set("system_prompt", e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono resize-y"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">User prompt template</label>
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
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono"
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
              type="number" min={0} max={100}
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
            type="submit" disabled={saving}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-500 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
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
