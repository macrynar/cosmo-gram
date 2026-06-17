"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) {
      setError("Nie udało się wysłać e-maila. Sprawdź adres i spróbuj ponownie.");
    } else {
      setDone(true);
    }
    setLoading(false);
  }

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
                  <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "var(--font-fraunces),'Fraunces',serif", fontWeight: 500, fontSize: 22, color: "#F4F1EA", marginBottom: 8 }}>
                Sprawdź skrzynkę
              </h2>
              <p style={{ color: "#877FA0", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Wysłaliśmy link do zresetowania hasła na <strong style={{ color: "#E9DCC0" }}>{email}</strong>. Sprawdź też folder spam.
              </p>
              <Link href="/login" style={{ color: "#E0B566", fontSize: 14, textDecoration: "none" }}>
                Wróć do logowania
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: "var(--font-fraunces),'Fraunces',serif", fontWeight: 500, fontSize: 22, color: "#F4F1EA", marginBottom: 6 }}>
                Resetuj hasło
              </h2>
              <p style={{ color: "#877FA0", fontSize: 13.5, marginBottom: 24 }}>
                Podaj e-mail — wyślemy link do ustawienia nowego hasła.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                    style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#877FA0", pointerEvents: "none" }}>
                    <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                  </svg>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="twój@email.pl"
                    style={{
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
                    }}
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
                  {loading ? "Wysyłam…" : "Wyślij link resetujący"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#877FA0" }}>
                Pamiętasz hasło?{" "}
                <Link href="/login" style={{ color: "#E0B566", textDecoration: "none" }}>
                  Zaloguj się
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
