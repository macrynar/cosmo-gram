"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const STORAGE_KEY = "cosmo_cookie_consent";

export type ConsentValue = "accepted" | "rejected";

export function getStoredConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY) as ConsentValue | null;
}

export function setStoredConsent(value: ConsentValue) {
  localStorage.setItem(STORAGE_KEY, value);
}

export default function CookieConsent({ onConsent }: { onConsent: (value: ConsentValue) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    setStoredConsent("accepted");
    setVisible(false);
    onConsent("accepted");
  }

  function reject() {
    setStoredConsent("rejected");
    setVisible(false);
    onConsent("rejected");
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40"
        >
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(5,4,14,0.95)",
              border: "0.5px solid rgba(212,175,55,0.22)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          >
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Używamy cookies analitycznych (PostHog) do ulepszania Cosmogram. Dane są anonimizowane i nie trafiają do stron trzecich w celach reklamowych.{" "}
              <Link href="/cookies" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
                Polityka cookies
              </Link>
            </p>
            <div className="flex gap-2">
              <button
                onClick={accept}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.90), rgba(197,160,89,0.90))",
                  color: "#050508",
                }}
              >
                Akceptuj
              </button>
              <button
                onClick={reject}
                className="flex-1 py-2 rounded-xl text-xs transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.10)",
                  color: "#64748b",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
              >
                Tylko niezbędne
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
