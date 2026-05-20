"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  onClose: () => void;
};

export default function AuthModal({ onClose }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "register") {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
      } else {
        setInfo("Sprawdź skrzynkę email — wysłaliśmy link potwierdzający.");
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError("Nieprawidłowy email lub hasło.");
      } else {
        onClose();
      }
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-purple-800/40 bg-[#0d0818] p-7 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-white font-semibold text-lg" style={{ fontFamily: "'Cinzel', serif" }}>
            {mode === "login" ? "Zaloguj się" : "Załóż konto"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl bg-purple-950/30 border border-purple-800/30 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60"
              placeholder="twoj@email.com"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Hasło</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl bg-purple-950/30 border border-purple-800/30 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60"
              placeholder="min. 6 znaków"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          {info && (
            <p className="text-green-400 text-xs">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {loading ? "Ładowanie…" : mode === "login" ? "Zaloguj się" : "Zarejestruj się"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          {mode === "login" ? "Nie masz konta?" : "Masz już konto?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setInfo(""); }}
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            {mode === "login" ? "Zarejestruj się" : "Zaloguj się"}
          </button>
        </p>
      </div>
    </div>
  );
}
