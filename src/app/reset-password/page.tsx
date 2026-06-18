"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const LOCK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#877FA0", pointerEvents: "none" }}>
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady]       = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  useEffect(() => {
    // Register listener FIRST so we don't miss events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });

    async function resolveSession() {
      // 1. Check existing session (covers page refresh after token exchange)
      const { data } = await supabase.auth.getSession();
      if (data.session) { setReady(true); return; }

      // 2. Parse hash fragment — Supabase implicit flow puts tokens here
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken  = hash.get("access_token");
      const refreshToken = hash.get("refresh_token") ?? "";
      if (accessToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error) { setReady(true); return; }
      }

      // 3. PKCE flow — code in query string
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) { setReady(true); return; }
      }
    }

    resolveSession();
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Hasła nie są zgodne."); return; }
    if (password.length < 8)  { setError("Hasło musi mieć minimum 8 znaków."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError("Nie udało się zmienić hasła. Spróbuj ponownie lub poproś o nowy link.");
    } else {
      setDone(true);
      setTimeout(() => router.push("/app/cosmogram"), 2500);
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    paddingLeft: 40,
    paddingRight: 14,
    paddingTop: 11,
    paddingBottom: 11,
    background: "rgba(255,255,255,.04)",
    border: "1px solid #2B2540",
    borderRadius: 12,
    color: "#F4F1EA",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0B0912",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 16px",
      fontFamily: "'General Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, textDecoration: "none", color: "#F4F1EA", marginBottom: 32 }}>
          <svg width="28" height="28" viewBox="0 0 120 120" aria-hidden="true">
            <g transform="translate(55,60)" fill="#F4F1EA" stroke="#F4F1EA" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
              <path d="M 28.79,-40.86 A 50,50 0 1,0 28.79,40.86 A 40,40 0 1,1 28.79,-40.86 Z" />
              <circle cx="10" cy="0" r="9" stroke="none" />
            </g>
          </svg>
          <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em" }}>cosmogram</span>
        </Link>

        {/* Card */}
        <div style={{
          background: "#14101F",
          border: "1px solid #2B2540",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 24px 60px rgba(0,0,0,.55)",
        }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(224,181,102,.10)",
                border: "1px solid rgba(224,181,102,.28)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 18px",
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#E0B566" strokeWidth={2} style={{ width: 22, height: 22 }}>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "var(--font-fraunces),'Fraunces',serif", fontWeight: 500, fontSize: 22, color: "#F4F1EA", marginBottom: 8 }}>
                Hasło zmienione
              </h2>
              <p style={{ color: "#877FA0", fontSize: 14, lineHeight: 1.6 }}>
                Przekierowuję do aplikacji…
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: "var(--font-fraunces),'Fraunces',serif", fontWeight: 500, fontSize: 22, color: "#F4F1EA", marginBottom: 6 }}>
                Ustaw nowe hasło
              </h2>
              <p style={{ color: "#877FA0", fontSize: 13.5, marginBottom: 24 }}>
                Minimum 8 znaków.
              </p>

              {!ready ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#877FA0", padding: "32px 0" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    style={{ width: 16, height: 16, animation: "spin 1s linear infinite", flexShrink: 0 }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span style={{ fontSize: 14 }}>Weryfikuję link…</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ position: "relative", marginBottom: 10 }}>
                    {LOCK_ICON}
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Nowe hasło"
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = "rgba(224,181,102,.5)"; e.currentTarget.style.background = "rgba(224,181,102,.05)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "#2B2540"; e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
                    />
                  </div>
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    {LOCK_ICON}
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Powtórz hasło"
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = "rgba(224,181,102,.5)"; e.currentTarget.style.background = "rgba(224,181,102,.05)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "#2B2540"; e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
                    />
                  </div>

                  {error && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#E2654A", fontSize: 12.5, marginBottom: 10 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14, flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 12,
                      border: "none",
                      background: loading ? "rgba(224,181,102,.4)" : "linear-gradient(135deg,#FFC56B 0%,#E0992E 100%)",
                      color: "#241704",
                      fontWeight: 600,
                      fontSize: 14.5,
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    {loading && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                        style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    )}
                    {loading ? "Zapisuję…" : "Zapisz nowe hasło"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
