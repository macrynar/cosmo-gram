"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { track } from "@/components/PostHogProvider";
import { PLAN_PRICES } from "@/lib/pricing";

export default function PaywallTeaser() {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl">
      {/* Grayscale blurred background hint */}
      <div className="absolute inset-0 bg-[#0d0a1a] flex items-center justify-center">
        <div className="w-full h-full opacity-20 grayscale pointer-events-none">
          {/* Decorative lines suggesting the map */}
          <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="800" height="400" fill="#1a1025" />
            {[...Array(6)].map((_, i) => (
              <line key={i} x1={i * 140} y1="0" x2={i * 140 + 60} y2="400"
                stroke="#c89968" strokeWidth="1.5" strokeOpacity="0.6" />
            ))}
            {[...Array(3)].map((_, i) => (
              <path key={i} d={`M 0 ${100 + i * 80} Q 400 ${60 + i * 80} 800 ${100 + i * 80}`}
                fill="none" stroke="#c4b5fd" strokeWidth="1.2" strokeOpacity="0.5" />
            ))}
          </svg>
        </div>
        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-[#0d0a1a]/70" />
      </div>

      {/* Paywall CTA */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center max-w-sm w-full shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-900/30 border border-amber-700/40 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-white font-brand mb-2">
            Odblokuj Cosmo Map
          </h2>
          <p className="text-sm text-slate-400 mb-1">
            Twoja osobista mapa mocy planetarnej w 53 krajach.
          </p>
          <p className="text-xs text-slate-500 mb-5">
            Filtruj po intencji, szukaj miast, porównuj z bliską osobą.
          </p>
          <div className="text-2xl font-bold text-amber-300 mb-1">{PLAN_PRICES.monthly.amount}<span className="text-base font-normal text-slate-400">/mc</span></div>
          <p className="text-xs text-amber-500/70 mb-5">Anuluj kiedy chcesz · bezpieczna płatność Stripe</p>
          <Link
            href={ROUTES.app.settingsSubscription.path}
            onClick={() => track("cosmo_map_paywall_cta_clicked", {})}
            className="block w-full px-5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-lg shadow-amber-950/40 hover:shadow-amber-800/50 hover:scale-[1.02] transition-all duration-200"
          >
            Kup Cosmogram Plus
          </Link>
        </div>
      </div>
    </div>
  );
}
