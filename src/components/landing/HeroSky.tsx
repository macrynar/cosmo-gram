"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const PLANETS = [
  { n: "Merkury", s: "☿", c: "#B8AFA4", r: 5,   rx: 170, sp: 1.6,  ph: 0.8 },
  { n: "Wenus",   s: "♀", c: "#F2C879", r: 8,   rx: 250, sp: 1.05, ph: 2.6 },
  { n: "Mars",    s: "♂", c: "#E2654A", r: 6.5, rx: 335, sp: 0.75, ph: 4.4 },
  { n: "Saturn",  s: "♄", c: "#E8C98A", r: 11,  rx: 445, sp: 0.45, ph: 1.7, ring: true },
  { n: "Neptun",  s: "♆", c: "#5FA8D3", r: 7,   rx: 560, sp: 0.3,  ph: 5.5 },
  { n: "Uran",    s: "♅", c: "#57C4B8", r: 6,   rx: 660, sp: 0.22, ph: 3.3 },
] as const;

const K = 0.94;

export default function HeroSky() {
  const heroRef   = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skyRef    = useRef<HTMLDivElement>(null);
  const orbitsRef = useRef<SVGSVGElement>(null);
  const tipRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const cv   = canvasRef.current;
    const sky  = skyRef.current;
    const orb  = orbitsRef.current;
    const tip  = tipRef.current;
    if (!hero || !cv || !sky || !orb || !tip) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cx2 = cv.getContext("2d")!;

    // ── Video: pause when scrolled out ──
    const vid = hero.querySelector("video") as HTMLVideoElement | null;
    if (vid) {
      if (reduced) { vid.removeAttribute("autoplay"); vid.pause(); }
      else {
        const io = new IntersectionObserver(en => {
          en[0].isIntersecting ? vid.play().catch(() => {}) : vid.pause();
        });
        io.observe(vid);
      }
    }

    // ── Build orbits + planet DOM nodes ──
    while (orb.firstChild) orb.removeChild(orb.firstChild);
    while (sky.querySelector(".lp")) sky.querySelector(".lp")!.remove();

    const planetState = PLANETS.map((p, i) => {
      const e = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      e.setAttribute("rx", String(p.rx));
      e.setAttribute("ry", String(p.rx * K));
      e.setAttribute("fill", "none");
      e.setAttribute("stroke", "var(--line)");
      e.setAttribute("stroke-width", "1");
      e.style.opacity = (0.55 * Math.pow(0.72, i)).toFixed(2);
      orb.appendChild(e);

      const d = document.createElement("div");
      d.className = "lp";
      d.style.cssText = `position:absolute;border-radius:50%;z-index:3;
        width:${p.r * 2}px;height:${p.r * 2}px;
        background:radial-gradient(circle at 35% 35%, #fff6e8 0%, ${p.c} 45%, ${p.c} 100%);
        box-shadow:0 0 ${p.r * 2.6}px ${p.c}66;`;
      if ("ring" in p && p.ring) {
        const ring = document.createElement("span");
        ring.style.cssText = `position:absolute;left:50%;top:50%;width:210%;height:74%;
          border:1.5px solid rgba(232,201,138,.65);border-radius:50%;
          transform:translate(-50%,-50%) rotate(-24deg)`;
        d.appendChild(ring);
      }
      sky.appendChild(d);

      const st = { a: p.ph, mult: 1, hov: false, fade: 1, el: d, orbitEl: e };

      d.addEventListener("mouseenter", () => {
        if (st.fade < 0.6) return;
        st.hov = true;
        e.setAttribute("stroke", "var(--accent-deep)"); e.style.opacity = "0.9";
        if (tip) { tip.innerHTML = `<b>${p.s}</b> ${p.n}`; tip.style.opacity = "1"; tip.style.transform = "none"; }
      });
      d.addEventListener("mouseleave", () => {
        st.hov = false;
        e.setAttribute("stroke", "var(--line)"); e.style.opacity = (0.55 * Math.pow(0.72, i)).toFixed(2);
        if (tip) { tip.style.opacity = "0"; tip.style.transform = "translateY(4px)"; }
      });
      return st;
    });

    // ── Stars (sized after layout is complete) ──
    type Star = { x:number; y:number; r:number; layer:number; tw:number; warm:boolean };
    let stars: Star[] = [];
    let W = 0, H = 0;

    function sizeCanvas() {
      const w = cv!.offsetWidth;
      const h = cv!.offsetHeight;
      if (w === 0 || h === 0) return false; // layout not ready
      W = cv!.width  = w * devicePixelRatio;
      H = cv!.height = h * devicePixelRatio;
      stars = [];
      const COLS = 12, ROWS = 7, jx = W / COLS, jy = H / ROWS;
      for (let gx = 0; gx < COLS; gx++) {
        for (let gy = 0; gy < ROWS; gy++) {
          const x = gx * jx + Math.random() * jx;
          const y = gy * jy + Math.random() * jy;
          const dx = (x - W / 2) / (W * 0.36);
          const dy = (y - H * 0.46) / (H * 0.34);
          if (dx * dx + dy * dy < 1 && Math.random() < 0.75) continue;
          stars.push({ x, y, r: (Math.random() * 1.1 + 0.45) * devicePixelRatio, layer: (gx + gy) % 2, tw: Math.random() * Math.PI * 2, warm: Math.random() < 0.18 });
        }
      }
      return true;
    }

    // ── Protection zones (planets fade near nav + content) ──
    let zones: Array<{x1:number;y1:number;x2:number;y2:number}> = [];
    function computeZones() {
      const content = hero!.querySelector(".hero-content-block") as HTMLElement | null;
      if (!content) return;
      const c = content.getBoundingClientRect(), h = hero!.getBoundingClientRect();
      zones = [
        { x1: 0, y1: 0, x2: hero!.offsetWidth, y2: 100 },
        { x1: c.left-h.left-40, y1: c.top-h.top-32, x2: c.right-h.left+40, y2: c.bottom-h.top+32 },
      ];
    }
    const inZone = (x:number, y:number) => zones.some(z => x>z.x1&&x<z.x2&&y>z.y1&&y<z.y2);

    // ── Parallax target (mouse + touch) ──
    let tx = 0, ty = 0, px = 0, py = 0;
    const onMouseMove = (e: MouseEvent) => {
      const r = hero!.getBoundingClientRect();
      tx = (e.clientX / r.width - 0.5) * 2;
      ty = (e.clientY / r.height - 0.5) * 2;
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const r = hero!.getBoundingClientRect();
      tx = (t.clientX / r.width - 0.5) * 2;
      ty = (t.clientY / r.height - 0.5) * 0.8; // dampen vertical on mobile
    };
    hero.addEventListener("mousemove", onMouseMove);
    hero.addEventListener("touchmove", onTouchMove, { passive: true });

    // ── Main animation loop ──
    let last = performance.now();
    let rafId = 0;

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;

      // defer if canvas not sized yet
      if (W === 0 || H === 0) {
        if (!sizeCanvas()) { rafId = requestAnimationFrame(frame); return; }
        computeZones();
      }

      px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      const isMobile = window.innerWidth < 768;
      const scale = isMobile ? 0.42 : window.innerWidth < 1100 ? 0.75 : 1;

      sky!.style.transform = `translate(${px * (isMobile ? 6 : 16)}px, ${py * (isMobile ? 4 : 16)}px)`;
      orb!.style.transform = `translate(-50%, -50%) scale(${scale})`;

      planetState.forEach((st, i) => {
        const p = PLANETS[i];
        st.mult += ((st.hov ? 0.25 : 1) - st.mult) * 0.08;
        st.a += p.sp * 0.13 * st.mult * dt;
        const x = hero!.offsetWidth / 2 + Math.cos(st.a) * p.rx * scale;
        const y = hero!.offsetHeight * 0.48 + Math.sin(st.a) * p.rx * K * scale;
        st.fade += ((inZone(x, y) ? 0.15 : 1) - st.fade) * 0.06;
        st.el.style.opacity = String(st.fade);
        st.el.style.transform = `translate(${x - p.r}px, ${y - p.r}px)`;
        if (st.hov && tip) { tip!.style.left = x+14+"px"; tip!.style.top = y-36+"px"; }
      });

      // stars
      cx2.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.tw += dt * 1.5;
        const o = 0.5 + 0.35 * Math.abs(Math.sin(s.tw));
        const f = s.layer ? 10 : 5;
        cx2.beginPath();
        cx2.arc(s.x + px * f * devicePixelRatio, s.y + py * f * devicePixelRatio, s.r, 0, 7);
        cx2.fillStyle = s.warm ? `rgba(255,197,107,${o})` : `rgba(244,241,234,${o * 0.8})`;
        cx2.fill();
      });

      if (!document.hidden) rafId = requestAnimationFrame(frame);
    }

    function staticSky() {
      if (!sizeCanvas()) { requestAnimationFrame(staticSky); return; }
      computeZones();
      const isMobile = window.innerWidth < 768;
      const scale = isMobile ? 0.42 : 1;
      orb!.style.transform = `translate(-50%, -50%) scale(${scale})`;
      planetState.forEach((st, i) => {
        const p = PLANETS[i];
        const x = hero!.offsetWidth / 2 + Math.cos(p.ph) * p.rx * scale;
        const y = hero!.offsetHeight * 0.48 + Math.sin(p.ph) * p.rx * K * scale;
        st.el.style.transform = `translate(${x - p.r}px, ${y - p.r}px)`;
      });
      cx2.clearRect(0, 0, W, H);
      stars.forEach(s => {
        cx2.beginPath(); cx2.arc(s.x, s.y, s.r, 0, 7);
        cx2.fillStyle = s.warm ? "rgba(255,197,107,.6)" : "rgba(244,241,234,.5)";
        cx2.fill();
      });
    }

    const onResize = () => { if (sizeCanvas()) { computeZones(); if (reduced) staticSky(); } };
    const onVisibility = () => { if (!document.hidden && !reduced) { last = performance.now(); rafId = requestAnimationFrame(frame); } };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    // Start animation on first RAF (ensures layout is done)
    rafId = requestAnimationFrame(reduced ? () => staticSky() : frame);

    // CTA sheen + magnetic (desktop only)
    const cta = hero.querySelector(".hero-cta") as HTMLElement | null;
    if (cta && !reduced && window.innerWidth > 768) {
      cta.addEventListener("mouseenter", () => { cta.classList.remove("shine"); void cta.offsetWidth; cta.classList.add("shine"); });
      cta.addEventListener("mousemove", (e: Event) => {
        const me = e as MouseEvent;
        const r = cta.getBoundingClientRect();
        cta.style.transform = `translate(${(me.clientX-r.left-r.width/2)/(r.width/2)*4}px,${(me.clientY-r.top-r.height/2)/(r.height/2)*4}px)`;
      });
      cta.addEventListener("mouseleave", () => {
        cta.style.transition = "transform .4s cubic-bezier(.22,1,.36,1),box-shadow .25s";
        cta.style.transform = "";
        setTimeout(() => { cta.style.transition = "box-shadow .25s"; }, 400);
      });
    }

    return () => {
      cancelAnimationFrame(rafId);
      hero.removeEventListener("mousemove", onMouseMove);
      hero.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <header
      ref={heroRef}
      style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: `url('/assets/landing/bg-hero.png') center/cover no-repeat,
          radial-gradient(120% 90% at 50% 0%, #1A1530 0%, #0B0912 70%)`,
      }}
    >
      {/* vignette */}
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",zIndex:6,
        background:"radial-gradient(ellipse at center,transparent 60%,rgba(5,4,10,.4) 100%)" }} />

      {/* video */}
      <video
        aria-hidden="true" muted loop playsInline autoPlay
        poster="/assets/landing/bg-hero.png"
        src="/assets/landing/bg-hero-loop.mp4"
        style={{ position:"absolute",top:0,left:0,right:0,bottom:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0 }}
      />

      {/* stars canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:1,width:"100%",height:"100%" }}
      />

      {/* planets layer */}
      <div ref={skyRef} style={{ position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:2,willChange:"transform" }}>
        <svg
          ref={orbitsRef}
          width="1400" height="1400" viewBox="-700 -700 1400 1400"
          style={{ position:"absolute",left:"50%",top:"48%",overflow:"visible" }}
          aria-hidden="true"
        />
        {/* sun glow */}
        <div style={{
          position:"absolute",left:"50%",top:"48%",width:72,height:72,borderRadius:"50%",
          transform:"translate(-50%,-50%)",
          background:"radial-gradient(circle,#FFE9C2 0%,#FFC56B 30%,rgba(240,143,46,.4) 55%,transparent 72%)",
          filter:"blur(2px)",opacity:.85,
          animation:"breatheLanding 7s ease-in-out infinite alternate",
        }}>
          <div style={{ position:"absolute",inset:-56,borderRadius:"50%",
            background:"radial-gradient(circle,rgba(255,174,61,.16) 0%,transparent 65%)" }} />
        </div>
      </div>

      {/* planet tooltip */}
      <div ref={tipRef} style={{
        position:"absolute",zIndex:10,pointerEvents:"none",whiteSpace:"nowrap",
        background:"var(--bg-elevated)",border:"1px solid var(--line)",borderRadius:999,
        fontSize:13.5,color:"var(--text-secondary)",padding:"6px 14px",
        opacity:0,transform:"translateY(4px)",transition:"opacity .2s,transform .2s",
      }} />

      {/* hero content */}
      <div
        className="hero-content-block"
        style={{ position:"relative",zIndex:7,textAlign:"center",padding:"0 24px",maxWidth:980 }}
      >
        <div style={{
          position:"absolute",inset:"-72px -140px",zIndex:-1,pointerEvents:"none",
          background:"radial-gradient(closest-side,rgba(11,9,18,.62) 0%,rgba(11,9,18,.35) 55%,transparent 100%)",
        }} />
        <h1 style={{ fontSize:"clamp(38px,6.5vw,72px)",fontWeight:700,lineHeight:1.05,letterSpacing:"-.02em",marginBottom:28 }}>
          <span className="landing-reveal landing-d1" style={{ display:"block" }}>Horoskop, który</span>
          <span className="landing-reveal landing-d2" style={{ display:"block" }}>
            <span style={{ background:"var(--grad-text)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>naprawdę</span>
            {" "}jest o&nbsp;Tobie.
          </span>
        </h1>
        <p className="landing-reveal landing-d3" style={{ fontSize:"clamp(16px,1.6vw,19.5px)",lineHeight:1.6,color:"var(--text-secondary)",maxWidth:660,margin:"0 auto 44px" }}>
          Cosmogram łączy dane astronomiczne NASA z&nbsp;wiedzą astrologiczną gromadzoną od tysięcy lat. Astrea, nasza AI tworzona razem z&nbsp;astrologami, zamienia je w&nbsp;portret, w&nbsp;którym rozpoznasz siebie, a&nbsp;nie jedną dwunastą ludzkości.
        </p>
        <div className="landing-reveal landing-d4">
          <Link
            href="/app/cosmogram"
            className="hero-cta"
            style={{
              display:"inline-flex",alignItems:"center",gap:10,
              position:"relative",overflow:"hidden",
              fontSize:"clamp(16px,1.4vw,17.5px)",fontWeight:600,color:"var(--on-accent)",
              background:"var(--grad-ember)",border:"none",borderRadius:999,
              padding:"18px 36px",textDecoration:"none",
              boxShadow:"0 0 48px rgba(255,174,61,.18)",willChange:"transform",
            }}
          >
            Odkryj swój kosmogram <span style={{ display:"inline-block",transition:"transform .2s" }}>→</span>
          </Link>
          <div style={{ marginTop:18,fontSize:14,color:"var(--text-muted)" }}>
            Za darmo · bez karty · wystarczy data i&nbsp;miejsce urodzenia
          </div>
        </div>
      </div>

      {/* scroll cue */}
      <a href="#s2" style={{
        position:"absolute",bottom:32,left:"50%",transform:"translateX(-50%)",zIndex:7,
        color:"var(--text-muted)",textDecoration:"none",fontSize:12.5,
        letterSpacing:"0.12em",textTransform:"uppercase",
        display:"flex",flexDirection:"column",alignItems:"center",gap:10,
        animation:"fadeInLanding 1s cubic-bezier(.22,1,.36,1) 1.4s both",
      }}>
        przewiń
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation:"driftLanding 2.2s ease-in-out infinite" }}>
          <path d="M1 2l6 6 6-6" />
        </svg>
      </a>

      <style>{`
        @keyframes breatheLanding { from{transform:translate(-50%,-50%) scale(1)} to{transform:translate(-50%,-50%) scale(1.05)} }
        @keyframes fadeInLanding  { from{opacity:0} to{opacity:1} }
        @keyframes driftLanding   { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(6px);opacity:1} }
        @keyframes sheenLanding   { to{left:calc(100% + 20px)} }
        .landing-reveal{opacity:0;transform:translateY(12px);animation:landingEmerge .7s cubic-bezier(.22,1,.36,1) forwards}
        .landing-d1{animation-delay:.35s}.landing-d2{animation-delay:.5s}.landing-d3{animation-delay:.65s}.landing-d4{animation-delay:.8s}
        @keyframes landingEmerge{to{opacity:1;transform:none}}
        .hero-cta::before{content:'';position:absolute;top:0;bottom:0;width:60px;left:-80px;
          background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-20deg)}
        .hero-cta.shine::before{animation:sheenLanding .7s cubic-bezier(.22,1,.36,1) 1}
        @media(max-width:768px){
          #hero-orbits ellipse{display:none}
        }
      `}</style>
    </header>
  );
}
