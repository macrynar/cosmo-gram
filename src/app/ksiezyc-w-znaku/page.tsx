import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAllMoonSigns } from "@/lib/pseo/moonSigns";
import { SIGN_LOCATIVE } from "@/lib/i18n/astro";

const BASE = "https://www.cosmo-gram.com";
const HUB = "/ksiezyc-w-znaku";

export const metadata: Metadata = {
  title: "Księżyc w znaku: co znaczy Twój znak Księżyca? · Cosmogram",
  description:
    "Znak Księżyca opisuje Twój świat emocji i potrzeb. Sprawdź, co znaczy Księżyc w każdym ze znaków zodiaku, i policz swój za darmo.",
  alternates: { canonical: `${BASE}${HUB}` },
  openGraph: {
    title: "Księżyc w znaku: co znaczy Twój znak Księżyca?",
    description:
      "Znak Księżyca opisuje Twój świat emocji i potrzeb. Sprawdź, co znaczy Księżyc w każdym ze znaków zodiaku.",
    url: `${BASE}${HUB}`,
  },
};

/* ─── style helpers (spójne z /cosmogram) ─── */
const wrap: React.CSSProperties = { maxWidth: 1000, margin: "0 auto", padding: "0 22px" };
const serif: React.CSSProperties = { fontFamily: "var(--font-fraunces), 'Fraunces', serif", fontWeight: 500, letterSpacing: "0.01em", lineHeight: 1.15 };
const eyebrow: React.CSSProperties = { fontSize: 11, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--accent-deep)", display: "block", marginBottom: 10 };
const cardBase: React.CSSProperties = { background: "var(--bg-elevated)", border: "1px solid var(--line)", borderRadius: 16 };
const sectionPad: React.CSSProperties = { padding: "44px 0" };
const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "var(--grad-ember)", color: "#241704", border: "none",
  borderRadius: 999, fontWeight: 600, fontSize: 15, padding: "14px 30px",
  textDecoration: "none", boxShadow: "0 8px 26px rgba(255,174,61,.18)",
};

export default function MoonSignsHubPage() {
  const signs = getAllMoonSigns();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${BASE}${HUB}`,
        url: `${BASE}${HUB}`,
        name: "Księżyc w znaku",
        description: "Co znaczy Księżyc w każdym ze znaków zodiaku.",
        inLanguage: "pl",
        isPartOf: { "@id": `${BASE}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cosmogram", item: BASE },
          { "@type": "ListItem", position: 2, name: "Księżyc w znaku", item: `${BASE}${HUB}` },
        ],
      },
    ],
  };

  return (
    <div
      style={{
        background: "var(--bg-base)",
        color: "var(--text-primary)",
        fontFamily: "'General Sans', system-ui, sans-serif",
        lineHeight: 1.6,
        minHeight: "100vh",
      }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Navbar />

      {/* ─── HERO ─── */}
      <header style={{ position: "relative", textAlign: "center", padding: "96px 22px 36px", overflow: "hidden" }}>
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(70% 70% at 50% 0%, rgba(224,181,102,.10) 0%, rgba(11,9,18,0) 70%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
          <span style={eyebrow}>Księżyc w znaku</span>
          <h1 style={{ ...serif, fontSize: "clamp(32px, 5vw, 50px)", marginBottom: 16 }}>
            Co znaczy Twój{" "}
            <span
              style={{
                background: "var(--grad-ember)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              znak Księżyca
            </span>
            ?
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 17, lineHeight: 1.65, maxWidth: 600, margin: "0 auto" }}>
            O ile znak Słońca mówi, kim jesteś, znak Księżyca opisuje Twój świat emocji: jak czujesz, czego potrzebujesz,
            żeby było Ci bezpiecznie, i jak kochasz. To często ta część, w której rozpoznajesz siebie najmocniej.
          </p>
        </div>
      </header>

      {/* ─── INTRO + link do filaru ─── */}
      <section style={{ padding: "0 0 8px" }}>
        <div style={wrap}>
          <div
            style={{
              ...cardBase,
              borderLeft: "3px solid var(--accent-deep)",
              padding: "24px 26px",
              maxWidth: 780, margin: "0 auto",
            }}
          >
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-primary)", margin: 0 }}>
              Znak Księżyca to położenie Księżyca w chwili Twoich narodzin. Liczy się z daty i miejsca urodzenia, więc
              poznasz go nawet bez znajomości godziny. Jeśli dopiero zaczynasz, zobacz najpierw{" "}
              <Link href="/blog/czym-jest-kosmogram" style={{ color: "var(--accent-deep)", textDecoration: "none" }}>
                czym jest kosmogram
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ─── SIATKA ZNAKÓW ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ ...serif, fontSize: "clamp(24px, 3.2vw, 30px)" }}>Wybierz znak Księżyca</h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12, maxWidth: 860, margin: "0 auto",
            }}
          >
            {signs.map((s) => (
              <Link
                key={s.slug}
                href={`${HUB}/${s.slug}`}
                style={{
                  ...cardBase, padding: 18, textDecoration: "none", display: "flex",
                  justifyContent: "space-between", alignItems: "center", gap: 10,
                }}
              >
                <span style={{ ...serif, fontSize: 17, color: "var(--text-primary)" }}>
                  Księżyc w {SIGN_LOCATIVE[s.sign] ?? s.sign}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{s.element}</span>
              </Link>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--text-muted)" }}>
            Kolejne znaki dochodzą stopniowo.
          </p>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div
            style={{
              textAlign: "center", maxWidth: 680, margin: "0 auto",
              background: "radial-gradient(120% 120% at 50% 0%, rgba(224,181,102,.08), var(--bg-elevated))",
              border: "1px solid rgba(224,181,102,.22)",
              borderRadius: 22, padding: "40px 28px",
            }}
          >
            <h2 style={{ ...serif, fontSize: "clamp(24px, 3.2vw, 32px)", marginBottom: 10 }}>
              Nie znasz swojego znaku Księżyca?
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 22 }}>
              Policz go w kilkanaście sekund z daty i miejsca urodzenia. Godzina nie jest potrzebna.
            </p>
            <Link href="/cosmogram" style={btnPrimary}>
              Wygeneruj swój kosmogram, za darmo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
