const FAQS = [
  {
    q: "Nie wierzę w astrologię. Czy to coś dla mnie?",
    a: "Nie musisz wierzyć. Potraktuj kosmogram jak lustro i&nbsp;dobrą rozmowę o&nbsp;sobie — zestaw trafnych pytań o&nbsp;to, jak działasz, kochasz i&nbsp;czego unikasz. Sceptycy piszą nam najdłuższe wiadomości.",
  },
  {
    q: "Czym to się różni od horoskopów z internetu?",
    a: "Horoskop z&nbsp;internetu to jeden tekst dla jednej dwunastej ludzkości. Tu wszystko liczymy z&nbsp;Twojego nieba — pozycji planet z&nbsp;dnia i&nbsp;miejsca Twoich narodzin, wyznaczonych z&nbsp;danych astronomicznych NASA co do stopnia.",
  },
  {
    q: "Nie znam godziny urodzenia. Czy to problem?",
    a: "Nie. Dostajesz pełny kosmogram z&nbsp;pozycji planet. Godzina dodaje ascendent i&nbsp;domy — możesz ją uzupełnić później. Podpowiadamy też, jak ją znaleźć: jest w&nbsp;akcie urodzenia, dostępnym w&nbsp;każdym USC.",
  },
  {
    q: "Czy moje dane są bezpieczne?",
    a: "Dane urodzenia zostają u&nbsp;nas — Astrea pracuje wyłącznie na wyliczonych pozycjach planet, bez Twojego imienia i&nbsp;daty. Konto i&nbsp;wszystkie dane usuwasz jednym kliknięciem, kiedy zechcesz.",
  },
  {
    q: "Co dokładnie dostaję za darmo?",
    a: "Pełnoprawny kosmogram bazowy: koło natalne, pozycje planet i&nbsp;interpretację najważniejszych konfiguracji. Bez karty, bez okresu próbnego, bez gwiazdek. Plus dokłada pozostałe rozdziały, pełną analizę Match, kalendarz personalny i&nbsp;Cosmo Chat.",
  },
];

export default function SectionFaq() {
  return (
    <section
      id="s7"
      style={{ maxWidth:1140, margin:"0 auto", padding:"150px 24px 0" }}
    >
      <div style={{ textAlign:"center" }}>
        <div data-reveal style={{ fontSize:13,letterSpacing:".14em",textTransform:"uppercase",color:"var(--accent-deep)",marginBottom:16 }}>
          Zanim zaczniesz
        </div>
        <h2 data-reveal style={{ fontSize:"clamp(30px,4vw,44px)",fontWeight:700,lineHeight:1.1,letterSpacing:"-.015em",marginBottom:18 }}>
          Pytania, które zadałby każdy rozsądny człowiek
        </h2>
        <p data-reveal style={{ fontSize:18.5,lineHeight:1.6,color:"var(--text-secondary)",maxWidth:640,margin:"0 auto 56px" }}>
          Astrologia budzi wątpliwości — i&nbsp;dobrze. Oto uczciwe odpowiedzi.
        </p>
      </div>

      <div
        data-reveal
        style={{ maxWidth:680, margin:"0 auto" }}
      >
        {FAQS.map((faq, i) => (
          <details
            key={i}
            open={i === 0}
            style={{ borderBottom:"1px solid var(--line)" }}
          >
            <summary style={{
              listStyle:"none", cursor:"pointer", display:"flex", justifyContent:"space-between",
              alignItems:"center", gap:24, fontSize:18, fontWeight:600, letterSpacing:"-.01em",
              padding:"26px 0", color:"var(--text-primary)",
            }}>
              {faq.q}
              <span style={{ fontSize:24,fontWeight:400,color:"var(--accent-deep)",flexShrink:0 }} className="faq-plus">+</span>
            </summary>
            <div
              style={{ fontSize:16,lineHeight:1.65,color:"var(--text-secondary)",padding:"0 40px 26px 0" }}
              dangerouslySetInnerHTML={{ __html: faq.a }}
            />
          </details>
        ))}
      </div>

      <style>{`
        details[open] .faq-plus { transform: rotate(45deg); }
        .faq-plus { transition: transform .3s cubic-bezier(.22,1,.36,1); display:inline-block; }
        details summary::-webkit-details-marker { display:none; }
      `}</style>
    </section>
  );
}
