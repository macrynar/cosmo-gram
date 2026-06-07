import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, ArrowRight, Users, Briefcase } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cosmo Match — kompatybilność kosmogramów dla par i przyjaciół — Cosmogram",
  description: "Porównaj dwa kosmogramy i dowiedz się, jak naprawdę działacie razem. Synastria dla par, przyjaciół i partnerów — pełna mapa relacji w kilkanaście sekund.",
  alternates: { canonical: "https://www.cosmo-gram.com/match" },
};

const USE_CASES = [
  {
    icon: HeartHandshake,
    label: "Pary romantyczne",
    desc: "Gdzie jest chemia, gdzie są naturalne napięcia i jak je przepracować. Bez złudzeń, ale z nadzieją.",
  },
  {
    icon: Users,
    label: "Przyjaźnie i rodzina",
    desc: "Dlaczego z jedną osobą rozmawiasz godzinami, a z inną po 5 minutach nie masz już co powiedzieć.",
  },
  {
    icon: Briefcase,
    label: "Partnerzy biznesowi",
    desc: "Jak uzupełniają się Wasze style działania, kto lepiej widzi detale, kto myśli strategicznie.",
  },
];

const WHAT_YOU_GET = [
  { emoji: "🔗", label: "Wynik kompatybilności", desc: "Procentowy wynik z wyjaśnieniem — co go buduje, co obniża." },
  { emoji: "✨", label: "Synergie", desc: "Miejsca, gdzie Wasze planety wzmacniają się nawzajem." },
  { emoji: "⚡", label: "Napięcia", desc: "Obszary tarcia — i jak je świadomie przepracować." },
  { emoji: "💬", label: "Komunikacja", desc: "Jak rozmawiać, żeby się naprawdę rozumieć — nie tylko słyszeć." },
  { emoji: "❤️", label: "Styl miłości", desc: "Jak każde z was daje i odbiera miłość — Wenus i Księżyc w synastrze." },
  { emoji: "🎯", label: "Wskazówki praktyczne", desc: "Konkretne rady, nie poetyckie ogólniki." },
];

export default function MatchPublicPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#050508" }}>
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(180,30,80,0.12) 0%, transparent 70%)" }}
      />
      <Navbar />

      <main className="relative z-10">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-16 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ color: "#fb7185", background: "rgba(244,63,94,0.08)", border: "0.5px solid rgba(244,63,94,0.25)" }}
          >
            <HeartHandshake className="w-3 h-3" />
            Cosmo Match
          </div>

          <h1
            className="text-4xl sm:text-6xl font-semibold text-white leading-tight mb-5"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Jak naprawdę
            <br />
            <span style={{
              background: "linear-gradient(135deg, #fb7185 0%, #fda4af 50%, #e11d48 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              działacie razem.
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Cosmo Match porównuje dwa kosmogramy i tworzy pełną mapę relacji — synergie, napięcia, styl komunikacji i miłości. Więcej niż „Waga i Byk pasują". Twoje planety z planetami drugiej osoby.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(244,63,94,0.35)] hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #e11d48, #fb7185)" }}
          >
            <HeartHandshake className="w-4 h-4" />
            Sprawdź kompatybilność
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="mt-3 text-xs text-slate-600">Potrzebujesz daty urodzenia obu osób</p>
        </section>

        {/* Use cases */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-slate-600 mb-8">Dla kogo</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {USE_CASES.map(u => (
              <div
                key={u.label}
                className="rounded-2xl p-6 text-center"
                style={{ background: "rgba(5,4,14,0.65)", border: "0.5px solid rgba(244,63,94,0.18)" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(244,63,94,0.10)", border: "0.5px solid rgba(244,63,94,0.22)" }}
                >
                  <u.icon className="w-5 h-5" style={{ color: "#fb7185" }} strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{u.label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What you get */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          <div
            className="rounded-2xl p-7 sm:p-10"
            style={{ background: "rgba(5,4,14,0.70)", border: "0.5px solid rgba(244,63,94,0.22)", backdropFilter: "blur(24px)" }}
          >
            <h2
              className="text-2xl sm:text-3xl font-semibold text-white mb-2"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              Co dostajesz w analizie
            </h2>
            <div className="h-px my-5" style={{ background: "linear-gradient(to right, transparent, rgba(244,63,94,0.25), transparent)" }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WHAT_YOU_GET.map(w => (
                <div key={w.label} className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">{w.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{w.label}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Emphasis */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 text-center">
          <p
            className="text-2xl sm:text-3xl text-white leading-relaxed italic"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            „Nie chodzi o to, czy pasujecie — <br />
            <span style={{ color: "#fb7185" }}>chodzi o to, jak rozumieć siebie nawzajem."</span>
          </p>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-28 text-center">
          <div
            className="rounded-2xl p-10"
            style={{ background: "rgba(244,63,94,0.04)", border: "0.5px solid rgba(244,63,94,0.18)" }}
          >
            <h2
              className="text-3xl sm:text-4xl font-semibold text-white mb-4"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              Zbadaj swoją relację.
            </h2>
            <p className="text-slate-400 mb-8">
              Utwórz konto, wygeneruj kosmogram i porównaj go z kim chcesz — partnerem, przyjacielem, rodzicem.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #e11d48, #fb7185)" }}
            >
              Utwórz konto za darmo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
