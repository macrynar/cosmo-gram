"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

// ─── Variant definitions ───────────────────────────────────────────────────

type Variant = "default" | "altar" | "subtle" | "glow";

const HOVER_SHADOW: Record<Variant, Record<string, unknown>> = {
  default: {
    borderColor: "rgba(212,175,55,0.45)",
    boxShadow: "0 0 28px rgba(212,175,55,0.16), 0 0 56px rgba(212,175,55,0.06)",
    y: -2,
  },
  altar: {
    borderColor: "rgba(212,175,55,0.55)",
    boxShadow: "0 0 40px rgba(212,175,55,0.24), 0 0 80px rgba(212,175,55,0.10)",
    y: -3,
  },
  subtle: {
    borderColor: "rgba(255,255,255,0.10)",
    boxShadow: "0 0 20px rgba(212,175,55,0.08)",
    y: -1,
  },
  glow: {
    borderColor: "rgba(212,175,55,0.70)",
    boxShadow: "0 0 40px rgba(212,175,55,0.35), 0 0 80px rgba(212,175,55,0.14)",
    y: -3,
  },
};

const BASE_CLASS: Record<Variant, string> = {
  default: "bg-black/40     border-[rgba(212,175,55,0.18)]",
  altar:   "bg-[rgba(5,4,14,0.75)] border-[rgba(212,175,55,0.28)] shadow-[0_0_60px_rgba(5,4,14,0.8),inset_0_0_80px_rgba(88,60,140,0.04)]",
  subtle:  "bg-white/[0.025] border-white/[0.05]",
  glow:    "bg-black/50      border-[rgba(212,175,55,0.35)] shadow-[0_0_20px_rgba(212,175,55,0.10)]",
};

// ─── MysticCard ────────────────────────────────────────────────────────────

export type MysticCardProps = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  delay?: number;
  disableHover?: boolean;
} & Omit<HTMLMotionProps<"div">, "children">;

export function MysticCard({
  children,
  className = "",
  variant = "default",
  delay = 0,
  disableHover = false,
  ...rest
}: MysticCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={disableHover ? undefined : {
        ...HOVER_SHADOW[variant],
        transition: { duration: 0.35, ease: "easeOut" },
      }}
      className={[
        "relative overflow-hidden rounded-2xl backdrop-blur-xl",
        "border-[0.5px] transition-colors duration-500",
        BASE_CLASS[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// ─── Staggered list container ─────────────────────────────────────────────

type StaggerProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
};

export function MysticStagger({
  children,
  className = "",
  staggerDelay = 0.10,
  initialDelay = 0,
}: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: staggerDelay, delayChildren: initialDelay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger item ──────────────────────────────────────────────────────────

type StaggerItemProps = { children: ReactNode; className?: string };

export function MysticStaggerItem({ children, className = "" }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden:  { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── MysticButton ─────────────────────────────────────────────────────────

type BtnVariant = "gold" | "ghost" | "filled";

type MysticButtonProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

const BTN_BASE: Record<BtnVariant, string> = {
  gold:   "border border-[rgba(212,175,55,0.52)] text-[#D4AF37] bg-transparent",
  ghost:  "border border-white/10 text-slate-300 bg-white/[0.03]",
  filled: "border border-[rgba(212,175,55,0.5)] text-[#050508] bg-gradient-to-r from-[#D4AF37] to-[#C5A059]",
};

const BTN_HOVER_SHADOW: Record<BtnVariant, string> = {
  gold:   "0 0 22px rgba(212,175,55,0.35), 0 0 45px rgba(212,175,55,0.12)",
  ghost:  "0 0 18px rgba(255,255,255,0.05)",
  filled: "0 0 28px rgba(212,175,55,0.50), 0 0 55px rgba(212,175,55,0.18)",
};

export function MysticButton({
  children,
  className = "",
  onClick,
  variant = "gold",
  disabled,
  type = "button",
}: MysticButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : {
        boxShadow: BTN_HOVER_SHADOW[variant],
        y: -1,
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      whileTap={disabled ? undefined : { scale: 0.97, y: 0 }}
      className={[
        "inline-flex items-center justify-center gap-2 cursor-pointer",
        "px-5 py-2.5 rounded-xl text-[0.7rem] font-medium tracking-widest uppercase",
        "transition-colors duration-500 ease-in-out",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        BTN_BASE[variant],
        className,
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}

// ─── MysticTooltip ─────────────────────────────────────────────────────────
// Usage: wrap trigger in <MysticTooltip content="…">…</MysticTooltip>

import { useState } from "react";
import { AnimatePresence } from "framer-motion";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
};

export function MysticTooltip({ content, children, side = "top", className = "" }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: side === "top" ? 6 : -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={[
              "absolute z-50 w-52 pointer-events-none",
              side === "top"
                ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
                : "top-full mt-2 left-1/2 -translate-x-1/2",
            ].join(" ")}
          >
            <span
              className="block rounded-xl px-3 py-2.5 text-center"
              style={{
                background: "rgba(5,4,14,0.94)",
                border: "0.5px solid rgba(212,175,55,0.30)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
              }}
            >
              {typeof content === "string" ? (
                <span className="block text-[11px] text-slate-300 leading-relaxed italic">
                  &ldquo;{content}&rdquo;
                </span>
              ) : content}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
