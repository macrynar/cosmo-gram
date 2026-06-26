"use client";

import Link from "next/link";
import { useEffect } from "react";

function useSpotlight(selector: string) {
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(selector);
    const handlers: Array<{ el: HTMLElement; fn: (e: MouseEvent) => void }> = [];
    cards.forEach(card => {
      const fn = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      };
      card.addEventListener("mousemove", fn);
      handlers.push({ el: card, fn });
    });
    return () => handlers.forEach(({ el, fn }) => el.removeEventListener("mousemove", fn));
  }, [selector]);
}

export default function SectionModules() {
  useSpotlight(".landing-card");

  return (
    <section
      id="s4"
      style={{ maxWidth:1140, margin:"0 auto", padding:"150px 24px 0" }}
    >
      <div data-reveal style={{ fontSize:13,letterSpacing:".14em",textTransform:"uppercase",color:"var(--accent-deep)",marginBottom:16 }}>
        Jedna platforma, cztery moduły
      </div>
      <h2 data-reveal style={{ fontSize:"clamp(30px,4vw,44px)",fontWeight:700,lineHeight:1.1,letterSpacing:"-.015em",marginBottom:18 }}>
        Zaczyna się od kosmogramu.<br />Potem robi się ciekawie.
      </h2>
      <p data-reveal style={{ fontSize:18.5,lineHeight:1.6,color:"var(--text-secondary)",maxWidth:640,marginBottom:56 }}>
        Twój kosmogram to centrum: kalendarz, dopasowania i&nbsp;rozmowy czerpią z&nbsp;niego wszystko, co wiedzą.
      </p>

      {/* Featured card */}
      <div
        data-reveal
        className="landing-card featured-card"
        onMouseEnter={e => (e.currentTarget.style.borderColor = "#3A3258")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}
      >
        <SpotlightOverlay />
        {/* image: top on mobile, right on desktop (CSS order swap) */}
        <div className="featured-img" aria-hidden="true">
          <img
            src="/assets/landing/ill-kosmogram.png"
            alt=""
            style={{ width:"100%",maxWidth:340,borderRadius:12,border:"1px solid var(--line-soft)",display:"block" }}
          />
        </div>
        <div style={{ position:"relative",zIndex:1 }}>
          <span style={{ fontSize:26,color:"var(--accent)",display:"inline-block",marginBottom:18 }}>☉</span>
          <h3 style={{ fontSize:26,fontWeight:700,letterSpacing:"-.01em",marginBottom:12 }}>Kosmogram</h3>
          <p style={{ fontSize:16.5,lineHeight:1.65,color:"var(--text-secondary)",marginBottom:24 }}>
            Portret, do którego się wraca. Osiem rozdziałów o&nbsp;Tobie: tożsamość, relacje, mocne strony i&nbsp;rzeczy do przepracowania, napisane językiem, który nie owija w&nbsp;bawełnę, ale też nie straszy.
          </p>
          <Link href="/app/cosmogram" style={{ color:"var(--accent-deep)",textDecoration:"none",fontSize:15.5,fontWeight:500 }}>
            Zobacz przykładowy kosmogram →
          </Link>
        </div>
      </div>

      {/* Module grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:24 }}>
        {[
          {
            img: "/assets/landing/ill-match.png",
            title: "Cosmo Match",
            text: "Dwa kosmogramy, jedna relacja. Zobacz, co was do siebie ciągnie i&nbsp;o&nbsp;co będziecie się spierać.",
            link: "Sprawdźcie się →",
            href: "/app/match",
            delay: 0,
          },
          {
            img: "/assets/landing/ill-kalendarz.png",
            title: "Kalendarz astrologiczny",
            text: "Dni mocy i&nbsp;dni na przeczekanie, liczone z&nbsp;Twojego nieba, nie dla wszystkich Baranów naraz.",
            link: "Zajrzyj do kalendarza →",
            href: "/app/calendar",
            delay: 100,
          },
          {
            img: "/assets/landing/ill-chat.png",
            title: "Cosmo Chat",
            text: "Zapytaj o&nbsp;cokolwiek. Rozmawiasz z&nbsp;Astreą, która zna Twój kosmogram i&nbsp;odpowiada konkretnie o&nbsp;Tobie.",
            link: "Zacznij rozmowę →",
            href: "/app/chat",
            delay: 200,
          },
        ].map(m => (
          <div
            key={m.title}
            data-reveal
            className="landing-card"
            style={{
              position:"relative", border:"1px solid var(--line)", borderRadius:16, padding:32,
              background:"var(--bg-elevated)", overflow:"hidden",
              transition:"border-color .25s cubic-bezier(.22,1,.36,1)",
              transitionDelay: `${m.delay}ms`,
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#3A3258")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}
          >
            <SpotlightOverlay />
            <div style={{ height:170,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:22,
              borderRadius:12,background:"rgba(11,9,18,.5)",border:"1px solid var(--line-soft)",overflow:"hidden" }} aria-hidden="true">
              <img src={m.img} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block",transition:"transform .6s" }}
                onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.05)")}
                onMouseLeave={e=>(e.currentTarget.style.transform="none")} />
            </div>
            <h3 style={{ fontSize:21,fontWeight:600,letterSpacing:"-.01em",marginBottom:10 }}>{m.title}</h3>
            <p style={{ fontSize:16,lineHeight:1.6,color:"var(--text-secondary)",marginBottom:20 }} dangerouslySetInnerHTML={{ __html: m.text }} />
            <Link href={m.href} style={{ fontSize:15.5,fontWeight:500,color:"var(--accent-deep)",textDecoration:"none" }}>
              {m.link}
            </Link>
          </div>
        ))}
      </div>

      <style>{`
        /* Featured card — desktop: text left, image right */
        .featured-card {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-areas: "text img";
          gap: 48px;
          align-items: center;
          background: var(--bg-elevated);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 56px;
          margin-bottom: 24px;
          overflow: hidden;
          transition: border-color .25s cubic-bezier(.22,1,.36,1);
        }
        .featured-card > div:last-child { grid-area: text; }
        .featured-img { grid-area: img; display: flex; justify-content: center; position: relative; z-index: 1; }

        /* Mobile: single column, image on top */
        @media (max-width: 768px) {
          .featured-card {
            grid-template-columns: 1fr;
            grid-template-areas: "img" "text";
            gap: 28px;
            padding: 28px;
          }
          .featured-img img { max-width: 100% !important; border-radius: 10px; }
        }

        .landing-card::before {
          content:''; position:absolute; inset:0; opacity:0; transition:opacity .3s; pointer-events:none;
          background:radial-gradient(360px circle at var(--mx,50%) var(--my,50%), rgba(255,174,61,.07), transparent 65%);
        }
        .landing-card:hover::before { opacity:1; }
      `}</style>
    </section>
  );
}

function SpotlightOverlay() {
  return (
    <div style={{
      position:"absolute",inset:0,opacity:0,transition:"opacity .3s",pointerEvents:"none",
      background:"radial-gradient(360px circle at var(--mx,50%) var(--my,50%),rgba(255,174,61,.07),transparent 65%)",
    }} className="spotlight-overlay" />
  );
}
