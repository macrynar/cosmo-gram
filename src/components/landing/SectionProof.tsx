export default function SectionProof() {
  const testimonials = [
    {
      text: `„Przeczytałam swój kosmogram trzy razy. Najbardziej zabolało to, co najbardziej się zgadzało.”`,
      who: "Marta",
      sign: "Słońce w Pannie",
    },
    {
      text: `„Nie wierzę w horoskopy. Ale to nie był horoskop — to był opis mojego sposobu działania, punkt po punkcie.”`,
      who: "Paweł",
      sign: "Słońce w Skorpionie",
      delay: 100,
    },
    {
      text: `„Wysłałam swój link chyba dziesięciu osobom. Każda odpisała tym samym słowem: skąd?!”`,
      who: "Asia",
      sign: "Słońce w Strzelcu",
      delay: 200,
    },
  ];

  return (
    <section
      id="s5"
      style={{ maxWidth:1140, margin:"0 auto", padding:"150px 24px 0", textAlign:"center" }}
    >
      <div data-reveal style={{ fontSize:13,letterSpacing:".14em",textTransform:"uppercase",color:"var(--accent-deep)",marginBottom:16 }}>
        Z prawdziwych odczytów
      </div>
      <h2 data-reveal style={{ fontSize:"clamp(30px,4vw,44px)",fontWeight:700,lineHeight:1.1,letterSpacing:"-.015em",marginBottom:18 }}>
        Czytasz o&nbsp;sobie i&nbsp;myślisz:<br />skąd oni to wiedzą?
      </h2>
      <p data-reveal style={{ fontSize:18.5,lineHeight:1.6,color:"var(--text-secondary)",maxWidth:640,margin:"0 auto 56px" }}>
        Fragmenty pochodzą z&nbsp;prawdziwych kosmogramów — za zgodą ich właścicieli.
      </p>

      <p data-reveal style={{
        fontFamily:"var(--font-fraunces),serif",fontStyle:"italic",color:"var(--voice)",
        fontSize:"clamp(24px,3vw,34px)",lineHeight:1.35,maxWidth:780,margin:"0 auto 16px",
      }}>
        {`„Gdy przestaniesz zakładać zbroję z cierpień, odkryjesz, że Twoje serce to najostrzejszy miecz.”`}
      </p>
      <div data-reveal style={{ fontSize:14,color:"var(--text-muted)",marginBottom:64 }}>
        z modułu „Cienie do integracji"
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:24, textAlign:"left" }}>
        {testimonials.map(t => (
          <div
            key={t.who}
            data-reveal
            style={{
              position:"relative", border:"1px solid var(--line)", borderRadius:16, padding:32,
              background:"var(--bg-elevated)", overflow:"hidden",
              transitionDelay: t.delay ? `${t.delay}ms` : undefined,
            }}
          >
            <p style={{ marginBottom:18,fontSize:15.5,lineHeight:1.65 }}>{t.text}</p>
            <div style={{ fontSize:14,color:"var(--accent-deep)" }}>
              {t.who} <span style={{ color:"var(--text-muted)" }}>· {t.sign}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
