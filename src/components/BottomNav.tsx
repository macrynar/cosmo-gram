"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC, SVGProps } from "react";
import {
  KosmogramIcon,
  PrognozaIcon,
  ChatIcon,
  MatchIcon,
  KontoIcon,
} from "@/components/icons/NavIcons";

type Tab = {
  href:    string;
  label:   string;
  icon:    FC<SVGProps<SVGSVGElement>>;
  center?: boolean;
};

const TABS: Tab[] = [
  { href: "/app/cosmogram", label: "Kosmogram", icon: KosmogramIcon },
  { href: "/app/calendar",  label: "Prognoza",   icon: PrognozaIcon },
  { href: "/app/chat",      label: "Chat",        icon: ChatIcon, center: true },
  { href: "/app/match",     label: "Match",       icon: MatchIcon },
  { href: "/app/settings",  label: "Konto",       icon: KontoIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (!pathname.startsWith("/app")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background:             "rgba(5,4,14,0.94)",
        borderTop:              "0.5px solid rgba(212,175,55,0.14)",
        backdropFilter:         "blur(24px) saturate(180%)",
        WebkitBackdropFilter:   "blur(24px) saturate(180%)",
        paddingBottom:          "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-end justify-around px-1 h-16">
        {TABS.map(({ href, label, icon: Icon, center }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));

          if (center) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="flex flex-col items-center -mt-5 pb-0.5"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-150 active:scale-95"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, #D4AF37, #C5A059)"
                      : "linear-gradient(135deg, rgba(212,175,55,0.16), rgba(91,44,143,0.18))",
                    border:    `0.5px solid rgba(212,175,55,${active ? "0.70" : "0.40"})`,
                    boxShadow: active
                      ? "0 0 28px rgba(212,175,55,0.55), 0 4px 24px rgba(0,0,0,0.55)"
                      : "0 4px 20px rgba(0,0,0,0.45), 0 0 14px rgba(212,175,55,0.14)",
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: active ? "#050508" : "#D4AF37" }}
                  />
                </div>
                <span
                  className="text-[9px] mt-1.5 tracking-wide"
                  style={{ color: active ? "#D4AF37" : "rgba(212,175,55,0.50)" }}
                >
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="relative flex flex-col items-center justify-center gap-1 h-full pb-2 min-w-[52px] active:opacity-70 transition-opacity duration-100"
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                  style={{ background: "rgba(212,175,55,0.55)" }}
                />
              )}
              <Icon
                className="w-5 h-5 transition-colors duration-150"
                style={{ color: active ? "#D4AF37" : "rgba(148,163,184,0.55)" }}
              />
              <span
                className="text-[9px] tracking-wide transition-colors duration-150"
                style={{ color: active ? "#D4AF37" : "rgba(148,163,184,0.45)" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
