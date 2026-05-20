"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Check, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Supabase processes the #access_token from the URL automatically.
  // Wait for the session to be established.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    // Also check existing session (in case already processed)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Hasła nie są zgodne."); return; }
    if (password.length < 8) { setError("Hasło musi mieć minimum 8 znaków."); return; }

    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/generate"), 2500);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#03010d] flex items-center justify-center px-4">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-800/50">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>
            Cosmo<span className="text-violet-400">-gram</span>
          </span>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0d0818]/95 backdrop-blur-xl p-7 shadow-2xl shadow-purple-950/50">
          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-900/30 border border-green-700/30 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-white font-semibold mb-1" style={{ fontFamily: "'Cinzel', serif" }}>Hasło zmienione</h2>
              <p className="text-slate-500 text-sm">Przekierowuję do aplikacji…</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
                Ustaw nowe hasło
              </h2>
              <p className="text-slate-500 text-xs mb-6">Minimum 8 znaków.</p>

              {!ready ? (
                <div className="flex items-center justify-center gap-2 text-slate-500 py-8">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Weryfikuję link…</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Nowe hasło"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:bg-violet-900/10 transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Powtórz hasło"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:bg-violet-900/10 transition-colors"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-1"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Zapisz nowe hasło
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
