"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";

type Props = {
  year:      number;
  readingId: string;
  isPremium: boolean;
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-5">
      <span
        className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{ borderColor: "rgba(212,175,55,0.25)", borderTopColor: "#D4AF37" }}
      />
    </div>
  );
}

export default function YearReadingCard({ year, readingId, isPremium }: Props) {
  const { session } = useAuth();
  const [content,  setContent]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [checking, setChecking] = useState(false);
  const [error,    setError]    = useState("");

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  // Check cache on mount (silent)
  useEffect(() => {
    setContent(null); setError("");
    if (!session || !isPremium) return;
    setChecking(true);
    fetch("/api/year-interpretation", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ year, reading_id: readingId }),
    })
      .then(async r => { if (r.ok) { const d = await r.json(); setContent(d.content); } })
      .catch(() => {})
      .finally(() => setChecking(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, readingId, session, isPremium]);

  async function handleGenerate() {
    if (!session || loading) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/year-interpretation", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ year, reading_id: readingId }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? "Błąd"); }
      const { content: c } = await res.json() as { content: string };
      setContent(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally { setLoading(false); }
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
        Odczyt roku {year}
      </p>

      {!isPremium ? (
        <div className="flex items-center gap-2 py-3">
          <Lock className="w-3.5 h-3.5 text-amber-600/50 shrink-0" />
          <p className="text-sm text-slate-500">
            Personalny odczyt roku dostępny w{" "}
            <a href="/pricing" className="text-amber-400 hover:text-amber-300 transition-colors">Premium</a>.
          </p>
        </div>
      ) : checking ? <Spinner /> :
        content ? (
          <p className="text-sm text-slate-300 leading-relaxed mt-2">{content}</p>
        ) : (
          <div className="space-y-2 mt-2">
            {error && <p className="text-xs text-red-400">{error}</p>}
            <motion.button
              onClick={handleGenerate}
              disabled={loading}
              whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: "rgba(5,4,14,0.90)", border: "0.5px solid rgba(212,175,55,0.45)", color: "#D4AF37" }}
            >
              {loading
                ? <><span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(212,175,55,0.25)", borderTopColor: "#D4AF37" }} />Generuję…</>
                : <><CosmoIcon className="w-4 h-4" />Odczytaj rok {year}</>}
            </motion.button>
          </div>
        )
      }
    </div>
  );
}
