import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cennik — Cosmogram",
  description:
    "Zacznij za darmo, przejdź na Plus, gdy chcesz więcej. Cosmogram Plus 19,90 zł/mc lub 199 zł/rok — pełna interpretacja, Cosmo Match, Kosmogram dziecka i Cosmo Chat z Astreą. Anuluj kiedy chcesz.",
  alternates: { canonical: "https://www.cosmo-gram.com/pricing" },
  openGraph: {
    title: "Cennik — Cosmogram",
    description:
      "Plan Free i Plus. Cosmogram — twój kosmiczny przewodnik — astrologia i AI w jednym miejscu.",
    url: "https://www.cosmo-gram.com/pricing",
    images: [{ url: "https://www.cosmo-gram.com/og-default.png", width: 1200, height: 630 }],
  },
};

const JSON_WEBPAGE = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.cosmo-gram.com/pricing",
      url: "https://www.cosmo-gram.com/pricing",
      name: "Cennik — Cosmogram",
      description:
        "Plany Free i Plus. Zacznij bez opłat, przejdź na Plus gdy chcesz pełnej interpretacji i Cosmo Chatu z Astreą.",
      inLanguage: "pl",
      isPartOf: { "@id": "https://www.cosmo-gram.com/#website" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Cosmogram", item: "https://www.cosmo-gram.com" },
        { "@type": "ListItem", position: 2, name: "Cennik", item: "https://www.cosmo-gram.com/pricing" },
      ],
    },
  ],
};

const JSON_PRODUCT = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Cosmogram Plus",
  description:
    "Pełna interpretacja kosmogramu natalnego, Cosmo Match (pełna analiza 8 wymiarów), Kosmogram dziecka i Cosmo Chat z Astreą (150 wiadomości miesięcznie).",
  brand: { "@type": "Brand", name: "Cosmogram" },
  offers: [
    {
      "@type": "Offer",
      name: "Plus miesięczny",
      price: "19.90",
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      url: "https://www.cosmo-gram.com/signup?plan=plus",
    },
    {
      "@type": "Offer",
      name: "Plus roczny",
      price: "199.00",
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      url: "https://www.cosmo-gram.com/signup?plan=plus-annual",
    },
  ],
};

const JSON_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Czy moge korzystac za darmo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tak - plan Free jest bezplatny na zawsze: pelny kosmogram z kolem, pierwszy rozdzial interpretacji, jeden Cosmo Match i kilka pytan do Astrei.",
      },
    },
    {
      "@type": "Question",
      name: "Ile kosztuje Plus?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "19,90 zl miesiecznie lub 199 zl rocznie (oszczedzasz 17%). Ceny brutto, bez ukrytych kosztow.",
      },
    },
    {
      "@type": "Question",
      name: "Czy moge anulowac w kazdej chwili?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tak - anulujesz jednym kliknieciem i zachowujesz dostep do konca oplaconego okresu.",
      },
    },
  ],
};

const wrap: React.CSSProperties = { maxWidth: 1000, margin: "0 auto", padding: "0 22px" };
const serif: React.CSSProperties = {
  fontFamily: "var(--font-fraunces), 'Fraunces', serif",
  fontWeight: 500,
  letterSpacing: "0.01em",
  lineHeight: 1.15,
};
const eyebrow: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  color: "var(--accent-deep, #E0B566)",
  display: "block",
  marginBottom: 10,
};
const sectionPad: React.CSSProperties = { padding: "50px 0" };

const CHECK_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    style={{ width: 16, height: 16, color: "var(--accent, #FFAE3D)", flexShrink: 0, marginTop: 2 }}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const STAR_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ width: 18, height: 18, color: "var(--accent, #FFAE3D)" }}
  >
    <path d="M5 16 3 7l5.5 4L12 5l3.5 6L21 7l-2 9z" />
  </svg>
);

