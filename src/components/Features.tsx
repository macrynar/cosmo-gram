"use client";

import Link from "next/link";
import { Star, CalendarDays, HeartHandshake, MessageCircle } from "lucide-react";

const FEATURES = [
  {
    id: "kosmogram",
    icon: Star,
    num: "01",
    title: "Kosmogram",
    subtitle: "Natalny i dziecięcy",
    description:
      "Pełna interpretacja wykresu urodzeniowego — osobowość, kariera, relacje, talenty i wyzwania. Konkretnie, po polsku, w nowoczesnym języku. Osobny moduł dla dzieci pomaga rodzicom rozumieć emocje i temperament malucha zamiast na oślep szukać odpowiedzi.",
    highlights: [
      "Kosmogram natalny w 7 obszarach życia",
      "Kosmogram dziecka — temperament i potrzeby",
      "Interpretacja AI oparta na Swiss Ephemeris",
    ],
    cta: { label: "Zobacz przykład", href: "/cosmogram" },
    accent: "rgba(212,175,55,0.18)",
    border: "rgba(212,175,55,0.28)",
    glow: "rgba(212,175,55,0.06)",
    iconColor: "#D4AF37",
  },
  {
    id: "kalendarz",
    icon: CalendarDays,
    num: "02",
    title: "Kalendarz astrologiczny",
    subtitle: "Dni Mocy i okna planetarne",
    description:
      "Każdy miesiąc zaznaczamy Twoje Dni Mocy — momenty, kiedy układ planet sprzyja działaniu, podejmowaniu decyzji lub rozmowom. Przestajesz działać na ślepo i zaczynasz planować z kosmiczną precyzją.",
    highlights: [
      "5 Dni Mocy każdego miesiąca",
      "Tranzity i okna sprzyjające działaniu",
      "Połączone z Twoim kosmogramem",
    ],
    cta: { label: "Zajrzyj do kalendarza", href: "/signup" },
    accent: "rgba(139,92,246,0.14)",
    border: "rgba(139,92,246,0.28)",
    glow: "rgba(139,92,246,0.05)",
    iconColor: "#a78bfa",
  },
  {
    id: "match",
    icon: HeartHandshake,
    num: "03",
    title: "Cosmo Match",
    subtitle: "Porównanie kosmogramów",
    description:
      "Porównaj dwa kosmogramy i dowiedz się, jak naprawdę działacie razem. Zobaczysz, gdzie jest synergia, gdzie są naturalne napięcia i jak je przepracować. Dla par, przyjaciół i partnerów biznesowych.",
    highlights: [
      "Wynik kompatybilności z wyjaśnieniem",
      "Mocne strony i obszary tarcia",
      "Konkretne wskazówki do relacji",
    ],
    cta: { label: "Sprawdź zgodność", href: "/match" },
    accent: "rgba(244,63,94,0.12)",
    border: "rgba(244,63,94,0.25)",
    glow: "rgba(244,63,94,0.04)",
    iconColor: "#fb7185",
  },
  {
    id: "chat",
    icon: MessageCircle,
    num: "04",
    title: "Cosmo Chat",
    subtitle: "Twój astrolog AI",
    description:
      "Rozmawiaj z AI zasilonym głęboką wiedzą astrologiczną — i nakarmianym Twoim kosmogramem. Pytaj o relacje, karierę, codzienne decyzje. Dostajesz odpowiedzi osadzone w Twoim układzie planet, nie generyczne porady spod znaku Barana.",
    highlights: [
      "AI nakarmiony wiedzą astrologiczną",
      "Odpowiedzi w kontekście Twojego kosmogramu",
      "Pytaj o cokolwiek, kiedy chcesz",
    ],
    cta: { label: "Porozmawiaj z astrologiem", href: "/signup" },
    accent: "rgba(34,197,94,0.10)",
    border: "rgba(34,197,94,0.22)",
    glow: "rgba(34,197,94,0.04)",
    iconColor: "#4ade80",
  },
];

export default function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="relative py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(10,8,25,0.5) 50%, transparent)" }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <p
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] font-medium mb-5 px-4 py-1.5 rounded-full"
            style={{ color: "#D4AF37", background: "rgba(212,175,55,0.08)", border: "0.5px solid rgba(212,175,55,0.25)" }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: "#D4AF37" }} />
            Funkcje
          </p>
          <h2
            id="features-heading"
            className="text-3xl sm:text-5xl font-semibold text-white leading-tight mb-4"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Jedna platforma,{" "}
            <span style={{
              background: "linear-gradient(135deg, #D4AF37 0%, #F3E5AB 50%, #C5A059 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              cztery moduły.
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-slate-400 text-base sm:text-lg leading-relaxed">
            Nie musisz skakać między aplikacjami. Tutaj masz cały ekosystem astrologiczny w jednym miejscu — z Twoim kosmogramem jako centrum.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <article
              key={f.id}
              id={f.id}
              className="group relative rounded-2xl p-7 sm:p-8 flex flex-col gap-5 transition-all duration-500"
              style={{
                background: `rgba(5,4,14,0.70)`,
                border: `0.5px solid ${f.border}`,
                backdropFilter: "blur(20px)",
                boxShadow: `0 0 0 0 ${f.glow}`,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 60px 0 ${f.accent}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${f.glow}`;
              }}
            >
              {/* Number badge */}
              <span
                className="absolute top-6 right-7 text-xs font-mono font-semibold tracking-widest"
                style={{ color: f.iconColor, opacity: 0.45 }}
              >
                {f.num}
              </span>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{ background: f.accent, border: `0.5px solid ${f.border}` }}
              >
                <f.icon className="w-5 h-5" style={{ color: f.iconColor }} strokeWidth={1.5} />
              </div>

              {/* Text */}
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.18em] mb-1" style={{ color: f.iconColor, opacity: 0.7 }}>
                  {f.subtitle}
                </p>
                <h3
                  className="text-2xl sm:text-3xl font-semibold text-white mb-3"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {f.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">
                  {f.description}
                </p>

                {/* Highlights */}
                <ul className="space-y-2 mb-6">
                  {f.highlights.map((hl) => (
                    <li key={hl} className="flex items-center gap-2.5 text-xs text-slate-500">
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: f.iconColor }} />
                      {hl}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <Link
                href={f.cta.href}
                className="self-start inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-300"
                style={{ color: f.iconColor }}
              >
                {f.cta.label}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 6h7m0 0L6.5 3m3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>

              {/* Bottom glow line */}
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px transition-all duration-500"
                style={{
                  background: `linear-gradient(to right, transparent, ${f.iconColor}33, transparent)`,
                  opacity: 0,
                }}
              />
            </article>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-[#050508] transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.35)] hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #D4AF37, #C5A059)" }}
          >
            Zacznij za darmo
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium text-slate-300 transition-all duration-300 hover:text-[#F3E5AB]"
            style={{ border: "0.5px solid rgba(212,175,55,0.20)" }}
          >
            Zobacz cennik
          </Link>
        </div>
      </div>
    </section>
  );
}
