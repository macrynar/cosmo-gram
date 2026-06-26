import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAllMoonSigns, getMoonSign } from "@/lib/pseo/moonSigns";
import { SIGN_LOCATIVE } from "@/lib/i18n/astro";

const BASE = "https://www.cosmo-gram.com";
const HUB = "/ksiezyc-w-znaku";

export function generateStaticParams() {
  return getAllMoonSigns().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = getMoonSign(slug);
  if (!m) return {};
  const loc = SIGN_LOCATIVE[m.sign] ?? m.sign;
  const title = `Księżyc w ${loc}: co znaczy? · Cosmogram`;
  return {
    title,
    description: m.excerpt,
    alternates: { canonical: `${BASE}${HUB}/${m.slug}` },
    openGraph: {
      title: `Księżyc w ${loc}`,
      description: m.excerpt,
      url: `${BASE}${HUB}/${m.slug}`,
    },
  };
}

/* ─── style helpers (spójne z /cosmogram, /for-kids) ─── */
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

const BLOCKS: { key: "feeling" | "needs" | "love" | "shadow"; h: string }[] = [
  { key: "feeling", h: "Jak czujesz" },
  { key: "needs", h: "Czego potrzebujesz, żeby czuć się bezpiecznie" },
  { key: "love", h: "W bliskich relacjach" },
  { key: "shadow", h: "Druga strona" },
];

export default async function MoonSignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = getMoonSign(slug);
  if (!m) notFound();

  const loc = SIGN_LOCATIVE[m.sign] ?? m.sign;
  const all = getAllMoonSigns();
  // Sąsiednie znaki: pozostałe wpisy (rotacja od bieżącego), do 3. Działa dla dowolnej liczby.
  const idx = all.findIndex((x) => x.slug === m.slug);
  const neighbors = [...all.slice(idx + 1), ...all.slice(0, idx)].slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${BASE}${HUB}/${m.slug}`,
        url: `${BASE}${HUB}/${m.slug}`,
        name: `Księżyc w ${loc}`,
        description: m.excerpt,
        inLanguage: "pl",
        isPartOf: { "@id": `${BASE}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cosmogram", item: BASE },
          { "@type": "ListItem", position: 2, name: "Księżyc w znaku", item: `${BASE}${HUB}` },
          { "@type": "ListItem", position: 3, name: `Księżyc w ${loc}`, item: `${BASE}${HUB}/${m.slug}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: m.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
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

      {/* ─── HERO + LEAD ─── */}
      <header style={{ position: "relative", textAlign: "center", padding: "96px 22px 36px", overflow: "hidden" }}>
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(70% 70% at 50% 0%, rgba(224,181,102,.10) 0%, rgba(11,9,18,0) 70%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto" }}>
          <span style={eyebrow}>Księżyc w znaku</span>
          <h1 style={{ ...serif, fontSize: "clamp(34px, 5.4vw, 54px)", marginBottom: 14 }}>
            Księżyc w{" "}
            <span
              style={{
                background: "var(--grad-ember)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {loc}
            </span>
          </h1>
          <span
            style={{
              display: "inline-block",
              fontSize: 12,
              letterSpacing: "0.08em",
              color: "var(--accent-deep)",
              border: "1px solid rgba(224,181,102,.32)",
              background: "rgba(224,181,102,.06)",
              borderRadius: 999,
              padding: "4px 13px",
            }}
          >
            Żywioł: {m.element}
          </span>
        </div>
      </header>

      <section style={{ padding: "0 0 12px" }}>
        <div style={wrap}>
          <div
            style={{
              ...cardBase,
              borderLeft: "3px solid var(--accent-deep)",
              padding: "26px 28px",
              maxWidth: 780, margin: "0 auto",
            }}
          >
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--text-primary)", margin: 0 }}>{m.lead}</p>
          </div>
        </div>
      </section>

      {/* ─── BLOKI: feeling / needs / love / shadow ─── */}
      <section style={sectionPad}>
        <div style={{ ...wrap, maxWidth: 780 }}>
          {BLOCKS.map((b) => (
            <div key={b.key} style={{ marginBottom: 28 }}>
              <h2 style={{ ...serif, fontSize: "clamp(22px, 3vw, 28px)", marginBottom: 10 }}>{b.h}</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.7, margin: 0 }}>{m[b.key]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA do generatora ─── */}
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
              Nie wiesz, w jakim znaku masz Księżyc?
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 22 }}>
              Księżyc liczy się z daty i miejsca urodzenia, więc godzina nie jest potrzebna. Wynik dostajesz od ręki.
            </p>
            <Link href="/cosmogram" style={btnPrimary}>
              Wygeneruj swój kosmogram, za darmo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={sectionPad}>
        <div style={{ ...wrap, maxWidth: 780 }}>
          <span style={{ ...eyebrow, textAlign: "center" }}>FAQ</span>
          <h2 style={{ ...serif, fontSize: "clamp(24px, 3.2vw, 30px)", textAlign: "center", marginBottom: 22 }}>
            Częste pytania o Księżyc w {loc}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {m.faq.map((f) => (
              <details key={f.q} style={{ ...cardBase, borderRadius: 13, padding: "4px 18px" }}>
                <summary
                  style={{
                    cursor: "pointer", padding: "15px 0", fontWeight: 600, fontSize: 15,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    gap: 12, listStyle: "none", color: "var(--text-primary)",
                  }}
                >
                  {f.q}
                  <span style={{ color: "var(--accent-deep)", fontSize: 20, flexShrink: 0 }}>+</span>
                </summary>
                <p style={{ color: "var(--text-secondary)", fontSize: 14.5, lineHeight: 1.65, paddingBottom: 16, margin: 0 }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INNE ZNAKI KSIĘŻYCA ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <span style={eyebrow}>Inne znaki Księżyca</span>
            <h2 style={{ ...serif, fontSize: "clamp(22px, 3vw, 28px)" }}>Sprawdź pozostałe położenia</h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12, maxWidth: 820, margin: "0 auto",
            }}
          >
            {neighbors.map((n) => (
              <Link
                key={n.slug}
                href={`${HUB}/${n.slug}`}
                style={{ ...cardBase, padding: 18, textDecoration: "none", display: "block" }}
              >
                <div style={{ ...serif, fontSize: 17, color: "var(--text-primary)", marginBottom: 3 }}>
                  Księżyc w {SIGN_LOCATIVE[n.sign] ?? n.sign}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Żywioł: {n.element}</div>
              </Link>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 20 }}>
            <Link href={HUB} style={{ color: "var(--accent-deep)", textDecoration: "none", fontSize: 14.5 }}>
              Zobacz wszystkie znaki Księżyca →
            </Link>
          </p>
          <p style={{ textAlign: "center", marginTop: 8 }}>
            <Link href="/blog/czym-jest-kosmogram" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13.5 }}>
              Czym właściwie jest kosmogram?
            </Link>
          </p>
        </div>
      </section>

      {/* ─── DYSKLAIMER ─── */}
      <section style={{ padding: "8px 0 56px" }}>
        <div style={wrap}>
          <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 620, margin: "0 auto" }}>
            Opis znaku Księżyca to symboliczne lustro i punkt wyjścia do refleksji, nie przepowiednia ani diagnoza.
            Pełny obraz daje dopiero Twój cały kosmogram, nie jedno położenie.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
