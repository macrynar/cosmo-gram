"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2 } from "lucide-react";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";
import { track } from "@/components/PostHogProvider";
import { supabase } from "@/lib/supabase";
// Ceny z centralnego configu — MUSZĄ zgadzać się z kwotami Stripe Price (to surface zakupu).
// TODO COPY (Mac) — finalne brzmienie etykiet/badge rocznego.
import { PLAN_PRICES } from "@/lib/pricing";

type Props = {
  onClose: () => void;
  reason?: string;
};

const FEATURES = [
  "Pełna interpretacja Twojego kosmogramu",
  "Dzienny odczyt astrologiczny każdego ranka",
  "Cosmo Match — pełna analiza relacji",
  "Cosmo Chat z Astreą — 50 wiadomości/mc",
  "Karta kosmogramu dziecka — pełne 6 modułów",
];

export default function PaywallModal({ onClose, reason }: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [withdrawalConsent, setWithdrawalConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const consentRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    track("paywall_shown", { reason: reason ?? "generic" });
  }, [reason]);

  async function handleCheckout(priceType: "monthly" | "yearly") {
    // Consent is legally required before checkout. Instead of a silently-disabled button,
    // surface the requirement so the user knows what to do. Checked before the session guard
    // so the requirement is always discoverable.
    if (!withdrawalConsent) {
      setConsentError(true);
      consentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!session) return;
    track("checkout_initiated", { price_type: priceType });
    setLoading(priceType);
    try {
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const token = freshSession?.access_token ?? session.access_token;

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceType }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Checkout error", res.status, text.slice(0, 200));
        return;
      }
      const { url, error } = await res.json() as { url?: string; error?: string };
      if (error) { console.error(error); return; }
      if (url) window.location.href = url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 backdrop-blur-sm"
          style={{ background: "rgba(5,4,14,0.75)" }}
          onClick={onClose}
        />

        {/* min-h-full wrapper centers the card when it fits, lets the overlay scroll when it doesn't.
            pointer-events-none here + pointer-events-auto on the card keeps click-outside-to-close working. */}
        <div className="relative flex min-h-full items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl p-6 sm:p-8 max-w-md w-full my-4 pointer-events-auto"
            style={{
              background: "rgba(5,4,14,0.92)",
              border: "0.5px solid rgba(212,175,55,0.28)",
              backdropFilter: "blur(28px)",
              boxShadow: "0 0 80px rgba(5,4,14,0.9), 0 0 0 0.5px rgba(212,175,55,0.10) inset, 0 0 40px rgba(212,175,55,0.05)",
            }}
          >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-600 hover:text-slate-300 transition-colors duration-300"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(197,160,89,0.15) 100%)",
                border: "0.5px solid rgba(212,175,55,0.45)",
                boxShadow: "0 0 24px rgba(212,175,55,0.20)",
              }}
            >
              <CosmoIcon className="w-6 h-6 text-[#D4AF37]" />
            </motion.div>

            <h2
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              Cosmogram Plus
            </h2>

            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-2"
              style={{
                background: "rgba(212,175,55,0.10)",
                border: "0.5px solid rgba(212,175,55,0.30)",
                color: "#F3E5AB",
              }}
            >
              ✦ Early Access · dla pierwszych 500 subskrybentów
            </div>

            {reason && (
              <p className="text-slate-400 text-sm mt-1">{reason}</p>
            )}
            <p className="text-slate-600 text-xs mt-1">Anuluj kiedy chcesz · bezpieczna płatność Stripe</p>
          </div>

          <div className="altar-divider mb-5" />

          {/* Features */}
          <ul className="space-y-2.5 mb-6">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
                className="flex items-start gap-2.5 text-sm text-slate-300"
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(212,175,55,0.15)", border: "0.5px solid rgba(212,175,55,0.35)" }}
                >
                  <Check className="w-2.5 h-2.5" style={{ color: "#D4AF37" }} />
                </span>
                {f}
              </motion.li>
            ))}
          </ul>

          {/* Withdrawal consent — art. 38 ustawy o prawach konsumenta */}
          <label
            ref={consentRef}
            className="flex items-start gap-3 mb-2 cursor-pointer group rounded-xl p-2 -m-2 transition-colors"
            style={consentError ? { background: "rgba(239,68,68,0.06)" } : undefined}
          >
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={withdrawalConsent}
                onChange={e => { setWithdrawalConsent(e.target.checked); if (e.target.checked) setConsentError(false); }}
                className="sr-only"
              />
              <motion.div
                animate={consentError ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className="w-4 h-4 rounded transition-all duration-200 flex items-center justify-center"
                style={{
                  background: withdrawalConsent ? "rgba(212,175,55,0.85)" : "transparent",
                  border: withdrawalConsent
                    ? "0.5px solid #D4AF37"
                    : consentError ? "1px solid rgba(248,113,113,0.8)" : "0.5px solid rgba(255,255,255,0.20)",
                }}
              >
                {withdrawalConsent && <Check className="w-2.5 h-2.5 text-[#050508]" />}
              </motion.div>
            </div>
            <p className={`text-xs leading-relaxed transition-colors ${consentError ? "text-red-300" : "text-slate-500 group-hover:text-slate-400"}`}>
              Chcę natychmiastowego dostępu do treści cyfrowych i przyjmuję do wiadomości, że tracę przez to prawo odstąpienia od umowy w ciągu 14 dni.
            </p>
          </label>
          <p className="text-[11px] mb-4 ml-2 transition-colors" style={{ color: consentError ? "#fca5a5" : "rgba(100,116,139,0.7)" }}>
            {consentError ? "↑ Zaznacz tę zgodę, aby przejść do płatności." : "Zaznacz powyższą zgodę, aby kontynuować."}
          </p>

          {/* Pricing buttons */}
          <div className="space-y-2.5">
            <motion.button
              onClick={() => handleCheckout("monthly")}
              disabled={!!loading}
              whileHover={loading ? undefined : {
                boxShadow: "0 0 24px rgba(212,175,55,0.35), 0 0 48px rgba(212,175,55,0.12)",
                y: -1,
              }}
              whileTap={loading ? undefined : { scale: 0.98 }}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.92) 0%, rgba(197,160,89,0.92) 100%)",
                color: "#050508",
                border: "0.5px solid rgba(212,175,55,0.65)",
              }}
            >
              {loading === "monthly"
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : `Plus miesięczny — ${PLAN_PRICES.monthly.amount} ${PLAN_PRICES.monthly.period}`
              }
            </motion.button>

            <button
              onClick={() => handleCheckout("yearly")}
              disabled={!!loading}
              className="w-full py-3 rounded-2xl text-sm transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed relative flex items-center justify-center"
              style={{
                background: "rgba(212,175,55,0.06)",
                border: "0.5px solid rgba(212,175,55,0.28)",
                color: "#F3E5AB",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.10)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.06)"; }}
            >
              {loading === "yearly" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex flex-col items-center leading-tight">
                  <span className="font-medium">Roczny — {PLAN_PRICES.annual.amount} {PLAN_PRICES.annual.period}</span>
                  <span className="text-[11px] mt-0.5" style={{ color: "#D4AF37" }}>{PLAN_PRICES.annual.perMonth} · {PLAN_PRICES.annual.saving}</span>
                </span>
              )}
            </button>
          </div>

          <p className="text-center text-slate-700 text-xs mt-4">
            Bezpieczna płatność przez Stripe · VAT wliczony
          </p>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
