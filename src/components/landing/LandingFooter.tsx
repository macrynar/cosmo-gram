import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer style={{ borderTop:"1px solid var(--line)", padding:"56px 24px 40px" }}>
      <div style={{ maxWidth:1140, margin:"0 auto", display:"flex", flexWrap:"wrap", gap:40, justifyContent:"space-between", alignItems:"flex-start" }}>
        <Link
          href="/"
          aria-label="Cosmogram"
          style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none", color:"var(--text-primary)" }}
        >
          <svg width="26" height="26" viewBox="0 0 120 120" aria-hidden="true">
            <g transform="translate(55,60)" fill="#F4F1EA" stroke="#F4F1EA" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
              <path d="M 28.79,-40.86 A 50,50 0 1,0 28.79,40.86 A 40,40 0 1,1 28.79,-40.86 Z" />
              <circle cx="10" cy="0" r="9" stroke="none" />
            </g>
          </svg>
          <span style={{ fontSize:21, fontWeight:500, letterSpacing:"-0.02em" }}>cosmogram</span>
        </Link>

        <div style={{ display:"flex", gap:56, flexWrap:"wrap" }}>
          <div>
            <h4 style={{ fontSize:13,letterSpacing:".1em",textTransform:"uppercase",color:"var(--text-muted)",marginBottom:14 }}>Produkt</h4>
            <Link href="/cosmogram"  style={{ display:"block",fontSize:15,color:"var(--text-secondary)",textDecoration:"none",padding:"4px 0" }}>Kosmogram</Link>
            <Link href="/match"      style={{ display:"block",fontSize:15,color:"var(--text-secondary)",textDecoration:"none",padding:"4px 0" }}>Cosmo Match</Link>
            <Link href="/calendar"   style={{ display:"block",fontSize:15,color:"var(--text-secondary)",textDecoration:"none",padding:"4px 0" }}>Kalendarz</Link>
            <Link href="/cosmo-chat" style={{ display:"block",fontSize:15,color:"var(--text-secondary)",textDecoration:"none",padding:"4px 0" }}>Cosmo Chat</Link>
            <Link href="/pricing"    style={{ display:"block",fontSize:15,color:"var(--text-secondary)",textDecoration:"none",padding:"4px 0" }}>Cennik</Link>
          </div>
          <div>
            <h4 style={{ fontSize:13,letterSpacing:".1em",textTransform:"uppercase",color:"var(--text-muted)",marginBottom:14 }}>Poznaj</h4>
            <Link href="/blog"          style={{ display:"block",fontSize:15,color:"var(--text-secondary)",textDecoration:"none",padding:"4px 0" }}>Blog</Link>
            <Link href="/app/cosmogram" style={{ display:"block",fontSize:15,color:"var(--text-secondary)",textDecoration:"none",padding:"4px 0" }}>Przykładowy kosmogram</Link>
          </div>
          <div>
            <h4 style={{ fontSize:13,letterSpacing:".1em",textTransform:"uppercase",color:"var(--text-muted)",marginBottom:14 }}>Formalności</h4>
            <Link href="/legal/terms"   style={{ display:"block",fontSize:15,color:"var(--text-secondary)",textDecoration:"none",padding:"4px 0" }}>Regulamin</Link>
            <Link href="/legal/privacy" style={{ display:"block",fontSize:15,color:"var(--text-secondary)",textDecoration:"none",padding:"4px 0" }}>Polityka prywatności</Link>
            <a href="mailto:kontakt@cosmo-gram.com" style={{ display:"block",fontSize:15,color:"var(--text-secondary)",textDecoration:"none",padding:"4px 0" }}>Kontakt</a>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth:1140, margin:"40px auto 0",
        fontSize:13, lineHeight:1.6, color:"var(--text-muted)",
        borderTop:"1px solid var(--line-soft)", paddingTop:24,
      }}>
        Treści w&nbsp;Cosmogramie mają charakter refleksyjno-rozrywkowy, to symboliczne lustro, nie wyrocznia. Nie stanowią porady medycznej, psychologicznej, prawnej ani finansowej.<br />
        © 2026 Cosmogram
      </div>
    </footer>
  );
}
