import Link from "next/link";

export default function SectionFinal() {
  return (
    <section
      id="s8"
      style={{
        position:"relative", marginTop:150, padding:"170px 24px", textAlign:"center", overflow:"hidden",
        background:`url('/assets/landing/bg-hero.png') center 75% / 130% no-repeat, var(--bg-base)`,
      }}
    >
      <div style={{
        content:"", position:"absolute", inset:0, pointerEvents:"none",
        background:"linear-gradient(180deg, var(--bg-base) 0%, transparent 30%, transparent 75%, rgba(5,4,10,.6) 100%)",
      }} />
      <div style={{ position:"relative", zIndex:2, maxWidth:760, margin:"0 auto" }}>
        <h2
          data-reveal
          style={{ fontSize:"clamp(32px,4.5vw,52px)",fontWeight:700,lineHeight:1.1,letterSpacing:"-.02em",marginBottom:36 }}
        >
          Odkryj, co Twój kosmogram<br />mówi o&nbsp;Tobie.
        </h2>
        <div data-reveal style={{ transitionDelay:"120ms" }}>
          <Link
            href="/app/cosmogram"
            style={{
              display:"inline-flex", alignItems:"center", gap:10,
              fontSize:17.5, fontWeight:600, color:"var(--on-accent)",
              background:"var(--grad-ember)", borderRadius:999, padding:"19px 40px",
              textDecoration:"none", boxShadow:"0 0 48px rgba(255,174,61,.18)",
            }}
          >
            Odkryj swój kosmogram <span>→</span>
          </Link>
          <div style={{ marginTop:18, fontSize:14, color:"var(--text-muted)" }}>
            Za darmo · bez karty · wystarczy data i&nbsp;miejsce urodzenia
          </div>
        </div>
      </div>
    </section>
  );
}