export default function PricingPage() {
  return (
    <div
      style={{
        fontFamily: "'General Sans', system-ui, sans-serif",
        background: "radial-gradient(120% 80% at 50% 0%, #1A1530 0%, #0B0912 60%) fixed #0B0912",
        color: "#F4F1EA",
        minHeight: "100vh",
        lineHeight: 1.6,
      }}
    >
      <Navbar />

      <main style={{ paddingTop: 64 }}>

        {/* HERO */}
        <div style={{ textAlign: "center", padding: "70px 22px 30px", maxWidth: 760, margin: "0 auto" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--accent-deep, #E0B566)",
              border: "1px solid rgba(224,181,102,.28)",
              background: "rgba(224,181,102,.06)",
              borderRadius: 999,
              padding: "5px 14px",
              marginBottom: 18,
            }}
          >
            Plany i ceny
          </span>
          <h1 style={{ ...serif, fontSize: "clamp(30px, 4.4vw, 44px)", marginBottom: 14 }}>
            Zacznij za darmo.{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#FFC56B 0%,#E0992E 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Przejdz na Plus, gdy chcesz wiecej.
            </span>
          </h1>
          <p style={{ color: "#B6AFC6", fontSize: 16 }}>
            Free na start, Plus dla tych, którzy chcą zejść głębiej w swój kosmogram. Bez ukrytych kosztów — anulujesz, kiedy zechcesz.
          </p>
        </div>

        {/* PLANY */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 18,
            maxWidth: 880,
            margin: "0 auto",
            padding: "14px 22px 0",
          }}
        >
          {/* FREE */}
          <div
            style={{
              background: "#14101F",
              border: "1px solid #2B2540",
              borderRadius: 22,
              padding: 30,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 12.5, color: "#877FA0", marginBottom: 4 }}>Plan</div>
                <h3 style={{ ...serif, fontSize: 24 }}>Free</h3>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "5px 11px",
                  borderRadius: 999,
                  color: "#B6AFC6",
                  background: "rgba(182,175,198,.06)",
                  border: "1px solid #2B2540",
                }}
              >
                Bez opłat
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
              <span style={{ ...serif, fontSize: 38 }}>0 zł</span>
              <span style={{ color: "#877FA0", fontSize: 15 }}>na zawsze</span>
            </div>
            <div style={{ fontSize: 12, color: "#877FA0", marginBottom: 22 }}>
              Konto bez karty — wystarczy e-mail.
            </div>

            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {([
                ["Pełny kosmogram urodzeniowy z kołem i Wielką Trójką", false],
                ["Interpretacja AI kluczowych pozycji", "1 rozdział"],
                ["Cosmo Match", "wynik + 1 moduł"],
                ["Cosmo Chat", "3 wiadomości na start"],
                ["Horoskop dzienny — raz dziennie", false],
              ] as [string, string | false][]).map(([label, detail], i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: "#B6AFC6" }}>
                  {CHECK_ICON}
                  <span>
                    {detail ? <><strong style={{ color: "#F4F1EA" }}>{label}</strong> — {detail}</> : label}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              style={{
                display: "block",
                textAlign: "center",
                padding: "13px",
                fontSize: 14.5,
                fontWeight: 600,
                borderRadius: 13,
                border: "1px solid rgba(224,181,102,.4)",
                color: "#E9DCC0",
                background: "rgba(224,181,102,.06)",
                textDecoration: "none",
              }}
            >
              Startuję za darmo
            </Link>
          </div>

          {/* PLUS */}
          <div
            style={{
              background: "radial-gradient(130% 120% at 100% 0%, rgba(224,181,102,.10), #14101F)",
              border: "1px solid rgba(224,181,102,.42)",
              borderRadius: 22,
              padding: 30,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 12.5, color: "#E0B566", marginBottom: 4 }}>Plan</div>
                <h3 style={{ ...serif, fontSize: 24, display: "flex", alignItems: "center", gap: 8 }}>
                  Plus {STAR_ICON}
                </h3>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "5px 11px",
                  borderRadius: 999,
                  color: "#241704",
                  background: "linear-gradient(135deg,#FFC56B 0%,#E0992E 100%)",
                }}
              >
                ✦ Early Access
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
              <span style={{ ...serif, fontSize: 38 }}>19,90 zł</span>
              <span style={{ color: "#877FA0", fontSize: 15 }}>/ miesiąc</span>
            </div>
            <div style={{ fontSize: 13, color: "#877FA0", marginBottom: 4 }}>
              lub <strong style={{ color: "#E0B566" }}>199 zł / rok</strong>{" "}
              <span style={{ color: "#877FA0" }}>&asymp; 16,60 zł/mc</span> &middot;{" "}
              <span style={{ color: "#E0B566" }}>oszczędzasz 17%</span>
            </div>
            <div style={{ fontSize: 12, color: "#877FA0", marginBottom: 22 }}>
              Anuluj kiedy chcesz · bezpieczna płatność Stripe
            </div>

            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {([
                ["Pełna interpretacja kosmogramu", "wszystkie 8 rozdziałów o Tobie"],
                ["Cosmo Match — pełna analiza 8 wymiarów", "do 10 analiz miesięcznie: gdzie iskrzy, a gdzie tkwi potencjał"],
                ["Kosmogram dziecka", "temperament i potrzeby emocjonalne"],
                ["Cosmo Chat — 150 wiadomości miesięcznie", "z Astreą, z pełnym kontekstem Twojego kosmogramu (+ doładowania)"],
                ["Priorytetowe, dłuższe i głębsze odpowiedzi AI", false],
              ] as [string, string | false][]).map(([label, detail], i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: "#B6AFC6" }}>
                  {CHECK_ICON}
                  <span>
                    {detail ? <><strong style={{ color: "#F4F1EA" }}>{label}</strong> — {detail}</> : label}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup?plan=plus"
              style={{
                display: "block",
                textAlign: "center",
                padding: "13px",
                fontSize: 14.5,
                fontWeight: 600,
                borderRadius: 13,
                border: "none",
                color: "#241704",
                background: "linear-gradient(135deg,#FFC56B 0%,#E0992E 100%)",
                boxShadow: "0 8px 26px rgba(255,174,61,.18)",
                textDecoration: "none",
              }}
            >
              Kup Cosmogram Plus
            </Link>
          </div>
        </div>

        {/* TABELA */}
        <section style={sectionPad}>
          <div style={wrap}>
            <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 30px" }}>
              <span style={eyebrow}>Porównanie</span>
              <h2 style={{ ...serif, fontSize: "clamp(24px, 3.2vw, 30px)", marginBottom: 8 }}>
                Co dokładnie dostajesz
              </h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: 820, margin: "0 auto", fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "13px 14px", borderBottom: "1px solid #2B2540", textAlign: "left", ...serif, fontWeight: 500, fontSize: 15 }}>Funkcja</th>
                    <th style={{ padding: "13px 14px", borderBottom: "1px solid #2B2540", textAlign: "center", color: "#877FA0", ...serif, fontWeight: 500, fontSize: 15 }}>Free</th>
                    <th style={{ padding: "13px 14px", borderBottom: "1px solid #2B2540", textAlign: "center", color: "#E0B566", ...serif, fontWeight: 500, fontSize: 15 }}>Plus</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["Kosmogram urodzeniowy z kołem i Wielką Trójką", "check", "check"],
                      ["Rozdziały interpretacji o Tobie", "1 z 8", "wszystkie 8"],
                      ["Cosmo Match (synastria)", "wynik + 1 moduł", "pełna analiza · 10 / mies."],
                      ["Kosmogram dziecka", "none", "check"],
                      ["Cosmo Chat z Astreą", "3 wiadomości", "150 / miesiąc"],
                      ["Horoskop dzienny", "1× dziennie", "1× dziennie"],
                      ["Priorytetowe, dłuższe odpowiedzi AI", "none", "check"],
                    ] as [string, string, string][]
                  ).map(([label, free, plus], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #2B2540" }}>
                      <td style={{ padding: "13px 14px", color: "#B6AFC6" }}>{label}</td>
                      <td style={{ padding: "13px 14px", textAlign: "center" }}>
                        {free === "check" ? (
                          <span style={{ color: "#FFAE3D" }}>✓</span>
                        ) : free === "none" ? (
                          <span style={{ color: "#877FA0", opacity: 0.5 }}>—</span>
                        ) : (
                          <span style={{ color: "#F4F1EA", fontSize: 13 }}>{free}</span>
                        )}
                      </td>
                      <td style={{ padding: "13px 14px", textAlign: "center" }}>
                        {plus === "check" ? (
                          <span style={{ color: "#FFAE3D" }}>✓</span>
                        ) : plus === "none" ? (
                          <span style={{ color: "#877FA0", opacity: 0.5 }}>—</span>
                        ) : (
                          <span style={{ color: "#F4F1EA", fontSize: 13 }}>{plus}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={sectionPad}>
          <div style={wrap}>
            <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 30px" }}>
              <span style={eyebrow}>FAQ</span>
              <h2 style={{ ...serif, fontSize: "clamp(24px, 3.2vw, 30px)", marginBottom: 8 }}>
                Pytania o płatności
              </h2>
            </div>

            <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                {
                  q: "Czy mogę korzystać za darmo?",
                  a: "Tak. Plan Free jest bezpłatny na zawsze — pełny kosmogram z kołem, pierwszy rozdział interpretacji, jeden Cosmo Match i kilka pytań do Astrei. Konto zakładasz bez karty.",
                },
                {
                  q: "Co dokładnie odblokowuje Plus?",
                  a: "Pełną interpretację (wszystkie 8 rozdziałów), Cosmo Match z pełną analizą relacji (do 10 analiz miesięcznie), Kosmogram dziecka, Cosmo Chat z Astreą (150 wiadomości miesięcznie) z pełnym kontekstem Twojego kosmogramu oraz priorytetowe, dłuższe odpowiedzi AI.",
                },
                {
                  q: "Ile mogę rozmawiać z Astreą?",
                  a: "W planie Free masz 3 wiadomości na start. W Plus — 150 wiadomości miesięcznie, a licznik odnawia się co okres rozliczeniowy. Gdy potrzebujesz więcej, możesz w każdej chwili doładować dodatkową paczkę wiadomości.",
                },
                {
                  q: "Ile kosztuje Plus?",
                  a: "19,90 zł miesięcznie lub 199 zł rocznie (16,60 zł/mc — oszczędzasz 17%). Ceny brutto, bez ukrytych kosztów.",
                },
                {
                  q: "Czy mogę anulować w każdej chwili?",
                  a: "Tak. Subskrypcję anulujesz jednym kliknięciem w ustawieniach — zachowujesz dostęp do końca opłaconego okresu, bez automatycznych pułapek.",
                },
                {
                  q: "Jak wygląda płatność?",
                  a: "Bezpiecznie przez Stripe — kartą lub popularnymi metodami płatności. Nie przechowujemy danych Twojej karty.",
                },
                {
                  q: "Czy dostanę fakturę?",
                  a: "Tak, fakturę lub rachunek wystawiamy na życzenie po podaniu danych do rozliczenia.",
                },
              ].map(({ q, a }, i) => (
                <details
                  key={i}
                  style={{
                    background: "#14101F",
                    border: "1px solid #2B2540",
                    borderRadius: 13,
                    padding: "4px 18px",
                  }}
                >
                  <summary
                    style={{
                      listStyle: "none",
                      cursor: "pointer",
                      padding: "15px 0",
                      fontWeight: 600,
                      fontSize: 15,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      color: "#F4F1EA",
                    }}
                  >
                    {q}
                    <span style={{ color: "#E0B566", fontSize: 20, flexShrink: 0 }}>+</span>
                  </summary>
                  <p style={{ color: "#B6AFC6", fontSize: 14.5, lineHeight: 1.65, paddingBottom: 16, margin: 0 }}>
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA bottom */}
        <section style={{ ...sectionPad, textAlign: "center" }}>
          <div style={wrap}>
            <p style={{ color: "#877FA0", fontSize: 13, marginBottom: 24 }}>
              Masz pytania? Napisz do nas na{" "}
              <a href="mailto:czesc@cosmo-gram.com" style={{ color: "#E0B566", textDecoration: "none" }}>
                czesc@cosmo-gram.com
              </a>
            </p>
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
                color: "#241704",
                background: "linear-gradient(135deg,#FFC56B 0%,#E0992E 100%)",
                boxShadow: "0 8px 26px rgba(255,174,61,.22)",
                textDecoration: "none",
              }}
            >
              Zacznij za darmo
            </Link>
            <p style={{ marginTop: 12, fontSize: 12, color: "#877FA0" }}>
              Bez karty · bez zobowiązań
            </p>
          </div>
        </section>
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_WEBPAGE) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_PRODUCT) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_FAQ) }}
      />
    </div>
  );
}
