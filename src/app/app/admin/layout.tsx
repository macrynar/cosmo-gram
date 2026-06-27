"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/app/admin/prompts", label: "Prompty" },
  { href: "/app/admin/evals", label: "Ewaluacje" },
  { href: "/app/admin/golden", label: "Golden Tests" },
  { href: "/app/admin/few-shots", label: "Few-shot" },
  { href: "/app/admin/ai-cost", label: "Koszt AI" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) { router.replace("/login"); return; }

    fetch("/api/admin-prompt", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => {
        if (r.status === 403) { router.replace("/app/cosmogram"); return; }
        setIsAdmin(true);
      })
      .catch(() => router.replace("/app/cosmogram"));
  }, [session, loading, router]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#03010d] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03010d] text-slate-200">
      <nav className="border-b border-slate-800 px-6 py-3 flex items-center gap-6">
        <span className="text-amber-400 font-bold text-sm">Admin</span>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`text-sm ${pathname?.startsWith(n.href) ? "text-white font-medium" : "text-slate-400 hover:text-slate-200"}`}
          >
            {n.label}
          </Link>
        ))}
        <Link href="/app/cosmogram" className="ml-auto text-sm text-slate-500 hover:text-slate-300">
          ← Aplikacja
        </Link>
      </nav>
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
