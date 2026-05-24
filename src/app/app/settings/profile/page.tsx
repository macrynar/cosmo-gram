"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Lock, CreditCard, Check, Loader2, Star, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthContext";
import PaywallModal from "@/components/PaywallModal";
import { supabase } from "@/lib/supabase";

type SubStatus = {
  hasSubscription: boolean;
  status: string;
  currentPeriodEnd: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  free: "Bezpłatny",
  trialing: "Trial (7 dni)",
  active: "Aktywna",
  past_due: "Zaległa płatność",
  canceled: "Anulowana",
};

const STATUS_COLORS: Record<string, string> = {
  free: "text-slate-400 border-slate-700 bg-slate-900/30",
  trialing: "text-amber-300 border-amber-700/50 bg-amber-900/20",
  active: "text-green-300 border-green-700/50 bg-green-900/20",
  past_due: "text-red-300 border-red-700/50 bg-red-900/20",
  canceled: "text-slate-400 border-slate-700 bg-slate-900/30",
};

export default function SettingsPage() {
  const { session, user } = useAuth();

  // Subscription state
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const authHeader = useCallback((): Record<string, string> =>
    session ? { Authorization: `Bearer ${session.access_token}` } : {}
  , [session]);

  const loadSub = useCallback(async () => {
    if (!session) return;
    setSubLoading(true);
    try {
      const res = await fetch("/api/subscription-status", { headers: authHeader() });
      const data = await res.json() as SubStatus;
      setSub(data);
    } finally {
      setSubLoading(false);
    }
  }, [session, authHeader]);

  useEffect(() => { loadSub(); }, [loadSub]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "err", text: "Hasła nie są zgodne" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "err", text: "Hasło musi mieć minimum 8 znaków" });
      return;
    }
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

  async function handlePortal() {
    if (!session) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: authHeader(),
      });
      const { url, error } = await res.json() as { url?: string; error?: string };
      if (url) window.location.href = url;
      else console.error(error);
    } finally {
      setPortalLoading(false);
    }
  }

  const isEmailProvider = user?.app_metadata?.provider === "email" ||
    user?.identities?.some(i => i.provider === "email");

  const statusKey = sub?.status ?? "free";

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <Star className="fixed top-[20%] left-[7%] w-2 h-2 text-amber-400/30 animate-pulse pointer-events-none" style={{ animationDuration: "3.8s" }} />

      <Navbar />

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20 space-y-6">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white font-brand">
            Ustawienia
          </h1>
          <p className="text-slate-500 text-sm mt-1">Konto, hasło i subskrypcja</p>
        </div>

        {/* Account info */}
        <section className="glass-card rounded-2xl p-6 border border-white/8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-amber-900/25 flex items-center justify-center">
              <User className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-white font-semibold">Konto</h2>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-slate-500 text-xs mb-1">Adres e-mail</p>
              <p className="text-slate-200 text-sm">{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Metoda logowania</p>
              <p className="text-slate-200 text-sm capitalize">
                {user?.app_metadata?.provider === "google" ? "Google OAuth" : "E-mail i hasło"}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">ID konta</p>
              <p className="text-slate-600 text-xs font-mono">{user?.id ?? "—"}</p>
            </div>
          </div>
        </section>

        {/* Change password */}
        {isEmailProvider && (
          <section className="glass-card rounded-2xl p-6 border border-white/8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-amber-900/25 flex items-center justify-center">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <h2 className="text-white font-semibold">Zmiana hasła</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-slate-500 text-xs block mb-1">Nowe hasło</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 znaków"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs block mb-1">Powtórz hasło</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Powtórz nowe hasło"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600/40 transition-colors"
                />
              </div>

              {passwordMsg && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${
                  passwordMsg.type === "ok"
                    ? "bg-green-900/20 border border-green-700/30 text-green-300"
                    : "bg-red-900/20 border border-red-700/30 text-red-300"
                }`}>
                  {passwordMsg.type === "ok"
                    ? <Check className="w-4 h-4 shrink-0" />
                    : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {passwordMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading || !newPassword || !confirmPassword}
                className="px-5 py-2.5 rounded-xl bg-amber-900/20 border border-amber-700/35 text-amber-300 text-sm hover:bg-amber-800/30 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Zmień hasło"}
              </button>
            </form>
          </section>
        )}

        {/* Subscription */}
        <section className="glass-card rounded-2xl p-6 border border-white/8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-amber-900/25 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-white font-semibold">Subskrypcja</h2>
          </div>

          {subLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Sprawdzam…
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full border font-medium ${STATUS_COLORS[statusKey] ?? STATUS_COLORS.free}`}>
                  {STATUS_LABELS[statusKey] ?? statusKey}
                </span>
                {statusKey === "active" && (
                  <span className="text-xs text-slate-500">Cosmogram Plus</span>
                )}
                {statusKey === "trialing" && (
                  <span className="text-xs text-slate-500">7-dniowy trial</span>
                )}
              </div>

              {sub?.currentPeriodEnd && (
                <p className="text-slate-500 text-xs">
                  {statusKey === "trialing" ? "Trial kończy się:" : "Następne odnowienie:"}{" "}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString("pl-PL")}
                </p>
              )}

              {sub?.hasSubscription ? (
                <div className="space-y-2">
                  <p className="text-slate-400 text-sm">
                    Masz dostęp do wszystkich funkcji Cosmogram Plus.
                  </p>
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
                  >
                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Zarządzaj subskrypcją
                  </button>
                  <p className="text-slate-600 text-xs">
                    Zmień kartę, anuluj lub pobierz faktury — przez Stripe Customer Portal.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-slate-400 text-sm">
                    Korzystasz z darmowego planu. Pierwszy Astro Match i 3 wiadomości w chacie gratis.
                  </p>
                  <button
                    onClick={() => setShowPaywall(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 text-white text-sm font-semibold shadow-lg shadow-amber-950/40 hover:scale-[1.01] transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    Przejdź na Cosmogram Plus
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
