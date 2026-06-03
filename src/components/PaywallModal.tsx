"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2 } from "lucide-react";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";
import { track } from "@/components/PostHogProvider";
import { supabase } from "@/lib/supabase";

type Props = {
  onClose: () => void;
  reason?: string;
};

const FEATURES = [
  "Pełna interpretacja Twojego kosmogramu",
  "Dzienny odczyt astrologiczny każdego ranka",
  "Nieograniczone Astro-Matche",
  "Cosmogram Chat bez limitu",
  "Karta kosmogramu dziecka",
];

export default function PaywallModal({ onClose, reason }: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);

  useEffect(() => {
    track("paywall_shown", { reason: reason ?? "generic" });
  }, [reason]);

  async function handleCheckout(priceType: "monthly" | "yearly") {
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: "rgba(5,4,14,0.75)" }}
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl p-6 sm:p-8 max-w-md w-full"
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
                : "Plus miesięczny — 19,90 zł / miesiąc"
              }
            </motion.button>

            <button
              onClick={() => handleCheckout("yearly")}
              disabled={!!loading}
              className="w-full py-3.5 rounded-2xl text-sm transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed relative flex items-center justify-center"
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
                <>
                  Roczny — 199 zł / rok
                  <span
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}
                  >
                    ≈ 16,60 zł/mc
                  </span>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-slate-700 text-xs mt-4">
            Bezpieczna płatność przez Stripe · VAT wliczony
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
