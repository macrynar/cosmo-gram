"use client";

import { Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInbox } from "@/components/inbox/InboxProvider";

// Koperta w nagłówku strefy /app/*. Bursztynowy badge z licznikiem + poświata,
// gdy są nieprzeczytane — ma być od razu widać (wymóg Maca).
export default function InboxBell({ size = 36 }: { size?: number }) {
  const { unread, open } = useInbox();
  const has = unread > 0;

  return (
    <button
      onClick={open}
      aria-label={has ? `Skrzynka — ${unread} nowych` : "Skrzynka"}
      className="relative flex items-center justify-center rounded-full transition-all duration-300 hover:bg-[rgba(212,175,55,0.10)]"
      style={{
        width: size,
        height: size,
        boxShadow: has ? "0 0 18px rgba(255,174,61,0.28)" : "none",
      }}
    >
      <Mail
        size={19}
        strokeWidth={1.5}
        style={{ color: has ? "#FFB23E" : "#B6AFC6" }}
      />
      <AnimatePresence>
        {has && (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums"
            style={{
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              background: "linear-gradient(135deg, #FFC56B, #FFAE3D)",
              color: "#201405",
              boxShadow: "0 0 10px rgba(255,174,61,0.6)",
              border: "1.5px solid #0B0912",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
