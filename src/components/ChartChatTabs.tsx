"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, MessageCircle, Sun } from "lucide-react";

const TABS = [
  { label: "Kosmogram", href: "/generate", icon: Sparkles },
  { label: "Horoskop dzienny", href: "/horoskop-dzienny", icon: Sun },
  { label: "Chat", href: "/chat", icon: MessageCircle },
];

export default function ChartChatTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/4 border border-white/6 w-fit">
      {TABS.map(({ label, href, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-violet-600/25 border border-violet-500/30 text-white shadow-sm shadow-violet-900/30"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/4"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${active ? "text-violet-400" : "text-slate-600"}`} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
