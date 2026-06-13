"use client";

import { useRouter, usePathname } from "next/navigation";

export type Horizon = "today" | "week" | "month" | "year";

const HORIZONS: { key: Horizon; label: string }[] = [
  { key: "today", label: "Dziś"    },
  { key: "week",  label: "Tydzień" },
  { key: "month", label: "Miesiąc" },
  { key: "year",  label: "Rok"     },
];

interface Props {
  value: Horizon;
}

export default function HorizonSwitcher({ value }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  function setHorizon(h: Horizon) {
    router.replace(`${pathname}?h=${h}`);
  }

  return (
    <div
      className="flex items-center gap-1 glass-card rounded-2xl p-1"
      role="tablist"
      aria-label="Horyzont czasowy"
    >
      {HORIZONS.map(({ key, label }) => (
        <button
          key={key}
          role="tab"
          aria-selected={value === key}
          onClick={() => setHorizon(key)}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
            value === key
              ? "text-amber-300 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
          style={value === key ? { background: "rgba(255,174,61,0.12)" } : undefined}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
