import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, ArrowRight, Sparkles, Brain } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cosmo Chat — Twój astrolog AI — Cosmogram",
  description: "Rozmawiaj z AI nakarmianym głęboką wiedzą astrologiczną i Twoim kosmogramem. Pytaj o relacje, karierę, codzienne decyzje — dostajesz odpowiedzi osadzone w Twoim układzie planet.",
  alternates: { canonical: "https://www.cosmo-gram.com/cosmo-chat" },
};

const EXAMPLES = [
  { q: "Dlaczego tak trudno mi zakończyć tę relację?", tag: "Relacje" },
  { q: "Czy to dobry moment na zmianę pracy?", tag: "Kariera" },
  { q: "Skąd biorą się moje problemy z granicami?", tag: "Rozwój" },
  { q: "Jak reagować na krytykę bez zamykania się?", tag: "Komunikacja" },
];

const FEATURES = [
  {
    icon: Brain,
    title: "Głęboka wiedza astrologiczna",
    desc: "AI nakarmiony tysiącami stron astrologii klasycznej, psychologicznej i ewolucyjnej. Nie odpowiada ogólnikami — zna kontekst.",
  },
  {
    icon: Sparkles,
    title: "Osadzony w Twoim kosmogramie",
    desc: "Każda odpowiedź uwzględnia Twoje planety, aspekty i tranzity. To nie rada spod znaku Barana — to analiza Twojego układu.",
  },
  {
    icon: MessageCircle,
    title: "Naturalny dialog",
    desc: "Pytaj jak do przyjaciela. Możesz pogłębiać, doprecyzowywać, wracać do wcześniejszych tematów. AI pamięta kontekst rozmowy.",
  },
];

export default function CosmoChatPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#050508" }}>
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(20,160,80,0.10) 0%, transparent 70%)" }}
      />
      <Navbar />

      <main className="relative z-10">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-16 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ color: "#4ade80", background: "rgba(34,197,94,0.08)", border: "0.5px solid rgba(34,197,94,0.22)" }}
          >
            <MessageCircle className="w-3 h-3" />
            Cosmo Chat
          </div>

          <h1
            className="text-4xl sm:text-6xl font-semibold text-white leading-tight mb-5"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Twój prywatny
            <br />
            <span style={{
              background: "linear-gradient(135deg, #4ade80 0%, #86efac 50%, #16a34a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              astrolog AI.
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Rozmawiaj z AI zasilonym najlepszą wiedzą astrologiczną — i nakarmianym Twoim kosmogramem. Pytasz o cokolwiek, dostajesz odpowiedź osadzoną w Twoim układzie planet. Nie generyczne porady. Twój kontekst.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-semibold text-[#050508] transition-all duration-300 hover:shadow-[0_0_40px_rgba(74,222,128,0.35)] hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}
          >
            <MessageCircle className="w-4 h-4" />
            Zacznij rozmowę
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="mt-3 text-xs text-slate-600">Dostępny po wygenerowaniu kosmogramu</p>
        </section>

        {/* Example questions */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-slate-600 mb-6">O co możesz pytać</p>
          <div className="space-y-3">
            {EXAMPLES.map(e => (
              <div
                key={e.q}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                style={{ background: "rgba(5,4,14,0.65)", border: "0.5px solid rgba(34,197,94,0.14)" }}
              >
                <span
                  className="shrink-0 text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(34,197,94,0.10)", color: "#4ade80", border: "0.5px solid rgba(34,197,94,0.22)" }}
                >
                  {e.tag}
                </span>
                <p className="text-slate-300 text-sm italic">„{e.q}"</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="rounded-2xl p-6"
                style={{ background: "rgba(5,4,14,0.70)", border: "0.5px solid rgba(34,197,94,0.18)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(34,197,94,0.10)", border: "0.5px solid rgba(34,197,94,0.22)" }}
                >
                  <f.icon className="w-4.5 h-4.5" style={{ color: "#4ade80" }} strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Differentiator */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          <div
            className="rounded-2xl p-8 sm:p-12"
            style={{ background: "rgba(34,197,94,0.04)", border: "0.5px solid rgba(34,197,94,0.18)" }}
          >
            <p
              className="text-2xl sm:text-3xl text-white leading-relaxed mb-6 text-center"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              Inni chatboty mówią ogólnie.
              <br />
              <span style={{ color: "#4ade80" }}>Cosmo Chat mówi o Tobie.</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-slate-600 text-xs uppercase tracking-widest mb-3">Generyczny chatbot</p>
                {["Porady pod znak Barana", "Ogólne wskazówki bez kontekstu", "Odpowiedzi z internetu"].map(t => (
                  <p key={t} className="text-slate-600 flex items-center gap-2">
                    <span className="text-red-500/50">✕</span> {t}
                  </p>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Cosmo Chat</p>
                {["Analiza Twojego układu planet", "Odpowiedzi w Twoim kontekście", "Wiedza astrologiczna + AI"].map(t => (
                  <p key={t} className="text-slate-300 flex items-center gap-2">
                    <span style={{ color: "#4ade80" }}>✓</span> {t}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-28 text-center">
          <h2
            className="text-3xl sm:text-4xl font-semibold text-white mb-4"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Zadaj pierwsze pytanie.
          </h2>
          <p className="text-slate-400 mb-8">
            Utwórz konto, wygeneruj kosmogram i zacznij rozmawiać z Cosmo Chat — Twoim osobistym astrologiem AI.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-[#050508] transition-all duration-300 hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}
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
