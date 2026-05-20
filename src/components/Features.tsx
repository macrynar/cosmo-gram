import Link from "next/link";
import { Compass, HeartHandshake, Baby, MessageCircle, Sun } from "lucide-react";

const features = [
  {
    icon: Compass,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-900/20 border-amber-700/30",
    glowColor: "hover:border-amber-500/30",
    badge: "01",
    title: "Kosmogram natalny",
    description:
      "Pełna interpretacja wykresu urodzeniowego: osobowość, relacje, kariera, potencjały i wyzwania. Konkretnie i zrozumiale.",
    highlights: ["Interpretacja AI w 7 sekcjach", "Praktyczne wnioski", "Nowoczesny język po polsku"],
  },
  {
    icon: Sun,
    iconColor: "text-amber-300",
    iconBg: "bg-amber-900/20 border-amber-700/30",
    glowColor: "hover:border-amber-500/30",
    badge: "02",
    title: "Horoskop dzienny",
    description:
      "Codzienny horoskop osadzony w Twoim kosmogramie — nie pod znak zodiaku, ale spersonalizowany dla Twojego układu planet.",
    highlights: ["Każdy dzień inaczej", "Oparty na Twoich danych", "Gotowy od rana"],
  },
  {
    icon: HeartHandshake,
    iconColor: "text-amber-300",
    iconBg: "bg-amber-900/20 border-amber-700/30",
    glowColor: "hover:border-amber-500/30",
    badge: "03",
    title: "Astro Match",
    description:
      "Porównanie dwóch kosmogramów pod kątem chemii, komunikacji i potencjału relacji. Widzisz mocne strony i ryzyka.",
    highlights: ["Wynik kompatybilności", "Czerwone flagi", "Wskazówki do relacji"],
  },
  {
    icon: Baby,
    iconColor: "text-stone-200",
    iconBg: "bg-zinc-900/30 border-zinc-700/40",
    glowColor: "hover:border-amber-500/30",
    badge: "04",
    title: "Horoskop dziecka",
    description:
      "Moduł dla rodziców, który pomaga rozumieć emocje i temperament dziecka. Mniej napięć, więcej świadomego wsparcia.",
    highlights: ["Potrzeby emocjonalne", "Mocne strony dziecka", "Lepsza komunikacja"],
  },
  {
    icon: MessageCircle,
    iconColor: "text-amber-200",
    iconBg: "bg-amber-900/20 border-amber-700/30",
    glowColor: "hover:border-amber-500/30",
    badge: "05",
    title: "Astro Chat",
    description:
      "Rozmowa z AI osadzona w Twoim kosmogramie. Pytasz o relacje, pracę i codzienne decyzje, dostajesz kontekstowe odpowiedzi.",
    highlights: ["Chat osadzony w Twoich danych", "Szybkie odpowiedzi", "Naturalny dialog"],
  },
];

export default function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="relative py-24 sm:py-32">
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a140d]/40 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 sm:mb-20">
          <p className="inline-block text-xs uppercase tracking-[0.25em] text-amber-300 font-medium mb-4 px-3 py-1 rounded-full border border-amber-700/40 bg-amber-900/10">
            Kluczowe funkcje
          </p>
          <h2 id="features-heading" className="font-brand text-3xl sm:text-5xl font-semibold text-white leading-tight">
            Jedna platforma, <span className="gradient-text">pięć modułów.</span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-slate-400 text-base sm:text-lg">
            Nie musisz skakać między aplikacjami. Tutaj masz cały ekosystem astrologiczny w jednym miejscu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <article key={feature.title} className={`relative glass-card rounded-2xl p-7 transition-all duration-300 group ${feature.glowColor}`}>
              <span className="absolute top-5 right-6 text-xs font-mono text-amber-900 group-hover:text-amber-700 transition-colors">
                {feature.badge}
              </span>

              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 ${feature.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} strokeWidth={1.5} />
              </div>

              <h3 className="font-brand text-2xl font-semibold text-white mb-3">
                {feature.title}
              </h3>

              <p className="text-slate-400 text-sm leading-relaxed mb-5">{feature.description}</p>

              <ul className="space-y-2">
                {feature.highlights.map((hl) => (
                  <li key={hl} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                    {hl}
                  </li>
                ))}
              </ul>

              <div aria-hidden="true" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-amber-600/0 to-transparent group-hover:via-amber-500/40 transition-all duration-500" />
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/generate" className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-amber-400 transition-colors">
            Wygeneruj kosmogram
          </Link>
          <Link href="/astro-match" className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm font-semibold hover:bg-white/10 transition-colors">
            Zobacz Astro Match
          </Link>
        </div>
      </div>
    </section>
  );
}
