"use client";

import { useState } from "react";
import { X, Link, Check, Share2 } from "lucide-react";
import { track } from "@/components/PostHogProvider";

type Props =
  | { type: "natal"; readingId: string; onClose: () => void }
  | { type: "match"; matchId: string; onClose: () => void };

export default function ShareModal(props: Props) {
  const { onClose } = props;
  const [copied, setCopied] = useState(false);

  const id = props.type === "natal" ? props.readingId : props.matchId;
  const path = props.type === "natal"
    ? `/share/reading/${id}`
    : `/share/match/${id}`;
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}${path}`;

  const title = props.type === "natal" ? "Mój kosmogram urodzeniowy" : "Mój Astro Match";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      track("share_completed", { type: props.type, method: "copy_link", id });
    } catch {
      // clipboard not available
    }
  }

  async function handleWebShare() {
    try {
      await navigator.share({ url, title: "Cosmogram", text: title });
      track("share_completed", { type: props.type, method: "web_share", id });
    } catch {
      // cancelled or not supported
    }
  }

  const canWebShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/10 shadow-2xl shadow-black/60">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-white font-brand mb-1">
          {props.type === "natal" ? "Udostępnij kosmogram" : "Udostępnij Astro Match"}
        </h2>
        <p className="text-slate-500 text-xs mb-5">
          Osoba, której wyślesz link, zobaczy pełny wynik i będzie mogła stworzyć swój własny kosmogram.
        </p>

        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
          <span className="text-slate-400 text-xs truncate flex-1 font-mono">{url}</span>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-600 text-white font-semibold text-sm hover:from-amber-600 hover:to-amber-500 transition-all"
          >
            {copied ? (
              <><Check className="w-4 h-4" /> Skopiowano!</>
            ) : (
              <><Link className="w-4 h-4" /> Kopiuj link</>
            )}
          </button>

          {canWebShare && (
            <button
              onClick={handleWebShare}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 text-slate-200 text-sm hover:bg-white/5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Udostępnij przez system
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
