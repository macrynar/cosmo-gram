import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kosmogram dziecka: mapa jego natury · Cosmogram",
  description:
    "Kosmogram dziecka pomaga rodzicowi zobaczyć temperament, potrzeby emocjonalne i naturalne talenty dziecka. Po polsku, z daty i miejsca urodzenia. Wygeneruj za darmo.",
  alternates: { canonical: "https://www.cosmo-gram.com/for-kids" },
  openGraph: {
    title: "Kosmogram dziecka: mapa jego natury · Cosmogram",
    description:
      "Zrozum temperament i potrzeby swojego dziecka przez pryzmat astrologii. Interpretacja po polsku, dla rodzica.",
    url: "https://www.cosmo-gram.com/for-kids",
    images: [{ url: "https://www.cosmo-gram.com/og-default.png", width: 1200, height: 630 }],
  },
};

const FAQ_ITEMS = [
  {
    q: "Po co dziecku kosmogram?",
    a: "Nie dziecku, a Tobie. To narzędzie dla rodzica: pomaga wcześniej zrozumieć temperament i potrzeby, zamiast uczyć się ich metodą prób i błędów.",
  },
  {
    q: "Czy to nie szufladkowanie dziecka?",
    a: "Odwrotnie. Kosmogram nie mówi, kim dziecko ma być. Pokazuje, z czym przyszło na świat, żebyś wspierał_a je tam, gdzie jest, a nie tam, gdzie wygodniej.",
  },
  {
    q: "Od jakiego wieku ma sens?",
    a: "Od urodzenia. Najwięcej daje rodzicom małych dzieci, które jeszcze nie potrafią nazwać swoich potrzeb.",
  },
  {
    q: "Czy potrzebna jest godzina urodzenia?",
    a: "Nie jest konieczna. Bez niej dostajesz pełny portret z pozycji planet. Godzina dodaje warstwę tego, co wschodziło na horyzoncie, i obszary życia.",
  },
  {
    q: "Czy to wróżenie?",
    a: "Nie. To symboliczne lustro i punkt wyjścia do rozmowy, nie przepowiednia ani diagnoza. Treści mają charakter refleksyjny i nie zastępują porady psychologicznej ani pedagogicznej.",
  },
];

const JSON_WEBPAGE = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Kosmogram dziecka: mapa jego natury",
  description:
    "Kosmogram dziecka pomaga rodzicowi zobaczyć temperament, potrzeby emocjonalne i naturalne talenty dziecka.",
  url: "https://www.cosmo-gram.com/for-kids",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Cosmogram", item: "https://www.cosmo-gram.com" },
      { "@type": "ListItem", position: 2, name: "Kosmogram dziecka", item: "https://www.cosmo-gram.com/for-kids" },
    ],
  },
};

const JSON_APP = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Kosmogram dziecka",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "PLN" },
};

const JSON_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

/* ─── style helpers (spójne z /cosmogram) ─── */
const wrap: React.CSSProperties = { maxWidth: 1000, margin: "0 auto", padding: "0 22px" };
const secH: React.CSSProperties = { textAlign: "center", maxWidth: 620, margin: "0 auto 34px" };
const serif: React.CSSProperties = { fontFamily: "var(--font-fraunces), 'Fraunces', serif", fontWeight: 500, letterSpacing: "0.01em", lineHeight: 1.15 };
const eyebrow: React.CSSProperties = { fontSize: 11, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--accent-deep)", display: "block", marginBottom: 10 };
const cardBase: React.CSSProperties = { background: "var(--bg-elevated)", border: "1px solid var(--line)", borderRadius: 16 };
const sectionPad: React.CSSProperties = { padding: "54px 0" };
const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "var(--grad-ember)", color: "#241704", border: "none",
  borderRadius: 999, fontWeight: 600, cursor: "pointer",
  fontSize: 15, padding: "14px 30px", textDecoration: "none",
  boxShadow: "0 8px 26px rgba(255,174,61,.18)",
};

