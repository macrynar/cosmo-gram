"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User, Lock, CreditCard, Check, Loader2, Sparkles,
  AlertCircle, RefreshCw, Copy, LogOut, X, Circle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthContext";
import PaywallModal from "@/components/PaywallModal";
import { supabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────

type SubStatus = {
  hasSubscription: boolean;
  status: string;
  currentPeriodEnd: string | null;
};

// ── DS status map ─────────────────────────────────────────────────────────────

type PillVariant = "ok" | "trial" | "warn" | "muted";

const STATUS_CONFIG: Record<string, {
  label: string;
  variant: PillVariant;
  showCheck?: boolean;
}> = {
  active:   { label: "Aktywna",           variant: "ok",    showCheck: true },
  trialing: { label: "Trial · 7 dni",     variant: "trial" },
  past_due: { label: "Zaległa płatność",  variant: "warn"  },
  canceled: { label: "Anulowana",         variant: "muted" },
  free:     { label: "Bezpłatny",         variant: "muted" },
};

const PILL_STYLES: Record<PillVariant, React.CSSProperties> = {
  ok:    { background: "rgba(255,174,61,.12)", border: "1px solid rgba(224,181,102,.42)", color: "#FFD9A0" },
  trial: { background: "transparent",          border: "1px solid rgba(224,181,102,.40)", color: "var(--accent-deep)" },
  warn:  { background: "rgba(226,101,74,.12)", border: "1px solid rgba(226,101,74,.45)",  color: "#E89B86" },
  muted: { background: "rgba(182,175,198,.06)",border: "1px solid var(--line)",           color: "var(--text-muted)" },
};

// Canonical benefits list — same as PaywallModal
const PLUS_BENEFITS = [
  "Pełna interpretacja Twojego kosmogramu",
  "Dzienny odczyt astrologiczny każdego ranka",
  "Cosmo Match — pełna analiza relacji",
  "Cosmo Chat z Astreą — 50 wiadomości/mc",
  "Karta kosmogramu dziecka — pełne 6 modułów",
];

// ── Password scoring ──────────────────────────────────────────────────────────

function scorePassword(p: string): number {
  let s = 0;
  if (p.length >= 8)                             s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p))       s++;
  if (/\d/.test(p))                              s++;
  if (/[^A-Za-z0-9]/.test(p))                   s++;
  if (p.length >= 12)                            s++;
  return s;
}

// ── Shared DS card styles ─────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background:   "var(--bg-elevated)",
  border:       "1px solid var(--line)",
  borderRadius: 18,
  padding:      24,
  marginBottom: 18,
};

