const faq = [
  {
    q: "Czy muszę znać dokładną godzinę urodzenia?",
    a: "Najlepiej tak, bo wtedy kosmogram jest najbardziej precyzyjny. Jeśli jej nie znasz, nadal dostaniesz użyteczne wnioski, ale z mniejszą dokładnością w obszarze domów astrologicznych.",
  },
  {
    q: "Czym to się różni od zwykłych horoskopów z internetu?",
    a: "Tu nie ma ogólników pod znak zodiaku. Analiza powstaje na bazie Twoich konkretnych danych urodzeniowych i pełnego układu planet, a nie jednego znaku Słońca.",
  },
  {
    q: "Czy moje dane są bezpieczne?",
    a: "Tak. Stosujemy podejście privacy-first. Dane służą do wygenerowania analiz i nie są sprzedawane podmiotom trzecim.",
  },
  {
    q: "Co dokładnie dostanę w darmowej wersji?",
    a: "Kosmogram natalny z pełnym wykresem, interpretację AI kluczowych pozycji, Astro Match dla jednej pary i dzienny horoskop. To solidny wstęp — Premium dokłada głębię i pełne moduły.",
  },
];

export default function FAQSection() {
  return (
    <section className="relative py-20 sm:py-24" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="inline-block text-xs uppercase tracking-[0.25em] text-amber-300 font-medium mb-4 px-3 py-1 rounded-full border border-amber-700/30 bg-amber-900/10">
            FAQ
          </p>
          <h2 className="font-brand text-3xl sm:text-4xl font-semibold text-white">
            Najczęstsze pytania przed startem
          </h2>
        </div>

        <div className="space-y-4">
          {faq.map((item) => (
            <article key={item.q} className="glass-card rounded-xl p-5 border border-white/10">
              <h3 className="text-base font-semibold text-white mb-2">{item.q}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.a}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
