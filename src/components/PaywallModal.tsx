"use client";

import { useEffect, useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";
import { track } from "@/components/PostHogProvider";

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
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceType }),
      });
      const { url, error } = await res.json() as { url?: string; error?: string };
      if (error) { console.error(error); return; }
      if (url) window.location.href = url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-amber-700/25 shadow-2xl shadow-black/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 mb-4 shadow-lg shadow-amber-950/50">
            <CosmoIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 font-brand">
            Cosmogram Plus
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium mb-2">
            ✦ Early Access · dla pierwszych 500 subskrybentów
          </div>
          {reason && (
            <p className="text-slate-400 text-sm mt-1">{reason}</p>
          )}
          <p className="text-slate-500 text-xs mt-1">7 dni bezpłatnego trialu · anuluj kiedy chcesz</p>
        </div>

        <ul className="space-y-2 mb-6">
          {FEATURES.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
              <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          <button
            onClick={() => handleCheckout("monthly")}
            disabled={!!loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-950/40 hover:scale-[1.01] transition-all disabled:opacity-60"
          >
            {loading === "monthly" ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              "Zacznij trial — 19,90 zł / miesiąc"
            )}
          </button>

          <button
            onClick={() => handleCheckout("yearly")}
            disabled={!!loading}
            className="w-full py-3 rounded-2xl border border-amber-700/40 text-amber-300 text-sm hover:bg-amber-900/15 transition-colors disabled:opacity-60 relative"
          >
            {loading === "yearly" ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              <>
                Roczny — 199 zł / rok
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs bg-amber-900/30 text-amber-300 px-2 py-0.5 rounded-full">
                  ≈ 16,60 zł/mc
                </span>
              </>
            )}
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          Bezpieczna płatność przez Stripe · VAT wliczony
        </p>
      </div>
    </div>
  );
}