const SECTION_ICON: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(224,181,102,.10)",
  border: "1px solid rgba(224,181,102,.22)",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { session, user, signOut } = useAuth();

  // Subscription
  const [sub,          setSub]          = useState<SubStatus | null>(null);
  const [subLoading,   setSubLoading]   = useState(false);
  const [portalLoading,setPortalLoading]= useState(false);
  const [syncLoading,  setSyncLoading]  = useState(false);
  const [syncMsg,      setSyncMsg]      = useState<string | null>(null);
  const [showPaywall,  setShowPaywall]  = useState(false);

  // Account — copy ID
  const [copied, setCopied] = useState(false);

  // Password
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg,     setPasswordMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const authHeader = useCallback((): Record<string, string> =>
    session ? { Authorization: `Bearer ${session.access_token}` } : {}
  , [session]);

  // ── Load subscription ────────────────────────────────────────────────────

  const loadSub = useCallback(async () => {
    if (!session) return;
    setSubLoading(true);
    try {
      const res  = await fetch("/api/subscription-status", { headers: authHeader() });
      const data = await res.json() as SubStatus;
      setSub(data);
    } finally {
      setSubLoading(false);
    }
  }, [session, authHeader]);

  useEffect(() => { loadSub(); }, [loadSub]);

  // ── Sync ─────────────────────────────────────────────────────────────────

  async function handleSync() {
    if (!session) return;
    setSyncLoading(true);
    setSyncMsg(null);
    try {
      const res  = await fetch("/api/sync-subscription", { method: "POST", headers: authHeader() });
      const data = await res.json() as SubStatus & { synced?: boolean };
      if (data.hasSubscription) {
        setSub(data);
        setSyncMsg("Subskrypcja zsynchronizowana.");
      } else {
        setSyncMsg("Nie znaleziono aktywnej subskrypcji dla tego konta.");
      }
    } catch {
      setSyncMsg("Błąd synchronizacji. Spróbuj ponownie.");
    } finally {
      setSyncLoading(false);
    }
  }

  // ── Stripe portal ─────────────────────────────────────────────────────────

  async function handlePortal() {
    if (!session) return;
    setPortalLoading(true);
    try {
      const res                        = await fetch("/api/create-portal-session", { method: "POST", headers: authHeader() });
      const { url, error }             = await res.json() as { url?: string; error?: string };
      if (url) window.location.href   = url;
      else console.error(error);
    } finally {
      setPortalLoading(false);
    }
  }

  // ── Copy account ID ───────────────────────────────────────────────────────

  function handleCopy() {
    if (!user?.id) return;
    navigator.clipboard?.writeText(user.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  // ── Password change ───────────────────────────────────────────────────────

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg({ type: "err", text: error.message });
    } else {
      setPasswordMsg({ type: "ok", text: "Hasło zostało zmienione" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordLoading(false);
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const isEmailProvider = user?.app_metadata?.provider === "email" ||
    user?.identities?.some(i => i.provider === "email");

  const statusKey   = sub?.status ?? "free";
  const statusConf  = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.free;
  const pillStyle   = PILL_STYLES[statusConf.variant];

  // Password derived
  const pwScore   = scorePassword(newPassword);
  const pwPct     = newPassword ? Math.max(12, Math.round(pwScore / 5 * 100)) : 0;
  const lenOk     = newPassword.length >= 8;
  const matchOk   = !!newPassword && newPassword === confirmPassword;
  const canSubmit = lenOk && matchOk;

  const strengthWord = !newPassword ? "" : pwScore <= 2 ? "słabe" : pwScore <= 3 ? "średnie" : "mocne";
  const strengthColor = !newPassword ? "transparent"
    : pwScore <= 2 ? "var(--tense)"
    : pwScore <= 3 ? "var(--accent-deep)"
    : "var(--voice)";

  const renewLabel = statusKey === "trialing" ? "Trial kończy się ·" : "Następne odnowienie ·";
  const renewColor = statusKey === "past_due" ? "#E89B86" : "var(--text-muted)";

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "radial-gradient(120% 90% at 50% 0%, #1A1530 0%, var(--bg-base) 70%) fixed var(--bg-base)" }}
    >
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />

      <Navbar />

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-24">

        {/* ── Page header ── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-fraunces, 'Fraunces', serif)", fontWeight: 500, fontSize: 32, letterSpacing: ".01em", marginBottom: 4, color: "var(--text-primary)" }}>
            Ustawienia
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14.5 }}>
            Subskrypcja, konto i bezpieczeństwo
          </p>
        </div>

        {/* ══════════════ SEKCJA 1: SUBSKRYPCJA ══════════════ */}
        <section style={CARD}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
            <div style={SECTION_ICON}>
              <CreditCard size={16} style={{ color: "var(--accent-deep)" }} />
            </div>
            <h2 style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: "-.01em", flex: 1 }}>
              Subskrypcja
            </h2>
            {/* Discrete sync button */}
            <button
              onClick={handleSync}
              disabled={syncLoading}
              title="Synchronizuj subskrypcję"
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: "1px solid var(--line)", background: "none",
                color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: syncLoading ? "not-allowed" : "pointer", opacity: syncLoading ? 0.4 : 1,
                transition: ".2s",
              }}
              onMouseEnter={e => { if (!syncLoading) (e.currentTarget as HTMLElement).style.color = "var(--accent-deep)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            >
              <RefreshCw size={15} className={syncLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {subLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
              <Loader2 size={16} className="animate-spin" /> Sprawdzam…
            </div>
          ) : (
            <>
              {/* Status row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{
                  ...pillStyle,
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 600, letterSpacing: ".02em",
                  padding: "5px 12px", borderRadius: 999,
                }}>
                  {statusConf.showCheck && <Check size={12} />}
                  {statusConf.label}
                </span>
                {(statusKey === "active" || statusKey === "trialing" || statusKey === "past_due") && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--accent-deep)" }}>
                    <Sparkles size={13} />
                    Cosmogram Plus
                  </span>
                )}
              </div>

              {/* Renewal / warning */}
              {sub?.currentPeriodEnd && (
                <p style={{ fontSize: 12.5, color: renewColor, marginBottom: 16 }}>
                  {statusKey === "past_due"
                    ? "Zaktualizuj metodę płatności, aby zachować dostęp"
                    : `${renewLabel} ${new Date(sub.currentPeriodEnd).toLocaleDateString("pl-PL")}`}
                </p>
              )}

              {sub?.hasSubscription ? (
                /* ── Plan Plus / Trial / Past due ── */
                <>
                  {/* Benefits grid */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px 18px",
                    padding: 16, borderRadius: 13,
                    background: "rgba(224,181,102,.05)", border: "1px solid rgba(224,181,102,.16)",
                    marginBottom: 18,
                  }}
                    className="settings-benefits"
                  >
                    {PLUS_BENEFITS.map(b => (
                      <div key={b} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--text-secondary)" }}>
                        <Check size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
                        {b}
                      </div>
                    ))}
                  </div>

                  {/* Portal button */}
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "10px 18px", borderRadius: 12, fontSize: 14,
                      border: "1px solid var(--line)", background: "rgba(182,175,198,.04)",
                      color: "var(--text-secondary)", cursor: portalLoading ? "not-allowed" : "pointer",
                      opacity: portalLoading ? 0.4 : 1, transition: ".2s", marginBottom: 10,
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(224,181,102,.35)";
                      el.style.color = "var(--voice)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "var(--line)";
                      el.style.color = "var(--text-secondary)";
                    }}
                  >
                    {portalLoading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                    Zarządzaj subskrypcją
                  </button>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Zmień kartę, anuluj lub pobierz faktury — przez Stripe Customer Portal.
                  </p>
                </>
              ) : (
                /* ── Plan darmowy ── */
                <>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: 16 }}>
                    Korzystasz z darmowego planu. Pierwszy Cosmo Match i 3 wiadomości w chacie — gratis.
                  </p>
                  <button
                    onClick={() => setShowPaywall(true)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "10px 18px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                      background: "var(--grad-ember)", border: "none",
                      color: "#241704", cursor: "pointer",
                      boxShadow: "0 6px 22px rgba(255,174,61,.16)",
                      marginBottom: 12, transition: ".2s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.05)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
                  >
                    <Sparkles size={16} />
                    Przejdź na Cosmogram Plus
                  </button>

                  <div>
                    <button
                      onClick={handleSync}
                      disabled={syncLoading}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        padding: "7px 13px", borderRadius: 12, fontSize: 12.5,
                        border: "1px solid var(--line)", background: "none",
                        color: "var(--text-muted)", cursor: syncLoading ? "not-allowed" : "pointer",
                        opacity: syncLoading ? 0.4 : 1, transition: ".2s",
                      }}
                    >
                      {syncLoading && <Loader2 size={13} className="animate-spin" />}
                      Mam już subskrypcję — synchronizuj
                    </button>
                    {syncMsg && (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>{syncMsg}</p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </section>

        {/* ══════════════ SEKCJA 2: KONTO ══════════════ */}
        <section style={CARD}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
            <div style={SECTION_ICON}>
              <User size={16} style={{ color: "var(--accent-deep)" }} />
            </div>
            <h2 style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: "-.01em" }}>Konto</h2>
          </div>

          {/* Row: Email */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--line-soft)" }}>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 3 }}>Adres e-mail</div>
            <div style={{ fontSize: 14.5, color: "var(--text-primary)" }}>{user?.email ?? "—"}</div>
          </div>

          {/* Row: Login method */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--line-soft)" }}>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 3 }}>Metoda logowania</div>
            <div style={{ fontSize: 14.5, color: "var(--text-primary)" }}>
              {user?.app_metadata?.provider === "google" ? "Google OAuth" : "E-mail i hasło"}
            </div>
          </div>

          {/* Row: ID */}
          <div style={{ padding: "12px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 3 }}>ID konta</div>
              <div style={{
                fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                fontSize: 12.5, color: "var(--text-secondary)", letterSpacing: ".02em",
                wordBreak: "break-all",
              }}>
                {user?.id ?? "—"}
              </div>
            </div>
            {user?.id && (
              <button
                onClick={handleCopy}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
                  border: "1px solid var(--line)", background: "none",
                  color: copied ? "var(--accent-deep)" : "var(--text-muted)",
                  borderColor: copied ? "rgba(224,181,102,.3)" : "var(--line)",
                  fontSize: 12, padding: "6px 11px", borderRadius: 9,
                  cursor: "pointer", transition: ".2s", whiteSpace: "nowrap",
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Skopiowano" : "Kopiuj"}
              </button>
            )}
          </div>

          {/* Divider + Logout */}
          <div style={{ height: 1, background: "var(--line-soft)", margin: "14px 0 18px" }} />
          <button
            onClick={handleSignOut}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 12, fontSize: 14,
              border: "1px solid var(--line)", background: "none",
              color: "var(--text-secondary)", cursor: "pointer", transition: ".2s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "rgba(226,101,74,.5)";
              el.style.color = "#E89B86";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--line)";
              el.style.color = "var(--text-secondary)";
            }}
          >
            <LogOut size={16} />
            Wyloguj się
          </button>
        </section>

        {/* ══════════════ SEKCJA 3: BEZPIECZEŃSTWO ══════════════ */}
        {isEmailProvider && (
          <section style={CARD}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
              <div style={SECTION_ICON}>
                <Lock size={16} style={{ color: "var(--accent-deep)" }} />
              </div>
              <h2 style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: "-.01em" }}>Bezpieczeństwo</h2>
            </div>

            <form onSubmit={handleChangePassword}>
              {/* New password field */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginBottom: 7 }}>
                  Nowe hasło
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setPasswordMsg(null); }}
                  placeholder="Minimum 8 znaków"
                  autoComplete="new-password"
                  style={{
                    width: "100%", background: "rgba(182,175,198,.04)",
                    border: "1px solid var(--line)", borderRadius: 12,
                    padding: "11px 14px", color: "var(--text-primary)", fontSize: 14,
                    outline: "none", transition: "border-color .2s",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(224,181,102,.45)"; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = "var(--line)"; }}
                />
                {/* Strength bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9, height: 14 }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 999, background: "rgba(182,175,198,.10)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pwPct}%`, borderRadius: 999,
                      background: "var(--accent)", transition: "width .3s",
                    }} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, minWidth: 54, textAlign: "right", letterSpacing: ".02em", color: strengthColor, transition: "color .2s" }}>
                    {strengthWord}
                  </span>
                </div>
              </div>

              {/* Confirm password field */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginBottom: 7 }}>
                  Powtórz hasło
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setPasswordMsg(null); }}
                  placeholder="Powtórz nowe hasło"
                  autoComplete="new-password"
                  style={{
                    width: "100%", background: "rgba(182,175,198,.04)",
                    border: "1px solid var(--line)", borderRadius: 12,
                    padding: "11px 14px", color: "var(--text-primary)", fontSize: 14,
                    outline: "none", transition: "border-color .2s",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(224,181,102,.45)"; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = "var(--line)"; }}
                />
              </div>

              {/* Live rules */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                <RuleRow
                  text="Minimum 8 znaków"
                  ok={lenOk}
                  empty={!newPassword}
                />
                <RuleRow
                  text="Hasła są zgodne"
                  ok={matchOk}
                  empty={!newPassword && !confirmPassword}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || passwordLoading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 18px", borderRadius: 12, fontSize: 14,
                  border: "1px solid var(--line)", background: "rgba(182,175,198,.04)",
                  color: canSubmit && !passwordLoading ? "var(--text-secondary)" : "var(--text-muted)",
                  cursor: canSubmit && !passwordLoading ? "pointer" : "not-allowed",
                  opacity: canSubmit && !passwordLoading ? 1 : 0.4,
                  transition: ".2s",
                }}
                onMouseEnter={e => {
                  if (!canSubmit || passwordLoading) return;
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(224,181,102,.35)";
                  el.style.color = "var(--voice)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "var(--line)";
                  el.style.color = canSubmit && !passwordLoading ? "var(--text-secondary)" : "var(--text-muted)";
                }}
              >
                {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Zmień hasło
              </button>

              {/* Result message — DS colors only */}
              {passwordMsg && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13, padding: "10px 13px", borderRadius: 11, marginTop: 14,
                  ...(passwordMsg.type === "ok"
                    ? { background: "rgba(255,174,61,.10)", border: "1px solid rgba(224,181,102,.3)", color: "var(--voice)" }
                    : { background: "rgba(226,101,74,.10)", border: "1px solid rgba(226,101,74,.3)",  color: "#E89B86" }
                  ),
                }}>
                  {passwordMsg.type === "ok"
                    ? <Check size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    : <AlertCircle size={16} style={{ color: "var(--tense)", flexShrink: 0 }} />}
                  {passwordMsg.text}
                </div>
              )}
            </form>
          </section>
        )}

      </main>

      {/* Mobile benefits: 1 col < 560px */}
      <style>{`
        @media (max-width: 560px) {
          .settings-benefits { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── RuleRow helper ────────────────────────────────────────────────────────────

function RuleRow({ text, ok, empty }: { text: string; ok: boolean; empty: boolean }) {
  const color = empty ? "var(--text-muted)" : ok ? "var(--voice)" : "#E89B86";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color, transition: "color .2s" }}>
      {empty
        ? <Circle  size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        : ok
          ? <Check   size={14} style={{ color: "var(--accent)",     flexShrink: 0 }} />
          : <X       size={14} style={{ color: "var(--tense)",      flexShrink: 0 }} />}
      {text}
    </div>
  );
}
