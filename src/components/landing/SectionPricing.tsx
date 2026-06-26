import Link from "next/link";
import { PLAN_PRICES } from "@/lib/pricing";

export default function SectionPricing() {
  return (
    <section
      id="s6"
      style={{ maxWidth:1140, margin:"0 auto", padding:"150px 24px 0" }}
    >
      <div style={{ textAlign:"center" }}>
        <div data-reveal style={{ fontSize:13,letterSpacing:".14em",textTransform:"uppercase",color:"var(--accent-deep)",marginBottom:16 }}>
          Plany i ceny
        </div>
        <h2 data-reveal style={{ fontSize:"clamp(30px,4vw,44px)",fontWeight:700,lineHeight:1.1,letterSpacing:"-.015em",marginBottom:18 }}>
          Zacznij za darmo.<br />Płać tylko wtedy, gdy chcesz więcej.
        </h2>
        <p data-reveal style={{ fontSize:18.5,lineHeight:1.6,color:"var(--text-secondary)",maxWidth:640,margin:"0 auto 56px" }}>
          Darmowy kosmogram to pełnoprawny portret, nie demo. Plus dokłada głębię i&nbsp;codzienność.
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:24, maxWidth:860, margin:"0 auto" }}>
        {/* Free plan */}
        <div
          data-reveal
          style={{
            position:"relative", background:"var(--bg-elevated)", border:"1px solid var(--line)",
            borderRadius:16, padding:40, overflow:"hidden",
          }}
        >
          <div style={{ fontSize:14,letterSpacing:".12em",textTransform:"uppercase",color:"var(--text-muted)",marginBottom:14 }}>Free</div>
          <div style={{ fontSize:44,fontWeight:700,letterSpacing:"-.02em",fontVariantNumeric:"tabular-nums" }}>
            0 zł
          </div>
          <div style={{ fontSize:14,color:"var(--accent-deep)",margin:"6px 0 26px" }}>na zawsze</div>
          <ul style={{ listStyle:"none",marginBottom:32,padding:0 }}>
            {[
              "Pełny kosmogram bazowy z&nbsp;interpretacją",
              "Koło urodzeniowe z&nbsp;pozycjami planet",
              "Jeden Cosmo Match na start",
              "Ogólny kalendarz astrologiczny",
            ].map((item,i) => (
              <li key={i} style={{ fontSize:15.5,lineHeight:1.5,color:"var(--text-secondary)",padding:"7px 0 7px 28px",position:"relative" }}
                dangerouslySetInnerHTML={{ __html: `<span style="position:absolute;left:0;color:var(--accent-deep)">✓</span>${item}` }} />
            ))}
          </ul>
          <Link
            href="/app/cosmogram"
            style={{
              display:"block", textAlign:"center", fontSize:16.5,
              color:"var(--text-primary)", textDecoration:"none",
              border:"1px solid var(--line)", borderRadius:999, padding:"16px 24px",
            }}
          >
            Zacznij za darmo
          </Link>
        </div>

        {/* Plus plan */}
        <div
          data-reveal
          style={{
            position:"relative", borderRadius:16, padding:"41px", overflow:"hidden",
            background:"var(--bg-elevated)",
            transitionDelay: "100ms",
          }}
          className="plan-featured"
        >
          <div style={{
            content:"", position:"absolute", inset:0, borderRadius:16, padding:1, zIndex:0,
            background:"conic-gradient(from var(--angle,0deg), #2B2540 0%, #E0B566 12%, #2B2540 30%, #2B2540 100%)",
            WebkitMask:"linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite:"xor",
            maskComposite:"exclude",
            pointerEvents:"none",
          }} className="plan-border-anim" />
          <div style={{ position:"absolute",top:20,right:20,fontSize:12,letterSpacing:".08em",
            color:"var(--on-accent)",background:"var(--grad-ember)",borderRadius:999,padding:"5px 13px",fontWeight:600,zIndex:1 }}>
            Najczęściej wybierany
          </div>
          <div style={{ position:"relative",zIndex:1 }}>
            <div style={{ fontSize:14,letterSpacing:".12em",textTransform:"uppercase",color:"var(--text-muted)",marginBottom:14 }}>Plus</div>
            <div style={{ fontSize:44,fontWeight:700,letterSpacing:"-.02em",fontVariantNumeric:"tabular-nums" }}>
              {PLAN_PRICES.monthly.amount} <small style={{ fontSize:16,fontWeight:400,color:"var(--text-muted)" }}>/ mies.</small>
            </div>
            <div style={{ fontSize:14,color:"var(--accent-deep)",margin:"6px 0 26px" }}>lub {PLAN_PRICES.annual.amount}/rok, {PLAN_PRICES.annual.saving}</div>
            <ul style={{ listStyle:"none",marginBottom:32,padding:0 }}>
              {[
                "Pełna interpretacja: wszystkie 8 rozdziałów",
                "Cosmo Match: pełna analiza relacji",
                "Osobisty horoskop dzienny i&nbsp;Dni Mocy",
                "Cosmo Chat z&nbsp;Astreą: 50 wiadomości/mc",
                "Kosmogram dziecka: pełne 6 modułów",
              ].map((item,i) => (
                <li key={i} style={{ fontSize:15.5,lineHeight:1.5,color:"var(--text-secondary)",padding:"7px 0 7px 28px",position:"relative" }}
                  dangerouslySetInnerHTML={{ __html: `<span style="position:absolute;left:0;color:var(--accent-deep)">✓</span>${item}` }} />
              ))}
            </ul>
            <Link
              href="/app/cosmogram"
              style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%",
                fontSize:16, fontWeight:600, color:"var(--on-accent)",
                background:"var(--grad-ember)", border:"none", borderRadius:999, padding:"16px 24px",
                textDecoration:"none", boxShadow:"0 0 48px rgba(255,174,61,.18)",
              }}
            >
              Wybieram Plus →
            </Link>
          </div>
        </div>
      </div>

      <p data-reveal style={{ textAlign:"center",fontSize:14,color:"var(--text-muted)",marginTop:24 }}>
        Anulujesz jednym kliknięciem, kiedy chcesz. Ceny zawierają VAT.
      </p>

      <style>{`
        @keyframes spin-plan { to { --angle: 360deg; } }
        .plan-featured:hover .plan-border-anim { animation: spin-plan 6s linear infinite; }
      `}</style>
    </section>
  );
}
