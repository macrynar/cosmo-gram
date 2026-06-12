"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

interface Props {
  title:    string;
  index:    number;
  onRetry:  () => void;
}

export default function FailedModulePlaceholder({ title, index, onRetry }: Props) {
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    try { await onRetry(); } finally { setRetrying(false); }
  }

  return (
    <motion.div
      id={`module-${title.toLowerCase().replace(/\s+/g, "-")}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
      className="rounded-2xl p-6 text-center"
      style={{
        background:     "rgba(5,4,14,0.55)",
        border:         "0.5px solid rgba(148,163,184,0.12)",
        backdropFilter: "blur(18px)",
      }}
    >
      <p className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: "rgba(148,163,184,0.40)" }}>
        {title}
      </p>
      <p className="text-sm text-slate-500 mb-4">Ten rozdział jeszcze się pisze</p>
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs transition-all disabled:opacity-40"
        style={{ border: "0.5px solid rgba(148,163,184,0.22)", color: "rgba(148,163,184,0.60)" }}
      >
        <RotateCcw className={`w-3 h-3 ${retrying ? "animate-spin" : ""}`} />
        {retrying ? "Próbuję..." : "Spróbuj ponownie"}
      </button>
    </motion.div>
  );
}
