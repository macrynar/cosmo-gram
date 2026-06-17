"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const NAV_LINKS = [
  ["Kosmogram", "/cosmogram"],
  ["Kalendarz", "/calendar"],
  ["Cosmo Match", "/match"],
  ["Cosmo Chat", "/cosmo-chat"],
  ["Cennik", "/pricing"],
] as const;

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  // lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1240,
          margin: "0 auto",
          padding: "28px 24px",
          animation: "fadeInLanding .8s cubic-bezier(.22,1,.36,1) .2s both",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="Cosmogram — strona główna"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text-primary)", zIndex: 21 }}
        >
          <svg width="30" height="30" viewBox="0 0 120 120" aria-hidden="true">
            <g transform="translate(55,60)" fill="#F4F1EA" stroke="#F4F1EA" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
              <path d="M 28.79,-40.86 A 50,50 0 1,0 28.79,40.86 A 40,40 0 1,1 28.79,-40.86 Z" />
              <circle cx="10" cy="0" r="9" stroke="none" />
            </g>
          </svg>
          <span style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-0.02em" }}>cosmogram</span>
        </Link>

        {/* Desktop menu */}
        <ul className="landing-desktop-menu" style={{ display: "flex", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
          {NAV_LINKS.map(([label, href]) => (
            <li key={label}>
              <Link href={href} className="landing-nav-link" style={{ fontSize: 15.5, color: "var(--text-secondary)", textDecoration: "none", padding: "8px 12px", display: "block", borderRadius: 999, transition: "color .2s, background .2s" }}>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop right */}
        <div className="landing-desktop-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/app/cosmogram" style={{ fontSize: 15.5, color: "var(--text-secondary)", textDecoration: "none", padding: "8px 12px" }}>
            Zaloguj
          </Link>
          <Link
            href="/app/cosmogram"
            style={{
              fontSize: 15.5, fontWeight: 500, color: "var(--text-primary)", textDecoration: "none",
              border: "1px solid var(--line)", borderRadius: 999, padding: "11px 22px",
            }}
          >
            Załóż konto
          </Link>
        </div>

        {/* Hamburger button (mobile only) */}
        <button
          className="hamburger-btn"
          aria-label={open ? "Zamknij menu" : "Otwórz menu"}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 8, color: "var(--text-primary)", zIndex: 21,
            display: "none", flexDirection: "column", gap: 5, alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ display: "block", width: 22, height: 1.5, background: "currentColor", transition: "transform .3s, opacity .3s", transform: open ? "rotate(45deg) translate(0, 4.5px)" : "none" }} />
          <span style={{ display: "block", width: 22, height: 1.5, background: "currentColor", transition: "opacity .3s", opacity: open ? 0 : 1 }} />
          <span style={{ display: "block", width: 22, height: 1.5, background: "currentColor", transition: "transform .3s, opacity .3s", transform: open ? "rotate(-45deg) translate(0, -4.5px)" : "none" }} />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className="mobile-menu-overlay"
        style={{
          position: "fixed", inset: 0, zIndex: 19,
          background: "rgba(11,9,18,.97)",
          backdropFilter: "blur(12px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 8,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .3s cubic-bezier(.22,1,.36,1)",
        }}
        aria-hidden={!open}
      >
        {NAV_LINKS.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            onClick={close}
            style={{
              fontSize: 28, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none",
              padding: "14px 32px", letterSpacing: "-.01em",
            }}
          >
            {label}
          </Link>
        ))}
        <div style={{ height: 24 }} />
        <Link
          href="/app/cosmogram"
          onClick={close}
          style={{
            fontSize: 17.5, fontWeight: 600, color: "var(--on-accent)",
            background: "var(--grad-ember)", borderRadius: 999, padding: "18px 40px",
            textDecoration: "none",
          }}
        >
          Odkryj swój kosmogram →
        </Link>
        <Link
          href="/app/cosmogram"
          onClick={close}
          style={{ fontSize: 15, color: "var(--text-muted)", textDecoration: "none", marginTop: 12 }}
        >
          Mam już konto — zaloguj
        </Link>
      </div>

      <style>{`
        .landing-nav-link:hover {
          color: #E9DCC0 !important;
          background: rgba(224,181,102,.08) !important;
        }
        @media (max-width: 768px) {
          .landing-desktop-menu { display: none !important; }
          .landing-desktop-right { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-overlay { display: none !important; }
        }
      `}</style>
    </>
  );
}
