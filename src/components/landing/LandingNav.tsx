"use client";

import Link from "next/link";

export default function LandingNav() {
  return (
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
        padding: "28px 32px",
        animation: "fadeInLanding .8s cubic-bezier(.22,1,.36,1) .2s both",
      }}
    >
      <Link
        href="/"
        aria-label="Cosmogram — strona główna"
        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text-primary)" }}
      >
        <svg width="30" height="30" viewBox="0 0 120 120" aria-hidden="true">
          <g transform="translate(55,60)" fill="#F4F1EA" stroke="#F4F1EA" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
            <path d="M 28.79,-40.86 A 50,50 0 1,0 28.79,40.86 A 40,40 0 1,1 28.79,-40.86 Z" />
            <circle cx="10" cy="0" r="9" stroke="none" />
          </g>
        </svg>
        <span style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-0.02em" }}>cosmogram</span>
      </Link>

      <ul
        style={{ display: "flex", gap: 8, listStyle: "none", margin: 0, padding: 0 }}
        className="landing-menu"
      >
        {[
          ["Kosmogram", "#s4"],
          ["Cosmo Match", "#s4"],
          ["Cosmo Chat", "#s4"],
          ["Cennik", "#s6"],
        ].map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              style={{ fontSize: 15.5, color: "var(--text-secondary)", textDecoration: "none", padding: "8px 12px", display: "block" }}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link
          href="/app/cosmogram"
          style={{ fontSize: 15.5, color: "var(--text-secondary)", textDecoration: "none", padding: "8px 12px" }}
          className="landing-nav-login"
        >
          Zaloguj
        </Link>
        <Link
          href="/app/cosmogram"
          style={{
            fontSize: 15.5,
            fontWeight: 500,
            color: "var(--text-primary)",
            textDecoration: "none",
            border: "1px solid var(--line)",
            borderRadius: 999,
            padding: "11px 22px",
          }}
        >
          Załóż konto
        </Link>
      </div>
    </nav>
  );
}
