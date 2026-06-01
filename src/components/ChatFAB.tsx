"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export default function ChatFAB() {
  const pathname = usePathname();
  if (pathname === "/app/chat" || pathname.startsWith("/app/chat/")) return null;

  return (
    <Link
      href="/app/chat"
      aria-label="Otwórz chat z astrologiem AI"
      className="fixed bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 sm:px-4 px-3 py-3 rounded-full bg-[#0b0719]/90 border border-amber-700/40 text-amber-200 shadow-lg shadow-black/40 hover:bg-amber-900/25 hover:border-amber-600/60 hover:text-white backdrop-blur-xl transition-all duration-200 group"
    >
      <MessageCircle className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
      <span className="hidden sm:inline text-sm font-medium">Chat</span>
    </Link>
  );
}