export default function ForKidsPage() {
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_WEBPAGE) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_APP) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_FAQ) }} />

      <Navbar />

      {/* ─── HERO ─── */}
      <header style={{ position: "relative", textAlign: "center", padding: "96px 22px 60px", overflow: "hidden" }}>
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(70% 70% at 50% 0%, rgba(224,181,102,.10) 0%, rgba(11,9,18,0) 70%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto" }}>
          <span style={eyebrow}>Dla rodziców</span>
          <h1 style={{ ...serif, fontSize: "clamp(34px, 5.4vw, 54px)", marginBottom: 14 }}>
            Kosmogram dziecka
            <br />
            <span
              style={{
                background: "var(--grad-ember)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              mapa jego natury, od pierwszego oddechu
            </span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 17, lineHeight: 1.65, maxWidth: 620, margin: "0 auto 30px" }}>
            Każde dziecko przychodzi na świat z gotowym temperamentem, którego nie wybierało. Kosmogram pomaga go zobaczyć:
            jak Twoje dziecko czuje, czego potrzebuje, żeby było mu bezpiecznie, i co je naturalnie ciągnie. Nie po to, żeby
            je zaszufladkować. Po to, żeby mniej zgadywać, a lepiej rozumieć.
          </p>
          <Link href="/signup" style={btnPrimary}>
            Stwórz kosmogram dziecka, za darmo
          </Link>
          <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--text-muted)" }}>
            Bez karty · wystarczy data i miejsce urodzenia dziecka
          </p>
        </div>
      </header>

      {/* ─── DEFINICJA (GEO snippet) ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div
            style={{
              ...cardBase,
              borderLeft: "3px solid var(--accent-deep)",
              padding: "26px 28px",
              maxWidth: 780, margin: "0 auto",
            }}
          >
            <span style={eyebrow}>Czym jest kosmogram dziecka?</span>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--text-primary)" }}>
              <strong style={{ color: "var(--accent-deep)", fontWeight: 600 }}>Kosmogram dziecka</strong> to ta sama mapa
              nieba co u dorosłych, czytana pod kątem rodzica: temperamentu, potrzeb emocjonalnych i naturalnych
              predyspozycji. Powstaje z daty, miejsca i, jeśli ją znasz, godziny urodzenia dziecka. Nie ocenia i nie
              diagnozuje. Daje język do rozmowy o tym, kim Twoje dziecko już jest.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CO ODCZYTASZ ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Co odczytasz</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Trzy rzeczy, które łatwiej zobaczyć wcześniej
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                title: "Temperament i emocje",
                desc: "Jak Twoje dziecko reaguje, co je uspokaja, a co przebodźcowuje. Czemu jedno potrzebuje ruchu, a inne ciszy.",
              },
              {
                title: "Potrzeby i poczucie bezpieczeństwa",
                desc: "Czego potrzebuje, żeby czuć się kochane i pewne. Jak okazywać mu bliskość w sposób, który do niego trafia.",
              },
              {
                title: "Talenty i ciekawość",
                desc: "W którą stronę naturalnie ciągnie, jak się uczy, gdzie szukać dla niego przestrzeni do rozwoju.",
              },
            ].map((card) => (
              <div key={card.title} style={{ ...cardBase, padding: 22 }}>
                <h3 style={{ ...serif, fontSize: 18, marginBottom: 8 }}>{card.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── JAK TO DZIAŁA ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Jak to działa</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Trzy kroki do portretu dziecka
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                n: "1", title: "Podaj dane dziecka",
                desc: "Data i miejsce wystarczą. Godzinę, jeśli ją znasz, dodasz dla pełniejszego portretu.",
              },
              {
                n: "2", title: "Liczymy niebo z tamtej chwili",
                desc: "Pozycje planet z danych astronomicznych NASA, co do stopnia.",
              },
              {
                n: "3", title: "Astrea pisze portret dla rodzica",
                desc: "Po polsku, ciepło i konkretnie, językiem potrzeb, nie wróżby.",
              },
            ].map((step) => (
              <div key={step.n} style={{ ...cardBase, padding: 22 }}>
                <div
                  style={{
                    ...serif, fontSize: 13, color: "var(--accent-deep)",
                    border: "1px solid var(--line)", width: 30, height: 30, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 13,
                  }}
                >
                  {step.n}
                </div>
                <h3 style={{ ...serif, fontSize: 17, marginBottom: 7 }}>{step.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>FAQ</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Najczęstsze pytania rodziców
            </h2>
          </div>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} style={{ ...cardBase, borderRadius: 13, padding: "4px 18px" }}>
                <summary
                  style={{
                    cursor: "pointer", padding: "15px 0",
                    fontWeight: 600, fontSize: 15,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    gap: 12, listStyle: "none",
                    color: "var(--text-primary)",
                  }}
                >
                  {item.q}
                  <span style={{ color: "var(--accent-deep)", fontSize: 20, flexShrink: 0 }}>+</span>
                </summary>
                <p style={{ color: "var(--text-secondary)", fontSize: 14.5, lineHeight: 1.65, paddingBottom: 16 }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
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
              borderRadius: 22, padding: "44px 28px",
            }}
          >
            <h2 style={{ ...serif, fontSize: "clamp(28px, 3.6vw, 38px)", marginBottom: 12 }}>
              Poznaj naturę swojego dziecka
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              Wystarczy data i miejsce urodzenia. Portret gotowy w kilkanaście sekund.
            </p>
            <Link href="/signup" style={btnPrimary}>
              Stwórz kosmogram dziecka, za darmo
            </Link>
            <p style={{ marginTop: 18, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 520, marginInline: "auto" }}>
              Kosmogram dziecka to symboliczne lustro i punkt wyjścia do rozmowy, nie diagnoza. Treści mają charakter
              refleksyjny i nie zastępują porady psychologicznej, pedagogicznej ani medycznej.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
