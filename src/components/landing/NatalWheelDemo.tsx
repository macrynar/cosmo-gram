"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const ZODIAC_IDS = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"];

const PLANETS_W = [
  { g: "☉", n: "Słońce",  d: 248 },
  { g: "☽", n: "Księżyc", d: 95  },
  { g: "☿", n: "Merkury", d: 231 },
  { g: "♀", n: "Wenus",   d: 215 },
  { g: "♂", n: "Mars",    d: 10  },
  { g: "♃", n: "Jowisz",  d: 322 },
  { g: "♄", n: "Saturn",  d: 255 },
];

const ASPECTS = [
  [0,6,"harm"],[0,4,"harm"],[1,3,"tense"],[3,4,"tense"],[1,2,"tense"],[5,0,"harm"],[2,3,"harm"]
] as [number, number, string][];

function pt(r: number, deg: number): [number, number] {
  const a = (deg - 90) * Math.PI / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
}

export default function NatalWheelDemo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = wheelRef.current;
    const wrapper = wrapRef.current;
    const wtip = tooltipRef.current;
    if (!svg || !wrapper || !wtip) return;

    const NS = "http://www.w3.org/2000/svg";
    const el = (t: string, at: Record<string,string> = {}) => {
      const e = document.createElementNS(NS, t);
      for (const k in at) e.setAttribute(k, at[k]);
      return e;
    };

    // defs
    const defs = el("defs");
    defs.innerHTML = `<radialGradient id="hubg"><stop offset="55%" stop-color="rgba(255,174,61,0)"/>
      <stop offset="100%" stop-color="rgba(255,174,61,.06)"/></radialGradient>
      <filter id="halo" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="3.2"/></filter>`;
    svg.appendChild(defs);

    // zodiac wedge fills (every 2nd)
    for (let i = 0; i < 12; i += 2) {
      const a1 = i*30, a2=(i+1)*30;
      const [x1,y1]=pt(250,a1),[x2,y2]=pt(292,a1),[x3,y3]=pt(292,a2),[x4,y4]=pt(250,a2);
      svg.appendChild(el("path",{ fill:"rgba(224,181,102,.03)", stroke:"none",
        d:`M${x1},${y1} L${x2},${y2} A292,292 0 0 1 ${x3},${y3} L${x4},${y4} A250,250 0 0 0 ${x1},${y1} Z`}));
    }

    // rings
    [[292,"#3A3258"],[250,"#3A3258"],[212,"var(--line)"]].forEach(([r,st])=>{
      const len = 2 * Math.PI * Number(r);
      const c = el("circle",{ fill:"none", stroke:String(st), "stroke-width":"1", cx:"0", cy:"0", r:String(r),
        "stroke-dasharray":String(len), "stroke-dashoffset":String(len) });
      c.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)";
      svg.appendChild(c);
    });

    // hub + brand mark
    svg.appendChild(el("circle",{ cx:"0", cy:"0", r:"118", fill:"url(#hubg)" }));
    const hub = el("circle",{ fill:"none", stroke:"var(--line)", "stroke-width":"1", cx:"0", cy:"0", r:"56",
      "stroke-dasharray":String(2*Math.PI*56), "stroke-dashoffset":String(2*Math.PI*56) });
    hub.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1) .1s";
    svg.appendChild(hub);

    // brand glyph at center
    const moon = el("g",{ transform:"translate(-1,0) scale(.42)", fill:"#E0B566", opacity:".22" });
    moon.innerHTML = '<path d="M 28.79,-40.86 A 50,50 0 1,0 28.79,40.86 A 40,40 0 1,1 28.79,-40.86 Z"/><circle cx="10" cy="0" r="9"/>';
    svg.appendChild(moon);

    // ticks
    for (let d = 0; d < 360; d += 5) {
      if (d%30===0) continue;
      const len = d%10===0 ? 9 : 5;
      const [x1,y1] = pt(250-len,d), [x2,y2] = pt(250,d);
      svg.appendChild(el("line",{ stroke:"var(--line)", "stroke-width":"1", opacity:".55", x1:String(x1),y1:String(y1),x2:String(x2),y2:String(y2) }));
    }

    // sign segments + glyphs
    const occupied = new Set(PLANETS_W.map(p=>Math.floor(p.d/30)));
    for (let i = 0; i < 12; i++) {
      const [x1,y1] = pt(250,i*30), [x2,y2] = pt(292,i*30);
      const segLen = 42;
      const seg = el("line",{ stroke:"var(--line)", "stroke-width":"1", opacity:".7",
        x1:String(x1),y1:String(y1),x2:String(x2),y2:String(y2),
        "stroke-dasharray":String(segLen), "stroke-dashoffset":String(segLen) });
      seg.style.transition = `stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1) ${0.02*i}s`;
      svg.appendChild(seg);

      const [gx,gy] = pt(271, i*30+15);
      const use = el("use",{
        href:`#zg-${ZODIAC_IDS[i]}`,
        x:String(gx-11), y:String(gy-11),
        width:"22", height:"22",
        fill:"none", stroke:occupied.has(i)?"var(--accent-deep)":"var(--text-muted)",
        "stroke-width":"1.6", "stroke-linecap":"round", "stroke-linejoin":"round",
        opacity: occupied.has(i) ? "1" : "0.65",
        style:"cursor:pointer;transition:stroke .3s,opacity .3s",
      });
      svg.appendChild(use);
    }

    // aspect lines
    ASPECTS.forEach(([i,j,t])=>{
      const [x1,y1] = pt(200,PLANETS_W[i].d), [x2,y2] = pt(200,PLANETS_W[j].d);
      const len = Math.hypot(x2-x1,y2-y1);
      const ln = el("line",{
        x1:String(x1),y1:String(y1),x2:String(x2),y2:String(y2),
        fill:"none",
        stroke: t==="harm" ? "#E0B566" : "#E2654A",
        "stroke-width":"1.2",
        opacity:"0",
        "stroke-dasharray":String(len), "stroke-dashoffset":String(len),
      });
      ln.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1) .3s, opacity .6s .3s";
      svg.appendChild(ln);
    });

    // planet groups
    PLANETS_W.forEach((p,idx)=>{
      const grp = el("g",{ style:"cursor:pointer;transition:opacity .35s" });
      grp.setAttribute("opacity","0");
      const [dx,dy] = pt(206,p.d), [gx,gy] = pt(230,p.d);

      const halo = el("circle",{ cx:String(dx),cy:String(dy),r:"10",fill:"var(--accent)",opacity:".3" });
      halo.style.filter = "blur(3.2px)";
      grp.appendChild(halo);
      grp.appendChild(el("circle",{ cx:String(dx),cy:String(dy),r:"4",fill:"var(--accent)" }));

      const glyph = el("text",{ x:String(gx),y:String(gy),"text-anchor":"middle","dominant-baseline":"central",
        "font-size":"17",fill:"var(--voice)",style:"font-family:system-ui" });
      glyph.textContent = p.g;
      grp.appendChild(glyph);

      // degree label
      const [lx,ly] = pt(180,p.d);
      const deg = el("text",{ x:String(lx),y:String(ly),"text-anchor":"middle","dominant-baseline":"central",
        "font-size":"10.5",fill:"var(--text-muted)","font-variant-numeric":"tabular-nums",
        style:"font-family:'General Sans',sans-serif" });
      deg.textContent = `${p.d%30}°`;
      grp.appendChild(deg);

      grp.addEventListener("mouseenter",()=>{
        if(wtip){
          const wRect = wrapper.getBoundingClientRect(), svgRect = svg!.getBoundingClientRect();
          const scale = svgRect.width / 600;
          const svgX = gx * scale + svgRect.width/2;
          const svgY = gy * scale + svgRect.height/2;
          wtip.innerHTML=`<b style="color:var(--accent-deep)">${p.g}</b> ${p.n} · ${p.d%30}° ${ZODIAC_IDS[Math.floor(p.d/30)]}`;
          wtip.style.left = (svgRect.left - wRect.left + svgX + 14) + "px";
          wtip.style.top  = (svgRect.top  - wRect.top  + svgY - 28) + "px";
          wtip.style.opacity="1"; wtip.style.transform="translateY(0)";
        }
      });
      grp.addEventListener("mouseleave",()=>{
        if(wtip){wtip.style.opacity="0"; wtip.style.transform="translateY(4px)";}
      });
      svg.appendChild(grp);
    });

    // trigger inview animation
    const observer = new IntersectionObserver(entries=>{
      if(!entries[0].isIntersecting) return;
      // animate circles
      svg.querySelectorAll("circle[stroke-dashoffset], line[stroke-dashoffset]").forEach(el=>{
        (el as SVGElement).style.strokeDashoffset="0";
      });
      // animate aspect lines + planets
      setTimeout(()=>{
        svg.querySelectorAll("line").forEach(l=>{ l.style.strokeDashoffset="0"; });
        svg.querySelectorAll("[opacity='0']").forEach((g,idx)=>{
          setTimeout(()=>{ (g as SVGElement).setAttribute("opacity","1"); },idx*80);
        });
      },300);
      observer.disconnect();
    },{threshold:0.2});
    observer.observe(wrapper);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="s2"
      style={{
        maxWidth: 1140,
        margin: "0 auto",
        padding: "160px 24px 0",
        display: "grid",
        gridTemplateColumns: "1.05fr 1fr",
        gap: 72,
        alignItems: "center",
      }}
      className="s2-grid"
    >
      {/* wheel */}
      <div ref={wrapRef} style={{ position:"relative", aspectRatio:"1", maxWidth:580, margin:"0 auto", width:"100%" }}>
        <img
          src="/assets/landing/wheel-backdrop.png"
          alt=""
          aria-hidden="true"
          style={{ position:"absolute", inset:"-4%", width:"108%", height:"108%", objectFit:"cover", borderRadius:"50%", opacity:.9 }}
        />
        <svg
          ref={wheelRef}
          viewBox="-300 -300 600 600"
          aria-label="Przykładowe koło kosmogramu"
          style={{ position:"relative", zIndex:1, width:"100%", height:"100%", display:"block" }}
        />
        <div ref={tooltipRef} style={{
          position:"absolute", zIndex:5, pointerEvents:"none", whiteSpace:"nowrap",
          background:"var(--bg-elevated)", border:"1px solid var(--line)", borderRadius:999,
          fontSize:13.5, color:"var(--text-secondary)", padding:"6px 14px",
          opacity:0, transform:"translateY(4px)", transition:"opacity .2s, transform .2s",
        }} />

        {/* hidden zodiac SVG defs */}
        <svg style={{ display:"none" }}>
          <defs>
            <g id="zg-base" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <symbol id="zg-aries"       viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V8 M12 8C12 4.6 9.6 3.4 7.9 4.7C6.1 6.1 6.2 9 7.9 10.7 M12 8C12 4.6 14.4 3.4 16.1 4.7C17.9 6.1 17.8 9 16.1 10.7"/></g></symbol>
            <symbol id="zg-taurus"      viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 4C7 7.4 9.3 8.8 12 8.8C14.7 8.8 17 7.4 18.5 4"/><circle cx="12" cy="14.2" r="5.2"/></g></symbol>
            <symbol id="zg-gemini"      viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6.8V17.2 M15 6.8V17.2 M5.2 4.6C8 6.4 16 6.4 18.8 4.6 M5.2 19.4C8 17.6 16 17.6 18.8 19.4"/></g></symbol>
            <symbol id="zg-cancer"      viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8.1" cy="9.3" r="2.6"/><circle cx="15.9" cy="14.7" r="2.6"/><path d="M8.1 6.7C13 6.7 16.9 8.4 18.7 11 M15.9 17.3C11 17.3 7.1 15.6 5.3 13"/></g></symbol>
            <symbol id="zg-leo"         viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.4" cy="15.8" r="2.5"/><path d="M7.4 13.3C7.4 8.2 9.8 5.4 12.8 5.4C15.7 5.4 17.2 7.6 17.2 9.8C17.2 12.4 15.2 13.8 15.2 16.4C15.2 18.2 16.4 19 17.9 18.5"/></g></symbol>
            <symbol id="zg-virgo"       viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4.4 6.2C5.7 6.2 6.5 7.1 6.5 8.6V16.8 M6.5 8.6C6.5 6.9 7.6 6 8.8 6C10.1 6 10.9 7 10.9 8.6V16.8 M10.9 8.6C10.9 6.9 12 6 13.2 6C14.5 6 15.3 7 15.3 8.6V14.2C15.3 17.6 17.2 19 19.6 18.4 M18.9 12.9C16.8 13.8 15.6 15.9 15.3 19.6"/></g></symbol>
            <symbol id="zg-libra"       viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 18.6H19.2 M4.8 14.6H8.6C8.6 11 9.9 8.4 12 8.4C14.1 8.4 15.4 11 15.4 14.6H19.2"/></g></symbol>
            <symbol id="zg-scorpio"     viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4.4 6.2C5.7 6.2 6.5 7.1 6.5 8.6V16.8 M6.5 8.6C6.5 6.9 7.6 6 8.8 6C10.1 6 10.9 7 10.9 8.6V16.8 M10.9 8.6C10.9 6.9 12 6 13.2 6C14.5 6 15.3 7 15.3 8.6V13.6C15.3 16.5 16.9 18.2 19.6 18.2 M19.6 18.2L17.5 16.5 M19.6 18.2L17.6 19.9"/></g></symbol>
            <symbol id="zg-sagittarius" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5.4 18.6L18.6 5.4 M18.6 5.4H13.9 M18.6 5.4V10.1 M8.6 11.6L12.4 15.4"/></g></symbol>
            <symbol id="zg-capricorn"   viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4.2 6.6C5.6 4.9 7.7 5.4 8.2 7.5C8.9 10.4 9.7 13.3 10.5 15.6 M10.5 15.6C11.2 12.1 12.2 8.2 13.7 7C15.2 5.9 16.4 6.9 16.4 8.6C16.4 10.3 15.1 11.1 15.1 13.1C15.1 15.4 16.7 16.4 18.1 15.7C19.6 15 19.8 12.9 18.6 12"/></g></symbol>
            <symbol id="zg-aquarius"    viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4.6 9.6L8.1 6.6L11.6 9.6L15.1 6.6L18.6 9.6 M4.6 16.8L8.1 13.8L11.6 16.8L15.1 13.8L18.6 16.8"/></g></symbol>
            <symbol id="zg-pisces"      viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7.2 4.6C9.9 7.6 9.9 16.4 7.2 19.4 M16.8 4.6C14.1 7.6 14.1 16.4 16.8 19.4 M5.6 12H18.4"/></g></symbol>
          </defs>
        </svg>
      </div>

      {/* copy */}
      <div>
        <div style={{ fontSize:13,letterSpacing:".14em",textTransform:"uppercase",color:"var(--accent-deep)",marginBottom:16 }}>
          Tak wygląda kosmogram
        </div>
        <h2 data-reveal style={{ fontSize:"clamp(32px,4vw,44px)",fontWeight:700,lineHeight:1.1,letterSpacing:"-.015em",marginBottom:20 }}>
          To nie horoskop z&nbsp;gazety. To kilkadziesiąt stron o&nbsp;Tobie.
        </h2>
        <p data-reveal style={{ fontSize:19,lineHeight:1.6,color:"var(--text-secondary)",marginBottom:36 }}>
          O tym, jak kochasz, czego unikasz i&nbsp;co przychodzi Ci łatwiej niż innym. Napisane tak, że czyta się jak list od kogoś, kto zna Cię od dawna.
        </p>
        <p data-reveal style={{ fontFamily:"var(--font-fraunces),serif",fontStyle:"italic",fontSize:"clamp(24px,2.6vw,30px)",lineHeight:1.35,color:"var(--voice)",marginBottom:28 }}>
          „Dom to dla Ciebie nie miejsce, do którego się wraca — to spokój, który uczysz się nosić w&nbsp;sobie."
        </p>
        <div data-reveal style={{ fontSize:14,color:"var(--text-muted)",marginBottom:18 }}>z modułu „Korzenie duszy"</div>
        <p data-reveal style={{ fontSize:18,color:"var(--text-primary)",marginBottom:34 }}>
          Obiecujemy jedno: w&nbsp;pierwszych trzech akapitach przeczytasz o&nbsp;sobie rzeczy, które czujesz od lat — a&nbsp;których nikt dotąd nie nazwał.
        </p>
        <Link
          href="/app/cosmogram"
          data-reveal
          style={{
            fontSize:16.5, padding:"15px 30px", display:"inline-block",
            color:"var(--text-primary)", textDecoration:"none",
            border:"1px solid var(--line)", borderRadius:999,
          }}
        >
          Zobacz przykładowy kosmogram →
        </Link>
      </div>

      <style>{`
        @media (max-width:900px) {
          .s2-grid { grid-template-columns: 1fr !important; gap: 48px !important; padding-top: 96px !important; }
        }
      `}</style>
    </section>
  );
}
