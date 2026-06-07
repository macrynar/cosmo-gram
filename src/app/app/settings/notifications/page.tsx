"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Check, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Prefs = { email_horoscope: boolean };

export default function NotificationsPage() {
  const { session, user } = useAuth();
  const [prefs,   setPrefs]   = useState<Prefs>({ email_horoscope: true });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("user_preferences")
      .select("email_horoscope")
      .eq("user_id", user!.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPrefs({ email_horoscope: data.email_horoscope });
        setLoading(false);
      });
  }, [session, user]);

  async function save(next: Prefs) {
    if (!user) return;
    setSaving(true); setSaved(false);
    await supabase.from("user_preferences").upsert({
      user_id:         user.id,
      email_horoscope: next.email_horoscope,
      updated_at:      new Date().toISOString(),
    });
    setPrefs(next);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const SETTINGS_TABS = [
    { label: "Dane",         href: "/app/settings/profile" },
    { label: "Subskrypcja",  href: "/app/settings/subscription" },
    { label: "Powiadomienia",href: "/app/settings/notifications" },
    { label: "Prywatność",   href: "/app/settings/privacy" },
  ];

  return (
    <div className="min-h-screen text-white" style={{ background: "#050508" }}>
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <Navbar />

      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
          {SETTINGS_TABS.map(tab => {
            const active = tab.href === "/app/settings/notifications";
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300"
                style={active ? {
                  background: "rgba(212,175,55,0.12)",
                  border: "0.5px solid rgba(212,175,55,0.30)",
                  color: "#F3E5AB",
                } : {
                  color: "rgba(148,163,184,0.65)",
                  border: "0.5px solid rgba(255,255,255,0.06)",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: "rgba(5,4,14,0.72)", border: "0.5px solid rgba(212,175,55,0.16)", backdropFilter: "blur(24px)" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(212,175,55,0.10)", border: "0.5px solid rgba(212,175,55,0.25)" }}>
              <Bell className="w-4 h-4" style={{ color: "#D4AF37" }} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Powiadomienia email</h2>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="h-px mb-6" style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.15), transparent)" }} />

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Daily horoscope toggle */}
              <button
                onClick={() => save({ ...prefs, email_horoscope: !prefs.email_horoscope })}
                disabled={saving}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200 active:scale-[0.99]"
                style={{
                  background: prefs.email_horoscope ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)",
                  border: `0.5px solid rgba(212,175,55,${prefs.email_horoscope ? "0.22" : "0.08"})`,
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(212,175,55,0.08)", border: "0.5px solid rgba(212,175,55,0.15)" }}>
                  <Mail className="w-4 h-4" style={{ color: "#D4AF37" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Dzienny horoskop</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Każdego ranka o 8:00 — spersonalizowany horoskop dla Twojego znaku
                  </p>
                </div>
                {/* Toggle */}
                <div
                  className="w-11 h-6 rounded-full shrink-0 relative transition-all duration-250"
                  style={{
                    background: prefs.email_horoscope
                      ? "linear-gradient(135deg, #D4AF37, #C5A059)"
                      : "rgba(255,255,255,0.08)",
                    border: `0.5px solid rgba(212,175,55,${prefs.email_horoscope ? "0.5" : "0.15"})`,
                  }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-250"
                    style={{
                      background: prefs.email_horoscope ? "#050508" : "rgba(255,255,255,0.5)",
                      left: prefs.email_horoscope ? "calc(100% - 22px)" : "2px",
                    }}
                  />
                </div>
              </button>
            </div>
          )}

          {/* Save feedback */}
          {saved && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg"
              style={{ background: "rgba(34,197,94,0.07)", border: "0.5px solid rgba(34,197,94,0.20)" }}>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <p className="text-xs text-green-400">Zapisano</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          Możesz wypisać się też jednym kliknięciem bezpośrednio z maila.
        </p>
      </main>
    </div>
  );
}
