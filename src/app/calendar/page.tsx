import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Zap, ArrowRight, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kalendarz astrologiczny — Dni Mocy i tranzity planet — Cosmogram",
  description: "Odkryj Dni Mocy każdego miesiąca — momenty, kiedy układ planet sprzyja działaniu, decyzjom i rozmowom. Planuj z kosmiczną precyzją.",
  alternates: { canonical: "https://www.cosmo-gram.com/calendar" },
};

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Obliczamy tranzity",
    desc: "Każdego dnia analizujemy pozycje planet i ich relacje z Twoim kosmogramem natalnym.",
  },
  {
    num: "02",
    title: "Wyznaczamy Dni Mocy",
    desc: "Spośród wszystkich dni miesiąca wybieramy 5, w których układ planet szczególnie sprzyja Twojej energii.",
  },
  {
    num: "03",
    title: "Widzisz okna na działanie",
    desc: "Dostajesz konkretne podpowiedzi: kiedy rozmawiać, kiedy podpisywać umowy, kiedy odpuścić i nabrać sił.",
  },
];

const FEATURES = [
  { emoji: "⚡", label: "5 Dni Mocy miesięcznie", desc: "Pięć najlepszych dni do działania, precyzyjnie wyliczonych z Twojego kosmogramu." },
  { emoji: "🪐", label: "Tranzity planet", desc: "Na bieżąco śledzimy, jak planety wpływają na Twoje obszary życia." },
  { emoji: "🎯", label: "Okna tematyczne", desc: "Dni sprzyjające karierze, relacjom, finansom i odpoczynkowi — każde osobno oznaczone." },
  { emoji: "📅", label: "Widok miesięczny", desc: "Pełny podgląd kalendarza z zaznaczonymi momentami — planuj z wyprzedzeniem." },
];

export default function CalendarPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#050508" }}>
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(88,60,200,0.12) 0%, transparent 70%)" }}
      />
      <Navbar />

      <main className="relative z-10">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-16 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ color: "#a78bfa", background: "rgba(139,92,246,0.08)", border: "0.5px solid rgba(139,92,246,0.25)" }}
          >
            <CalendarDays className="w-3 h-3" />
            Kalendarz astrologiczny
          </div>

          <h1
            className="text-4xl sm:text-6xl font-semibold text-white leading-tight mb-5"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Przestań działać
            <br />
            <span style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              na ślepo.
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Kalendarz astrologiczny nanosi tranzity planet na Twój kosmogram i wskazuje Dni Mocy — momenty w miesiącu, kiedy układ gwiazd szczególnie sprzyja Twojej energii i działaniom.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}
          >
            <Zap className="w-4 h-4" />
            Zobacz swoje Dni Mocy
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="mt-3 text-xs text-slate-600">Dostępne po wygenerowaniu kosmogramu</p>
        </section>

        {/* Feature grid */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div
                key={f.label}
                className="flex gap-4 p-5 rounded-2xl"
                style={{ background: "rgba(5,4,14,0.65)", border: "0.5px solid rgba(139,92,246,0.18)" }}
              >
                <span className="text-2xl shrink-0">{f.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{f.label}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-slate-600 mb-10">Jak to działa</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(s => (
              <div key={s.num} className="text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono font-semibold mx-auto mb-4"
                  style={{ background: "rgba(139,92,246,0.12)", border: "0.5px solid rgba(139,92,246,0.30)", color: "#a78bfa" }}
                >
                  {s.num}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quote / emphasis */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 text-center">
          <div
            className="rounded-2xl p-8 sm:p-12"
            style={{ background: "rgba(139,92,246,0.05)", border: "0.5px solid rgba(139,92,246,0.20)" }}
          >
            <Star className="w-6 h-6 mx-auto mb-4" style={{ color: "#a78bfa", opacity: 0.6 }} />
            <p
              className="text-xl sm:text-2xl text-white leading-relaxed italic mb-2"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              „Timing is everything."
            </p>
            <p className="text-slate-500 text-sm">
              Wielcy przywódcy, artyści i przedsiębiorcy intuitywnie wyczuwali moment. Teraz masz do tego precyzyjne narzędzie.
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-28 text-center">
          <h2
            className="text-3xl sm:text-4xl font-semibold text-white mb-4"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Zacznij planować z gwiazdami.
          </h2>
          <p className="text-slate-400 mb-8">
            Wygeneruj kosmogram i odblokuj swój kalendarz astrologiczny — Dni Mocy czekają.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}
          >
            Utwórz konto za darmo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
