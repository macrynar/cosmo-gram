"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { track } from "@/components/PostHogProvider";
import { supabase } from "@/lib/supabase";

type PackSize = "small" | "medium" | "large";

type Props = {
  onClose: () => void;
  reason?: "monthly_limit" | "need_topup" | "proactive";
};

const PACKS: { size: PackSize; messages: number; price: string; badge?: string }[] = [
  { size: "small",  messages: 50,  price: "9,99 zł" },
  { size: "medium", messages: 150, price: "24,99 zł", badge: "Popularne" },
  { size: "large",  messages: 500, price: "199,00 zł" },
];

export default function ChatPackModal({ onClose, reason = "monthly_limit" }: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState<PackSize | null>(null);
  const [withdrawalConsent, setWithdrawalConsent] = useState(false);

  useEffect(() => {
    track("chat_pack_modal_shown", { reason });
  }, [reason]);

  async function handleBuyPack(packSize: PackSize) {
    if (!session) return;
    track("chat_pack_initiated", { pack_size: packSize });
    setLoading(packSize);
    try {
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const token = freshSession?.access_token ?? session.access_token;

      const res = await fetch("/api/chat/buy-pack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packSize }),
      });

      if (!res.ok) {
        console.error("buy-pack error", res.status);
        return;
      }

      const { url, error } = await res.json() as { url?: string; error?: string };
      if (error) { console.error(error); return; }
      if (url) window.location.href = url;
    } finally {
      setLoading(null);
    }
  }

  const headingText =
    reason === "need_topup"  ? "Wyczerpałeś kredyty" :
    reason === "proactive"   ? "Dokup wiadomości" :
                               "Limit wiadomości wyczerpany";

  const subText =
    reason === "need_topup"  ? "Dokup paczkę, żeby pisać dalej — kredyty nie wygasają." :
    reason === "proactive"   ? "Dokup paczkę, kiedy chcesz — kredyty nie wygasają i sumują się z limitem." :
                               "Twój miesięczny limit się skończył. Dokup paczkę lub poczekaj do nowego okresu.";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: "rgba(5,4,14,0.75)" }}
          onClick={onClose}
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl p-6 sm:p-8 max-w-sm w-full"
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
              <MessageCircle className="w-6 h-6" style={{ color: "#D4AF37" }} />
            </motion.div>

            <h2
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {headingText}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">{subText}</p>
          </div>

          <div className="altar-divider mb-5" />

          {/* Pack options */}
          <div className="space-y-2.5 mb-5">
            {PACKS.map((pack, i) => {
              const isPopular = !!pack.badge;
              return (
                <motion.button
                  key={pack.size}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + i * 0.07, duration: 0.4 }}
                  onClick={() => handleBuyPack(pack.size)}
                  disabled={!!loading || !withdrawalConsent}
                  whileHover={loading ? undefined : { y: -1, boxShadow: isPopular ? "0 0 24px rgba(212,175,55,0.30)" : undefined }}
                  whileTap={loading ? undefined : { scale: 0.98 }}
                  className="w-full py-3.5 px-4 rounded-2xl text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                  style={isPopular ? {
                    background: "linear-gradient(135deg, rgba(212,175,55,0.88) 0%, rgba(197,160,89,0.88) 100%)",
                    color: "#050508",
                    border: "0.5px solid rgba(212,175,55,0.65)",
                  } : {
                    background: "rgba(212,175,55,0.06)",
                    border: "0.5px solid rgba(212,175,55,0.22)",
                    color: "#F3E5AB",
                  }}
                >
                  <span className="flex items-center gap-2">
                    {loading === pack.size
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : null}
                    <span>
                      <span className="font-semibold">{pack.messages} wiadomości</span>
                      {pack.badge && (
                        <span
                          className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(5,4,14,0.35)", color: "#050508" }}
                        >
                          {pack.badge}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className={`font-semibold text-sm ${isPopular ? "text-[#050508]" : "text-[#D4AF37]"}`}>
                    {pack.price}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Withdrawal consent */}
          <label className="flex items-start gap-3 mb-4 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={withdrawalConsent}
                onChange={e => setWithdrawalConsent(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-4 h-4 rounded transition-all duration-200 flex items-center justify-center"
                style={{
                  background: withdrawalConsent ? "rgba(212,175,55,0.85)" : "transparent",
                  border: withdrawalConsent ? "0.5px solid #D4AF37" : "0.5px solid rgba(255,255,255,0.20)",
                }}
              >
                {withdrawalConsent && <Check className="w-2.5 h-2.5 text-[#050508]" />}
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">
              Chcę natychmiastowego dostępu do treści cyfrowych i przyjmuję do wiadomości, że tracę przez to prawo odstąpienia od umowy w ciągu 14 dni.
            </p>
          </label>

          <p className="text-center text-slate-700 text-xs">
            Bezpieczna płatność przez Stripe · kredyty nie wygasają · VAT wliczony
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
