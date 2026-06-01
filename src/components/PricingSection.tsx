"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import PaywallModal from "@/components/PaywallModal";

const freePlan = [
  "Pełny kosmogram natalny z wykresem",
  "Interpretacja AI kluczowych pozycji",
  "Astro Match dla jednej pary",
  "Dzienny horoskop (1 dziennie)",
];

const proPlan = [
  "Pełna interpretacja kosmogramu (7 sekcji)",
  "Pełny Astro Match + red flags i potencjały",
  "Horoskop dziecka z naciskiem na potrzeby emocjonalne",
  "Astro Chat z kontekstem Twojego kosmogramu",
  "Priorytetowe generowanie i dłuższe odpowiedzi AI",
];

export default function PricingSection() {
  const { session } = useAuth();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);

  function handlePlusCTA() {
    if (session) {
      setShowPaywall(true);
    } else {
      router.push("/signup");
    }
  }

  return (
    <section id="pricing" className="relative py-24 sm:py-28">
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a140d]/30 to-transparent pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="inline-block text-xs uppercase tracking-[0.25em] text-amber-300 font-medium mb-4 px-3 py-1 rounded-full border border-amber-700/30 bg-amber-900/10">
            Plany i ceny
          </p>
          <h2 className="font-brand text-3xl sm:text-5xl font-semibold text-white">
            Zacznij za darmo. <span className="gradient-text">Przejdź na pełną wersję, gdy chcesz więcej.</span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-slate-400 text-base sm:text-lg">
            Jasny podział: wersja Free do startu i wersja Płatna dla osób, które chcą głębszej pracy z kosmogramem.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <article className="glass-card rounded-2xl p-7 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-slate-400">Plan</p>
                <h3 className="text-2xl text-white font-semibold">Free</h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">Bez opłat</span>
            </div>

            <p className="text-3xl font-bold text-white mb-5">0 zł</p>

            <ul className="space-y-3 mb-7">
              {freePlan.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 mt-0.5 text-green-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/signup" className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 hover:bg-white/10 transition-colors">
              Startuję za darmo
            </Link>
          </article>

          <article className="glass-card rounded-2xl p-7 border border-amber-500/40 bg-gradient-to-b from-amber-900/20 to-transparent relative overflow-hidden">
            <div aria-hidden="true" className="absolute -top-16 -right-14 w-40 h-40 rounded-full bg-amber-500/20 blur-3xl" />
            <div className="flex items-center justify-between mb-5 relative z-10">
              <div>
                <p className="text-sm text-amber-300">Plan</p>
                <h3 className="text-2xl text-white font-semibold flex items-center gap-2">
                  Plus
                  <Crown className="w-5 h-5 text-amber-400" />
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200">
                ✦ Early Access
              </span>
            </div>

            <div className="mb-5 relative z-10">
              <div className="flex items-baseline gap-1.5">
                <p className="text-3xl font-bold text-white">19,90 zł</p>
                <span className="text-slate-400 text-base">/ miesiąc</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                lub <span className="text-amber-300 font-medium">199 zł / rok</span>
                <span className="ml-1.5 text-xs text-slate-500">≈ 16,60 zł/mc · oszczędzasz -17%</span>
              </p>
              <p className="text-xs text-amber-400/70 mt-1.5">Anuluj kiedy chcesz · bezpieczna płatność Stripe</p>
            </div>

            <ul className="space-y-3 mb-7 relative z-10">
              {proPlan.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-100">
                  <CosmoIcon className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={handlePlusCTA}
              className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white hover:from-amber-600 hover:to-amber-400 transition-colors relative z-10"
            >
              Kup Cosmogram Plus
            </button>
          </article>
        </div>
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </section>
  );
}
