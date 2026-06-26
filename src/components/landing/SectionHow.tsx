export default function SectionHow() {
  const steps = [
    {
      img: "/assets/landing/ill-chwila-narodzin.png",
      alt: "Klepsydra z gwiazdami, chwila narodzin",
      num: "01",
      title: "Wszystko zaczyna się od chwili narodzin",
      text: "Data i&nbsp;miejsce wystarczą, by Astrea zaczęła czytać Twoje niebo. Godzina, jeśli ją znasz, pogłębi portret o&nbsp;ascendent i&nbsp;domy.",
      delay: 0,
    },
    {
      img: "/assets/landing/ill-sfera.png",
      alt: "Sfera armilarna, odtwarzanie nieba",
      num: "02",
      title: "Odtwarzamy niebo z&nbsp;tamtej chwili",
      text: "Pozycje planet wyznaczamy co do stopnia, korzystając z&nbsp;danych astronomicznych NASA. To wierna mapa nieba, pod którym przyszło Ci na świat.",
      delay: 120,
    },
    {
      img: "/assets/landing/ill-pioro.png",
      alt: "Pióro kreślące konstelację, Astrea pisze portret",
      num: "03",
      title: "Astrea pisze Twój portret",
      text: "Łączy starożytną symbolikę z&nbsp;językiem współczesnej psychologii. Nad jej interpretacjami pracowali prawdziwi astrologowie, dlatego czyta się je tak, jakby pisał je ktoś, kto zna Cię od dawna.",
      delay: 240,
    },
  ];

  return (
    <section
      id="s3"
      style={{ maxWidth:1140, margin:"0 auto", padding:"150px 24px 0" }}
    >
      <div data-reveal style={{ fontSize:13,letterSpacing:".14em",textTransform:"uppercase",color:"var(--accent-deep)",marginBottom:16 }}>
        Jak powstaje kosmogram
      </div>
      <h2 data-reveal style={{ fontSize:"clamp(30px,4vw,44px)",fontWeight:700,lineHeight:1.1,letterSpacing:"-.015em",marginBottom:18 }}>
        Tysiące lat mądrości.<br />Jedna opowieść. Twoja.
      </h2>
      <p data-reveal style={{ fontSize:18.5,lineHeight:1.6,color:"var(--text-secondary)",maxWidth:640,marginBottom:56 }}>
        Sercem Cosmogramu jest <strong style={{ color:"var(--accent-deep)",fontWeight:600 }}>Astrea</strong>, silnik interpretacji, który budowaliśmy miesiącami razem z&nbsp;doświadczonymi astrologami. Precyzję daje jej astronomia. Głębię daje wiedza, którą ludzie zbierali pod tym samym niebem od tysięcy lat.
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:40 }} className="s3-grid">
        {steps.map(s => (
          <div key={s.num} data-reveal style={{ transitionDelay:`${s.delay}ms` }}>
            <img
              src={s.img}
              alt={s.alt}
              style={{
                width:"100%", height:200, objectFit:"cover", borderRadius:12,
                border:"1px solid var(--line-soft)", marginBottom:26, display:"block",
                transition:"transform .5s cubic-bezier(.22,1,.36,1),box-shadow .5s cubic-bezier(.22,1,.36,1)",
              }}
              className="step-ill"
            />
            <div style={{ fontSize:13,letterSpacing:".14em",color:"var(--accent-deep)",marginBottom:10,fontVariantNumeric:"tabular-nums" }}>
              {s.num}
            </div>
            <h3 style={{ fontSize:21,fontWeight:600,letterSpacing:"-.01em",marginBottom:10 }} dangerouslySetInnerHTML={{ __html: s.title }} />
            <p style={{ fontSize:16,lineHeight:1.6,color:"var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: s.text }} />
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width:900px) { .s3-grid { grid-template-columns: 1fr !important; gap: 48px !important; } }
        .step-ill:hover { transform: translateY(-4px); box-shadow: 0 12px 48px rgba(255,174,61,.1); }
      `}</style>
    </section>
  );
}
