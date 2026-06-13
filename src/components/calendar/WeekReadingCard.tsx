"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";

type Props = {
  weekStart:  string;   // ISO Monday
  readingId:  string;
  isPremium:  boolean;
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <span
        className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{ borderColor: "rgba(255,174,61,0.20)", borderTopColor: "#FFAE3D" }}
      />
    </div>
  );
}

export default function WeekReadingCard({ weekStart, readingId, isPremium }: Props) {
  const { session } = useAuth();
  const [content,  setContent]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [checking, setChecking] = useState(false);
  const [error,    setError]    = useState("");

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  useEffect(() => {
    setContent(null); setError("");
    if (!session || !isPremium) return;
    setChecking(true);
    fetch("/api/week-interpretation", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ week_start: weekStart, reading_id: readingId }),
    })
      .then(async r => { if (r.ok) { const d = await r.json(); setContent(d.content); } })
      .catch(() => {})
      .finally(() => setChecking(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, readingId, session, isPremium]);

  async function handleGenerate() {
    if (!session || loading) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/week-interpretation", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ week_start: weekStart, reading_id: readingId }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? "Błąd"); }
      const { content: c } = await res.json() as { content: string };
      setContent(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally { setLoading(false); }
  }

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden"
      style={{ border: "0.5px solid rgba(255,174,61,0.15)" }}
    >
      {/* Header stripe */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: "rgba(255,174,61,0.07)", borderBottom: "0.5px solid rgba(255,174,61,0.12)" }}
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
        <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">
          Prognoza tygodnia
        </p>
      </div>

      <div className="p-4">
        {!isPremium ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 leading-relaxed">
              Personalna interpretacja tranzytów na ten tydzień — co sprzyja, co wymaga uwagi.
            </p>
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(255,174,61,0.18) 0%, rgba(224,181,102,0.12) 100%)",
                border: "0.5px solid rgba(255,174,61,0.35)",
                color: "#FFAE3D",
              }}
            >
              <Lock className="w-3.5 h-3.5" />
              Odblokuj w Premium
            </Link>
          </div>
        ) : checking ? <Spinner /> :
          content ? (
            <p className="text-sm text-slate-200 leading-relaxed">{content}</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-400 leading-relaxed">
                Personalna interpretacja tranzytów na ten tydzień — co sprzyja, co wymaga uwagi.
              </p>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <motion.button
                onClick={handleGenerate}
                disabled={loading}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{
                  background: loading
                    ? "rgba(255,174,61,0.15)"
                    : "linear-gradient(135deg, #FFAE3D 0%, #E0B566 100%)",
                  color: loading ? "#FFAE3D" : "#07050f",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(255,174,61,0.25)",
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,174,61,0.25)", borderTopColor: "#FFAE3D" }} />
                    <span style={{ color: "#FFAE3D" }}>Generuję…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Wygeneruj prognozę tygodnia
                  </>
                )}
              </motion.button>
            </div>
          )
        }
      </div>
    </div>
  );
}
