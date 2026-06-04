"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ModuleCard from "./ModuleCard";
import PaywallModal from "@/components/PaywallModal";
import type { AstroModule } from "@/lib/schemas/astroModule";
import type { NatalChart } from "@/lib/astro-types";
import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";

type ReadingMeta = {
  id:           string;
  birth_date:   string;
  birth_time:   string;
  birth_place:  string;
  chart_data:   NatalChart;
};

interface Props {
  reading:       ReadingMeta;
  isPremiumUser: boolean;
}

export default function KartaZawodnika({ reading, isPremiumUser }: Props) {
  const [modules,      setModules]      = useState<AstroModule[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [generated,    setGenerated]    = useState(false);
  const [showPaywall,  setShowPaywall]  = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Brak sesji — zaloguj się ponownie.");

      const bd = reading.chart_data.birthData;

      // 1. Get placements / aspects / nodes
      const chartRes = await fetch("/api/chart", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date:        reading.birth_date,
          time:        reading.birth_time,
          lat:         bd.lat,
          lng:         bd.lng,
          place:       reading.birth_place,
          timeUnknown: bd.timeUnknown,
        }),
      });
      if (!chartRes.ok) throw new Error("Błąd pobierania danych wykresu");

      const { placements, aspects, nodes } = await chartRes.json() as {
        placements: ChartPlacement[];
        aspects:    NatalAspect[];
        nodes:      ChartNodes;
      };

      // 2. Generate / load from cache
      const kartaRes = await fetch("/api/natal-karta", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          chart_id:            reading.id,
          natal_data:          { placements, aspects, nodes },
          hasExactTime:        !bd.timeUnknown,
          birthYear:           new Date(reading.birth_date).getFullYear(),
          grammatical_form:    "neutralna",
          locationPrecisionKm: 10,
        }),
      });
      if (!kartaRes.ok) throw new Error("Błąd generowania karty — spróbuj ponownie.");

      const { modules: mods } = await kartaRes.json() as { modules: AstroModule[] };
      setModules(mods);
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Entry CTA ── */}
      {!generated && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl p-8 sm:p-10 text-center"
          style={{
            background:    "radial-gradient(ellipse at 50% 0%, rgba(91,44,143,0.15) 0%, rgba(5,4,14,0.70) 100%)",
            border:        "0.5px solid rgba(212,175,55,0.18)",
            backdropFilter: "blur(18px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(91,44,143,0.28))",
              border:     "0.5px solid rgba(212,175,55,0.40)",
              boxShadow:  "0 0 32px rgba(212,175,55,0.12)",
            }}
          >
            <Sparkles className="w-6 h-6" style={{ color: "#D4AF37" }} />
          </motion.div>

          <h3
            className="text-2xl font-medium text-white mb-2"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Karta Astrologiczna
          </h3>
          <p className="text-slate-500 text-sm mb-1 max-w-sm mx-auto">
            8 głębokich modułów interpretacji Twojego kosmogramu.
          </p>
          <p className="text-slate-600 text-xs mb-7 max-w-xs mx-auto">
            Tożsamość · Supermoce · Korzenie · Miłość · Kariera · Cienie · Misja
          </p>

          {error && (
            <p className="text-red-400/80 text-xs mb-4">{error}</p>
          )}

          <motion.button
            onClick={handleGenerate}
            whileHover={{ boxShadow: "0 0 32px rgba(212,175,55,0.32), 0 0 64px rgba(212,175,55,0.10)", y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3.5 rounded-2xl text-sm font-semibold tracking-wide"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.92), rgba(197,160,89,0.92))",
              color:      "#050508",
              border:     "0.5px solid rgba(212,175,55,0.65)",
            }}
          >
            Generuj Kartę Astrologiczną
          </motion.button>
        </motion.div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: "rgba(5,4,14,0.65)", border: "0.5px solid rgba(212,175,55,0.14)" }}
        >
          <div
            className="w-12 h-12 rounded-full animate-spin border-2 mx-auto mb-4"
            style={{ borderColor: "rgba(212,175,55,0.12)", borderTopColor: "#D4AF37" }}
          />
          <p className="text-slate-400 text-sm mb-1">Generuję Twoją Kartę Astrologiczną…</p>
          <p className="text-slate-600 text-xs">8 modułów · 3 batche · może zająć 20–40 s</p>
        </div>
      )}

      {/* ── Error retry (after generated failed) ── */}
      {error && !loading && !generated && (
        <p className="text-center text-xs text-red-400/70">{error}</p>
      )}

      {/* ── Module grid ── */}
      <AnimatePresence>
        {generated && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-2"
            >
              <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.45)" }}>
                Karta Astrologiczna · {modules.length} modułów
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modules.map((mod, i) => (
                <ModuleCard
                  key={mod.id}
                  module={mod}
                  isPremiumUser={isPremiumUser}
                  index={i}
                  onPaywall={() => setShowPaywall(true)}
                />
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          reason="Odblokuj wszystkie 8 modułów Karty Astrologicznej."
        />
      )}
    </div>
  );
}
