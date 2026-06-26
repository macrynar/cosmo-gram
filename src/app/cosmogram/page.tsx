import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kosmogram natalny: mapa nieba z chwili urodzenia · Cosmogram",
  description:
    "Kosmogram natalny (horoskop urodzeniowy) to mapa położenia planet w chwili Twoich narodzin. Interpretacja AI po polsku, obliczenia z danych astronomicznych NASA. Wygeneruj za darmo.",
  alternates: { canonical: "https://www.cosmo-gram.com/cosmogram" },
  openGraph: {
    title: "Kosmogram natalny: mapa nieba z chwili urodzenia · Cosmogram",
    description:
      "Kosmogram natalny (horoskop urodzeniowy) to mapa położenia planet w chwili Twoich narodzin. Interpretacja AI po polsku, obliczenia z danych astronomicznych NASA. Wygeneruj za darmo.",
    url: "https://www.cosmo-gram.com/cosmogram",
  },
};

const HERO_IMG =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3EFduSqbvnymFyBD7x7Gq2XzuOp/hf_20260617_094724_e702b157-0512-4a98-bcb1-9514e87ac946.png";

const FAQ_ITEMS = [
  {
    q: "Czym jest kosmogram?",
    a: "Kosmogram (horoskop urodzeniowy, natalny) to mapa położenia Słońca, Księżyca i planet w chwili Twoich narodzin, obliczana z daty, godziny i miejsca urodzenia. Pokazuje Twój indywidualny układ, nie znak, pod który trafia 1/12 ludzi.",
  },
  {
    q: "Czy kosmogram jest za darmo?",
    a: "Tak. Pierwszy kosmogram i podstawową interpretację wygenerujesz bezpłatnie, bez karty. Pełna, pogłębiona interpretacja i pozostałe funkcje są w planie Cosmogram Plus.",
  },
  {
    q: "Czy potrzebuję godziny urodzenia?",
    a: "Do pełnego wyniku tak. Godzina wyznacza Ascendent i domy, które zmieniają się co ok. dwie godziny. Bez godziny policzymy przybliżony kosmogram (bez Ascendentu i domów, z orientacyjną pozycją Księżyca).",
  },
  {
    q: "Czym kosmogram różni się od horoskopu z gazety?",
    a: 'Horoskop „pod znak” patrzy tylko na Słońce i jest wspólny dla milionów osób. Kosmogram uwzględnia położenie wszystkich planet w Twoim momencie narodzin, dlatego jest osobisty i znacznie dokładniejszy.',
  },
  {
    q: "Skąd biorą się obliczenia?",
    a: "Z danych astronomicznych NASA (efemeryd NASA JPL), na których opiera się Swiss Ephemeris, standard zawodowych astrologów. Interpretację pisze Astrea po polsku, dla Twojego konkretnego układu.",
  },
  {
    q: "Co to jest ascendent?",
    a: "Ascendent to znak zodiaku wschodzący nad wschodnim horyzontem w chwili Twoich narodzin. Opisuje pierwsze wrażenie i to, jak odbierają Cię inni. Do jego wyznaczenia potrzebna jest godzina urodzenia.",
  },
  {
    q: "Czy to wróżenie?",
    a: "Nie. Traktujemy astrologię jak symboliczne lustro do autorefleksji, a nie wyrocznię. Treści mają charakter refleksyjny i rozrywkowy, nie zastępują porady medycznej, psychologicznej, prawnej ani finansowej.",
  },
];

const JSON_WEBPAGE = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Kosmogram natalny: mapa nieba z chwili urodzenia",
  description: "Oblicz swój kosmogram natalny za darmo. Interpretacja AI po polsku, obliczenia z danych astronomicznych NASA.",
  url: "https://www.cosmo-gram.com/cosmogram",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Cosmogram", item: "https://www.cosmo-gram.com" },
      { "@type": "ListItem", position: 2, name: "Kosmogram natalny", item: "https://www.cosmo-gram.com/cosmogram" },
    ],
  },
};

const JSON_APP = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Kosmogram natalny",
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

const JSON_HOWTO = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Jak obliczyć swój kosmogram",
  step: [
    {
      "@type": "HowToStep",
      name: "Podaj dane urodzenia",
      text: "Data, dokładna godzina i miejsce urodzenia.",
    },
    {
      "@type": "HowToStep",
      name: "Liczymy wykres",
      text: "Pozycje planet i domów z danych astronomicznych NASA.",
    },
    {
      "@type": "HowToStep",
      name: "AI pisze interpretację",
      text: "Po polsku, dla Twojego konkretnego układu planet.",
    },
  ],
};

