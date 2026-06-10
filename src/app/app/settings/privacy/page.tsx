"use client";

import { useState } from "react";
import { Download, Trash2, Loader2, AlertTriangle, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SETTINGS_TABS = [
  { label: "Dane",          href: "/app/settings/profile" },
  { label: "Subskrypcja",   href: "/app/settings/subscription" },
  { label: "Powiadomienia", href: "/app/settings/notifications" },
  { label: "Prywatność",    href: "/app/settings/privacy" },
];

export default function SettingsPrivacyPage() {
  const { session } = useAuth();
  const pathname = usePathname();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteStep, setDeleteStep]       = useState<"idle" | "confirm" | "loading" | "done">("idle");
  const [confirmText, setConfirmText]     = useState("");

  const authHeader: Record<string, string> = session ? { Authorization: `Bearer ${session.access_token}` } : {};

  async function handleExport() {
    if (!session) return;
    setExportLoading(true);
    try {
      const res = await fetch("/api/export-data", { headers: authHeader });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cosmogram-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!session || confirmText.trim().toLowerCase() !== "usuń konto") return;
    setDeleteStep("loading");
    try {
      const res = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: authHeader,
      });
      if (!res.ok) {
        setDeleteStep("confirm");
        return;
      }
      await supabase.auth.signOut();
      setDeleteStep("done");
    } catch {
      setDeleteStep("confirm");
    }
  }

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <Navbar />

      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20 space-y-6">

        <div className="mb-2">
          <h1 className="text-2xl font-bold text-white font-brand">Ustawienia</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {SETTINGS_TABS.map(tab => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="shrink-0 px-4 py-2 rounded-xl text-sm transition-all duration-200"
                style={active ? {
                  background: "rgba(212,175,55,0.14)",
                  border: "0.5px solid rgba(212,175,55,0.35)",
                  color: "#D4AF37",
                } : {
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.06)",
                  color: "#64748b",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Prywatność i dane</h2>
          <p className="text-slate-500 text-sm mt-0.5">Zarządzaj swoimi danymi zgodnie z RODO</p>
        </div>

        {/* Data export */}
        <section className="glass-card rounded-2xl p-6 border border-white/8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.12)" }}>
              <Download className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-white font-semibold">Eksport danych</h2>
          </div>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            Pobierz wszystkie swoje dane w formacie JSON — kosmogramy, wyniki matchów, historię czatu, notatki z kalendarza i dane konta. Prawo do przenoszenia danych (RODO art. 20).
          </p>
          <button
            onClick={handleExport}
            disabled={exportLoading || !session}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all duration-200 disabled:opacity-40"
            style={{ background: "rgba(212,175,55,0.10)", border: "0.5px solid rgba(212,175,55,0.30)", color: "#D4AF37" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.16)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.10)"; }}
          >
            {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Pobierz moje dane
          </button>
        </section>

        {/* Account deletion */}
        <section className="glass-card rounded-2xl p-6 border border-red-900/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.10)" }}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-white font-semibold">Usuń konto</h2>
          </div>

          {deleteStep === "done" ? (
            <div className="flex items-center gap-2 text-green-300 text-sm">
              <Check className="w-4 h-4" />
              Konto zostało usunięte. Do zobaczenia wśród gwiazd.
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Trwale usuwa Twoje konto i wszystkie zapisane dane — kosmogramy, matche, historię czatu, notatki i preferencje. Subskrypcja zostanie automatycznie anulowana. Tej operacji nie można cofnąć. Prawo do usunięcia danych (RODO art. 17).
              </p>

              {deleteStep === "idle" && (
                <button
                  onClick={() => setDeleteStep("confirm")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all duration-200"
                  style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.14)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
                >
                  <Trash2 className="w-4 h-4" />
                  Usuń konto
                </button>
              )}

              {(deleteStep === "confirm" || deleteStep === "loading") && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.07)", border: "0.5px solid rgba(239,68,68,0.22)" }}>
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-300">Ta operacja jest nieodwracalna. Wpisz <strong>usuń konto</strong> żeby potwierdzić.</p>
                  </div>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="usuń konto"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/40 transition-colors"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={confirmText.trim().toLowerCase() !== "usuń konto" || deleteStep === "loading"}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "rgba(239,68,68,0.18)", border: "0.5px solid rgba(239,68,68,0.40)", color: "#fca5a5" }}
                    >
                      {deleteStep === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Potwierdzam usunięcie
                    </button>
                    <button
                      onClick={() => { setDeleteStep("idle"); setConfirmText(""); }}
                      className="px-5 py-2.5 rounded-xl text-sm text-slate-400 transition-colors hover:text-slate-200"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Links */}
        <div className="flex gap-4 text-xs text-slate-600">
          <Link href="/privacy" className="hover:text-slate-400 transition-colors">Polityka prywatności</Link>
          <Link href="/cookies" className="hover:text-slate-400 transition-colors">Polityka cookies</Link>
          <a href="mailto:hello@cosmo-gram.com" className="hover:text-slate-400 transition-colors">hello@cosmo-gram.com</a>
        </div>

      </main>
    </div>
  );
}
