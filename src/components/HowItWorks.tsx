import { ClipboardList, Orbit, Wand2 } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: ClipboardList,
    title: "Podajesz dane urodzenia",
    description:
      "Data, godzina i miejsce urodzenia pozwalają odtworzyć układ nieba z chwili Twoich narodzin. To baza całej analizy.",
    detail: "Data · Godzina · Miejsce",
  },
  {
    step: "02",
    icon: Orbit,
    title: "Pełny kosmogram w kilka sekund",
    description:
      "Obliczamy pozycje planet, domy i aspekty z dokładnością astronomiczną — na podstawie Twoich konkretnych danych, nie przybliżeń.",
    detail: "Planety · Domy · Aspekty",
  },
  {
    step: "03",
    icon: Wand2,
    title: "AI tłumaczy to na życie",
    description:
      "Otrzymujesz gotową interpretację oraz możliwość rozmowy w Astro Chacie. Od teorii przechodzisz do konkretnych wskazówek.",
    detail: "Wnioski · Rekomendacje · Rozwój",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="relative py-24 sm:py-32 overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent via-[#18130d]/50 to-transparent pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 sm:mb-20">
          <p className="inline-block text-xs uppercase tracking-[0.25em] text-amber-300 font-medium mb-4 px-3 py-1 rounded-full border border-amber-700/30 bg-amber-900/10">
            Jak to działa
          </p>
          <h2 id="how-heading" className="font-brand text-3xl sm:text-5xl font-semibold text-white">
            Od danych do konkretnego wglądu
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-slate-400 text-base sm:text-lg">
            Cały proces trwa chwilę. Efekt to narzędzie, które realnie pomaga podejmować decyzje.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          <div aria-hidden="true" className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-amber-900/20 via-amber-600/40 to-amber-900/20" />

          {steps.map((step, i) => (
            <div key={step.step} className="flex flex-col items-center text-center group">
              <div className="relative mb-6">
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#17120d] to-[#07031a] border-2 border-amber-700/40 group-hover:border-amber-500/70 transition-colors duration-300 flex flex-col items-center justify-center shadow-lg shadow-black/50 group-hover:glow-nebula">
                  <step.icon className="w-7 h-7 text-amber-300 group-hover:text-amber-200 transition-colors" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white text-[10px] font-bold flex items-center justify-center border border-amber-500 shadow-md">
                  {i + 1}
                </div>
              </div>

              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 mb-2">
                Krok {step.step}
              </span>

              <h3 className="font-brand text-2xl font-semibold text-white mb-3 group-hover:text-amber-100 transition-colors">
                {step.title}
              </h3>

              <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-[260px]">{step.description}</p>

              <div className="inline-block px-3 py-1 rounded-full bg-amber-900/10 border border-amber-800/30 text-amber-300 text-xs">
                {step.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