/* ─── style helpers ─── */
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
const btnLine: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  border: "1px solid rgba(224,181,102,.4)", color: "var(--voice)",
  background: "rgba(224,181,102,.06)", borderRadius: 999,
  fontWeight: 600, fontSize: 15, padding: "14px 30px", textDecoration: "none",
};

/* ─── inline SVG icons ─── */
function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8z" />
    </svg>
  );
}
function IconHeart() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 20.3l-1.3-1.2C6 14.8 3.5 12.5 3.5 9.4 3.5 7 5.4 5.2 7.7 5.2c1.3 0 2.6.6 3.4 1.6.8-1 2.1-1.6 3.4-1.6 2.3 0 4.2 1.8 4.2 4.2 0 3.1-2.5 5.4-7.2 9.7L12 20.3z" />
    </svg>
  );
}
function IconCal() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6 7 7M17 17l1.4 1.4" />
    </svg>
  );
}

export default function CosmogramPage() {
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_HOWTO) }} />

      <Navbar />

      {/* ─── HERO ─── */}
      <header
        style={{
          position: "relative",
          textAlign: "center",
          padding: "90px 22px 70px",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `url("${HERO_IMG}")`,
            backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5,
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(70% 70% at 50% 35%, rgba(11,9,18,.35) 0%, rgba(11,9,18,.86) 70%, var(--bg-base) 100%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto" }}>
          <h1
            style={{
              ...serif,
              fontSize: "clamp(34px, 5.4vw, 54px)",
              marginBottom: 18,
            }}
          >
            Twoja mapa nieba
            <br />
            <span
              style={{
                background: "var(--grad-ember)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              z chwili urodzenia
            </span>
          </h1>
          <p
            style={{
              color: "var(--text-secondary)", fontSize: 17, lineHeight: 1.65,
              maxWidth: 600, margin: "0 auto 30px",
            }}
          >
            Kosmogram (horoskop urodzeniowy) to precyzyjna mapa położenia wszystkich planet
            w momencie Twoich narodzin. U nas czyta go AI po polsku, z głębią, jakiej nie da
            darmowy kalkulator. Obliczenia oparte na danych astronomicznych NASA.
          </p>
          <Link href="/signup" style={btnPrimary}>
            <IconStar />
            Wygeneruj swój kosmogram, za darmo
          </Link>
          <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--text-muted)" }}>
            Potrzebujesz tylko daty, godziny i miejsca urodzenia · gotowe w kilkanaście sekund
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
            <span style={eyebrow}>Czym jest kosmogram?</span>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--text-primary)" }}>
              <strong style={{ color: "var(--accent-deep)", fontWeight: 600 }}>Kosmogram</strong>,
              nazywany też horoskopem urodzeniowym lub natalnym, to wykres pokazujący, gdzie znajdowały
              się Słońce, Księżyc i planety w chwili Twoich narodzin. W przeciwieństwie do horoskopu
              „pod znak" opiera się na dokładnej{" "}
              <strong style={{ color: "var(--accent-deep)", fontWeight: 600 }}>
                dacie, godzinie i miejscu urodzenia
              </strong>{" "}
              i dlatego jest jedyny w swoim rodzaju, jak odcisk palca.
            </p>
          </div>
        </div>
      </section>

      {/* ─── JAK TO DZIAŁA (HowTo) ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Jak to działa</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Jak obliczyć swój kosmogram
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15.5 }}>
              Trzy kroki, kilkanaście sekund.
            </p>
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
                n: "1", title: "Podaj dane urodzenia",
                desc: "Data, dokładna godzina i miejsce. Im dokładniejsza godzina, tym precyzyjniejszy Ascendent i domy.",
              },
              {
                n: "2", title: "Liczymy wykres",
                desc: "Pozycje planet i domów z danych astronomicznych NASA, tych samych efemeryd, których używają zawodowi astrolodzy.",
              },
              {
                n: "3", title: "AI pisze interpretację",
                desc: "Po polsku, dla Twojego konkretnego układu planet, nie ogólniki ze znaku Słońca.",
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
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CO POKAZUJE (Wielka Trójka + planety) ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Co pokazuje Twój kosmogram</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Od Wielkiej Trójki po wszystkie planety
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15.5 }}>
              Zaczynamy od trzech filarów, potem reszta układu: i domy, i aspekty między planetami.
            </p>
          </div>

          {/* Wielka Trójka */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14, marginBottom: 14,
            }}
          >
            {[
              { glyph: "☉︎", name: "Słońce", desc: "Twoja tożsamość, wola i cel życiowy." },
              { glyph: "☽︎", name: "Księżyc", desc: "Emocje, instynkty i poczucie bezpieczeństwa." },
              { glyph: "↑", name: "Ascendent", desc: "Maska, którą pokazujesz światu, i pierwsze wrażenie." },
            ].map((p) => (
              <div key={p.name} style={{ ...cardBase, padding: 20, textAlign: "center" }}>
                <span
                  style={{
                    fontSize: 30, lineHeight: 1, display: "block", marginBottom: 10,
                    color: "var(--accent-deep)",
                  }}
                >
                  {p.glyph}
                </span>
                <h3 style={{ ...serif, fontSize: 18, marginBottom: 5 }}>{p.name}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5 }}>{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Pozostałe planety */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {[
              { glyph: "☿︎", name: "Merkury", desc: "Myślenie i komunikacja" },
              { glyph: "♀︎", name: "Wenus", desc: "Miłość i wartości" },
              { glyph: "♂︎", name: "Mars", desc: "Energia i działanie" },
              { glyph: "♃︎", name: "Jowisz", desc: "Rozwój i sens" },
              { glyph: "♄︎", name: "Saturn", desc: "Dyscyplina i dojrzałość" },
            ].map((p) => (
              <div
                key={p.name}
                style={{
                  background: "rgba(182,175,198,.03)", border: "1px solid var(--line)",
                  borderRadius: 13, padding: 14, textAlign: "center",
                }}
              >
                <span style={{ fontSize: 22, color: "var(--accent-deep)" }}>{p.glyph}</span>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 6 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>
                  {p.desc}
                </div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 18 }}>
            …a do tego 12 domów (obszary życia) i aspekty, czyli kąty, które planety tworzą między sobą.
          </p>
        </div>
      </section>

      {/* ─── TABELA PORÓWNAWCZA ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Dlaczego to nie to samo</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Kosmogram a horoskop „pod znak"
            </h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%", borderCollapse: "collapse",
                maxWidth: 820, margin: "0 auto", fontSize: 14.5,
              }}
            >
              <thead>
                <tr>
                  <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid var(--line)", ...serif, fontSize: 16 }} />
                  <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid var(--line)", ...serif, fontSize: 16, color: "var(--accent-deep)" }}>
                    Kosmogram natalny
                  </th>
                  <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid var(--line)", ...serif, fontSize: 16 }}>
                    Horoskop z gazety
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Na czym oparty", "data + godzina + miejsce urodzenia", "tylko znak Słońca"],
                  ["Personalizacja", "unikalny dla Ciebie", "wspólny dla 1/12 ludzi"],
                  ["Dokładność", "pozycje wszystkich planet (dane astronomiczne NASA)", "uproszczenie"],
                  ["Głębia", "osobowość, relacje, kariera, emocje", "jedno zdanie na dzień"],
                ].map(([label, a, b]) => (
                  <tr key={label}>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", color: "var(--text-muted)", fontWeight: 500 }}>{label}</td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", color: "var(--text-primary)" }}>{a}</td>
                    <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", color: "var(--text-muted)" }}>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── ASCENDENT / BEZ GODZINY ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div
            style={{
              ...cardBase, padding: 28,
              display: "grid", gap: 8,
              maxWidth: 820, margin: "0 auto",
            }}
          >
            <h3 style={{ ...serif, fontSize: 21, marginBottom: 4 }}>Ascendent i godzina urodzenia</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
              Ascendent, znak wschodzący nad horyzontem w chwili narodzin, zmienia się mniej więcej
              co dwie godziny. Dlatego do pełnego kosmogramu potrzebna jest dokładna{" "}
              <strong style={{ color: "var(--accent-deep)", fontWeight: 600 }}>godzina urodzenia</strong>
              {" "}(znajdziesz ją w akcie urodzenia). Nie znasz godziny? Policzymy przybliżony kosmogram,
              bez Ascendentu i domów, z orientacyjną pozycją Księżyca, wciąż wartościowy.
            </p>
          </div>
        </div>
      </section>

      {/* ─── KOSMOGRAM DZIECKA ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.35fr 0.9fr",
              gap: 26, alignItems: "center",
              maxWidth: 900, margin: "0 auto",
              background: "radial-gradient(130% 140% at 0% 0%, rgba(224,181,102,.09), var(--bg-elevated))",
              border: "1px solid rgba(224,181,102,.26)",
              borderRadius: 22, padding: 34,
            }}
          >
            <div>
              <span style={eyebrow}>Dla rodziców</span>
              <h2 style={{ ...serif, fontSize: "clamp(24px, 3vw, 30px)", marginBottom: 12 }}>
                Kosmogram dziecka
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 18 }}>
                Interpretacja skupiona na tym, czego potrzebuje dziecko, nie na tym, kim będzie.
                Pomaga rozumieć temperament, świat emocji i sposób uczenia się malucha, z konkretnymi
                wskazówkami dla rodzica.
              </p>
              <ul
                style={{
                  listStyle: "none", display: "grid",
                  gridTemplateColumns: "1fr 1fr", gap: "9px 18px",
                  marginBottom: 24, padding: 0,
                }}
              >
                {[
                  "Temperament i naturalne skłonności",
                  "Potrzeby emocjonalne i przywiązanie",
                  "Jak dziecko uczy się najlepiej",
                  "Wskazówki dla rodzica: praktyczne",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      position: "relative", paddingLeft: 18,
                      fontSize: 13.5, color: "var(--text-secondary)",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute", left: 0, top: 8,
                        width: 6, height: 6, borderRadius: "50%",
                        background: "var(--accent)", display: "inline-block",
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/for-kids" style={btnLine}>
                Zobacz kosmogram dziecka →
              </Link>
            </div>
            <div
              aria-hidden
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="170" height="170" viewBox="0 0 200 200" fill="none">
                <circle cx="100" cy="100" r="80" stroke="rgba(224,181,102,.22)" strokeWidth="1" />
                <circle cx="100" cy="100" r="60" stroke="rgba(224,181,102,.16)" strokeWidth="1" />
                <path
                  d="M120 64a44 44 0 1 0 0 72 35 35 0 0 1 0-72z"
                  fill="rgba(224,181,102,.16)" stroke="#E0B566" strokeWidth="1.6"
                />
                <path d="M70 58l2.8 7.2L80 68l-7.2 2.8L70 78l-2.8-7.2L60 68l7.2-2.8z" fill="#FFAE3D" />
                <path d="M138 124l2 5.2 5.2 2-5.2 2-2 5.2-2-5.2-5.2-2 5.2-2z" fill="#E0B566" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ─── POWIĄZANE ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Więcej w Cosmogram</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Gdy poznasz już swój kosmogram
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 14, maxWidth: 820, margin: "0 auto",
            }}
          >
            {[
              {
                icon: <IconHeart />,
                title: "Cosmo Match",
                desc: "Synastria: nałóż swój kosmogram na kosmogram drugiej osoby i sprawdź kompatybilność.",
                href: "/match",
              },
              {
                icon: <IconCal />,
                title: "Kalendarz astronomiczny",
                desc: "Twoje Dni Mocy i prognoza na dziś, tydzień, miesiąc i rok.",
                href: "/calendar",
              },
              {
                icon: <IconChat />,
                title: "Cosmo Chat",
                desc: "Astrea, astrolog AI, który zna Twój układ planet i odpowiada własnym głosem.",
                href: "/app/chat",
              },
              {
                icon: <IconSun />,
                title: "Horoskop dzienny",
                desc: "Codzienna refleksja liczona dla Ciebie, nie dla znaku z gazety.",
                href: "/daily",
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                style={{
                  display: "flex", gap: 13, alignItems: "flex-start",
                  ...cardBase, padding: 18, textDecoration: "none",
                  transition: "border-color .2s",
                }}
              >
                <span
                  style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "rgba(224,181,102,.10)", border: "1px solid rgba(224,181,102,.22)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--accent-deep)",
                  }}
                >
                  {card.icon}
                </span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 3 }}>{card.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{card.desc}</p>
                </div>
              </Link>
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
              Najczęstsze pytania o kosmogram
            </h2>
          </div>
          <div
            style={{
              maxWidth: 760, margin: "0 auto",
              display: "flex", flexDirection: "column", gap: 10,
            }}
          >
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                style={{
                  ...cardBase, borderRadius: 13, padding: "4px 18px",
                }}
              >
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
                <p
                  style={{
                    color: "var(--text-secondary)", fontSize: 14.5,
                    lineHeight: 1.65, paddingBottom: 16,
                  }}
                >
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
              Gotowy zobaczyć swój kosmogram?
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              Potrzebujesz tylko daty, godziny i miejsca urodzenia. Interpretacja gotowa w kilkanaście sekund.
            </p>
            <Link href="/signup" style={btnPrimary}>
              Zacznij za darmo →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
