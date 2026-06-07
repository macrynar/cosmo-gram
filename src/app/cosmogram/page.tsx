import type { Metadata } from "next";
import Link from "next/link";
import { Star, Baby, Sparkles, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kosmogram — mapa urodzeniowa i kosmogram dziecka — Cosmogram",
  description: "Pełna interpretacja AI Twojego wykresu urodzeniowego: osobowość, relacje, kariera, talenty. Dostępny też kosmogram dziecka — temperament i potrzeby emocjonalne.",
  alternates: { canonical: "https://www.cosmo-gram.com/cosmogram" },
};

const ASPECTS = [
  { emoji: "☀️", label: "Słońce", desc: "Twoja tożsamość i cel życiowy" },
  { emoji: "🌙", label: "Księżyc", desc: "Emocje, intuicja, wzorce z dzieciństwa" },
  { emoji: "⬆️", label: "Ascendent", desc: "Maska i pierwsze wrażenie" },
  { emoji: "♀️", label: "Wenus", desc: "Miłość, piękno, wartości" },
  { emoji: "♂️", label: "Mars", desc: "Energia, ambicja, seksualność" },
  { emoji: "♃", label: "Jowisz", desc: "Szczęście, ekspansja, filozofia" },
];

const SECTIONS = [
  {
    num: "01",
    title: "Kosmogram natalny",
    icon: Star,
    color: "#D4AF37",
    desc: "Pełna interpretacja wykresu urodzeniowego — obliczona na podstawie precyzyjnych danych astronomicznych Swiss Ephemeris. Dostajesz nie horoskop ze znaku, ale mapę wszystkich planet w Twoim układzie.",
    bullets: [
      "Osobowość i rdzeń tożsamości",
      "Wzorce emocjonalne i relacyjne",
      "Kariera i talenty — gdzie błyszczycie",
      "Wyzwania i ukryte zasoby",
      "Komunikacja i styl wyrażania siebie",
      "Finanse i podejście do materialności",
      "Ścieżka rozwoju duchowego",
    ],
  },
  {
    num: "02",
    title: "Kosmogram dziecka",
    icon: Baby,
    color: "#6ee7b7",
    desc: "Interpretacja skupiona na tym, czego potrzebuje dziecko — nie na tym, kim będzie. Pomaga rodzicom rozumieć emocje, temperament i sposób uczenia się malucha zamiast szukać odpowiedzi po omacku.",
    bullets: [
      "Temperament i naturalne skłonności",
      "Potrzeby emocjonalne i styl przywiązania",
      "Jak dziecko uczy się najlepiej",
      "Potencjalne obszary napięć",
      "Wskazówki dla rodzica — konkretne i praktyczne",
    ],
  },
];

export default function CosmogramPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#050508" }}>
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(88,60,140,0.15) 0%, transparent 70%)" }}
      />
      <Navbar />

      <main className="relative z-10">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-16 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ color: "#D4AF37", background: "rgba(212,175,55,0.08)", border: "0.5px solid rgba(212,175,55,0.25)" }}
          >
            <Star className="w-3 h-3" />
            Kosmogram
          </div>

          <h1
            className="text-4xl sm:text-6xl font-semibold text-white leading-tight mb-5"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Twoja mapa nieba
            <br />
            <span style={{
              background: "linear-gradient(135deg, #D4AF37 0%, #F3E5AB 50%, #C5A059 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              z chwili urodzenia.
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Kosmogram natalny to nie horoskop pod znak Barana. To precyzyjna mapa wszystkich planet w momencie Twoich narodzin — interpretowana przez AI z głęboką wiedzą astrologiczną, po polsku.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-semibold text-[#050508] transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #D4AF37, #C5A059)" }}
          >
            <Sparkles className="w-4 h-4" />
            Wygeneruj swój kosmogram
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="mt-3 text-xs text-slate-600">Bezpłatnie · Gotowy w kilkanaście sekund</p>
        </section>

        {/* Planet grid */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-slate-600 mb-6">Co analizuje Twój kosmogram</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ASPECTS.map(a => (
              <div
                key={a.label}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                style={{ background: "rgba(5,4,14,0.65)", border: "0.5px solid rgba(212,175,55,0.12)" }}
              >
                <span className="text-xl shrink-0">{a.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-white">{a.label}</p>
                  <p className="text-xs text-slate-600 leading-tight">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature sections */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-6">
          {SECTIONS.map(s => (
            <div
              key={s.num}
              className="rounded-2xl p-7 sm:p-10"
              style={{ background: "rgba(5,4,14,0.70)", border: `0.5px solid ${s.color}30`, backdropFilter: "blur(24px)" }}
            >
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${s.color}15`, border: `0.5px solid ${s.color}35` }}
                >
                  <s.icon className="w-5 h-5" style={{ color: s.color }} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xs font-mono" style={{ color: s.color, opacity: 0.6 }}>{s.num}</p>
                  <h2
                    className="text-2xl sm:text-3xl font-semibold text-white"
                    style={{ fontFamily: "var(--font-cormorant), serif" }}
                  >
                    {s.title}
                  </h2>
                </div>
              </div>

              <div className="h-px mb-6" style={{ background: `linear-gradient(to right, transparent, ${s.color}20, transparent)` }} />

              <p className="text-slate-400 text-base leading-relaxed mb-6">{s.desc}</p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {s.bullets.map(b => (
                  <li key={b} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ background: s.color }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Bottom CTA */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-28 text-center">
          <div
            className="rounded-2xl p-10"
            style={{ background: "rgba(212,175,55,0.05)", border: "0.5px solid rgba(212,175,55,0.20)" }}
          >
            <h2
              className="text-3xl sm:text-4xl font-semibold text-white mb-4"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              Gotowy zobaczyć swój kosmogram?
            </h2>
            <p className="text-slate-400 mb-8">
              Potrzebujesz tylko daty, godziny i miejsca urodzenia. Interpretacja gotowa w kilkanaście sekund.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-[#050508] transition-all duration-300 hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #D4AF37, #C5A059)" }}
            >
              Zacznij za darmo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
