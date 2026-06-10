"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";

interface Props {
  title:    string;
  index:    number;
  onPaywall?: () => void;
}

export default function LockedModulePlaceholder({ title, index, onPaywall }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl cursor-pointer"
      style={{
        background:     "rgba(5,4,14,0.50)",
        border:         "0.5px solid rgba(212,175,55,0.08)",
        backdropFilter: "blur(18px)",
        minHeight:      "180px",
      }}
      onClick={onPaywall}
    >
      {/* Blurred fake content strips */}
      <div className="p-5 sm:p-6 space-y-4 blur-sm select-none pointer-events-none opacity-40">
        <div className="h-3 rounded-full w-1/3" style={{ background: "rgba(212,175,55,0.25)" }} />
        <div className="h-4 rounded-full w-2/3" style={{ background: "rgba(255,255,255,0.10)" }} />
        <div className="space-y-2 mt-4">
          <div className="h-2.5 rounded-full w-full"  style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-2.5 rounded-full w-5/6"  style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-2.5 rounded-full w-4/5"  style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
      </div>

      {/* Lock overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl"
        style={{ background: "rgba(5,4,14,0.78)", backdropFilter: "blur(6px)" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(212,175,55,0.12)", border: "0.5px solid rgba(212,175,55,0.38)" }}
        >
          <Lock className="w-4 h-4" style={{ color: "#D4AF37" }} />
        </div>
        <p
          className="text-base font-medium text-center px-4"
          style={{ color: "#F3E5AB", fontFamily: "var(--font-cormorant), serif" }}
        >
          {title}
        </p>
        <p className="text-xs text-slate-500">Dostępne w planie Plus</p>
        <div
          className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
          style={{ background: "rgba(212,175,55,0.12)", border: "0.5px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}
        >
          Odblokuj →
        </div>
      </div>
    </motion.div>
  );
}
