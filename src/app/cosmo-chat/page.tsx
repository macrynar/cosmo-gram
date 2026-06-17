import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cosmo Chat — astrolog AI, który zna Twój kosmogram · Cosmogram",
  description:
    "Cosmo Chat to astrolog AI po polsku. Rozmawiasz z Astreą, która czyta z Twojego kosmogramu i pamięta rozmowę — odpowiedzi o Tobie, nie ze znaku.",
  alternates: { canonical: "https://www.cosmo-gram.com/cosmo-chat" },
  openGraph: {
    title: "Cosmo Chat — astrolog AI, który zna Twój kosmogram",
    description:
      "Rozmawiaj z Astreą — AI, który zna Twój kosmogram. Odpowiedzi o Tobie, nie ze znaku.",
    url: "https://www.cosmo-gram.com/cosmo-chat",
    images: [{ url: "https://www.cosmo-gram.com/og-default.png", width: 1200, height: 630 }],
  },
};

const JSON_WEBPAGE = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.cosmo-gram.com/cosmo-chat",
      url: "https://www.cosmo-gram.com/cosmo-chat",
      name: "Cosmo Chat — astrolog AI, który zna Twój kosmogram · Cosmogram",
      description:
        "Rozmawiaj z Astreą, astrologiem AI po polsku, który czyta z Twojego kosmogramu i pamięta rozmowę.",
      inLanguage: "pl",
      isPartOf: { "@id": "https://www.cosmo-gram.com/#website" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Cosmogram", item: "https://www.cosmo-gram.com" },
        { "@type": "ListItem", position: 2, name: "Cosmo Chat", item: "https://www.cosmo-gram.com/cosmo-chat" },
      ],
    },
  ],
};

const JSON_APP = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cosmo Chat",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web, iOS, Android",
  inLanguage: "pl",
  description:
    "Astrea — astrolog AI, który czyta z Twojego kosmogramu natalnego. Personalizowane odpowiedzi, pamięć rozmowy, pełny kontekst Twojego układu planet.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "PLN" },
  url: "https://www.cosmo-gram.com/cosmo-chat",
};

const JSON_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Czym jest Cosmo Chat?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Astrolog AI po polsku — rozmowa z Astreą, która czyta odpowiedzi z Twojego policzonego kosmogramu i pamięta wcześniejsze wątki.",
      },
    },
    {
      "@type": "Question",
      name: "Czym różni się od zwykłego chatbota astrologicznego?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Zwykłe chatboty znają najwyżej Twój znak i zaczynają każdą rozmowę od zera. Astrea ma za kontekst Twój pełny kosmogram i pamięta rozmowy.",
      },
    },
    {
      "@type": "Question",
      name: "Skąd Astrea zna mój kosmogram?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Po wygenerowaniu kosmogramu (za darmo) Twój układ planet staje się kontekstem rozmowy. Dlatego najpierw kosmogram, potem czat.",
      },
    },
    {
      "@type": "Question",
      name: "Czy AI zastępuje astrologa?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nie — to narzędzie do autorefleksji, nie zamiennik człowieka. Przy zdrowiu i poważnych decyzjach kieruje do specjalisty.",
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
const secH: React.CSSProperties = { textAlign: "center", maxWidth: 640, margin: "0 auto 34px" };
const sectionPad: React.CSSProperties = { padding: "54px 0" };
const cardBase: React.CSSProperties = {
  background: "#14101F",
  border: "1px solid #2B2540",
  borderRadius: 16,
};

const CHAT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18 }}>
    <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" />
  </svg>
);

const SEND_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: 16, height: 16 }}>
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
  </svg>
);

export default function CosmoChatPage() {
  return (
    <div
      style={{
        fontFamily: "'General Sans', system-ui, sans-serif",
        background: "#0B0912",
        color: "#F4F1EA",
        minHeight: "100vh",
        lineHeight: 1.6,
      }}
    >
      <Navbar />

      <main style={{ paddingTop: 64 }}>

        {/* HERO */}
        <header
          style={{
            position: "relative",
            textAlign: "center",
            padding: "90px 22px 70px",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "url('https://d8j0ntlcm91z4.cloudfront.net/user_3EFduSqbvnymFyBD7x7Gq2XzuOp/hf_20260617_134051_885282b7-2052-47f9-967c-eecc61bc0236.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.52,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(68% 70% at 50% 38%, rgba(11,9,18,.32) 0%, rgba(11,9,18,.86) 70%, #0B0912 100%)",
            }}
          />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto" }}>
            <h1 style={{ ...serif, fontSize: "clamp(34px, 5.4vw, 54px)", marginBottom: 18 }}>
              Twój prywatny{" "}
              <span
                style={{
                  background: "linear-gradient(135deg,#FFC56B 0%,#E0992E 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                astrolog AI
              </span>
            </h1>
            <p style={{ color: "#B6AFC6", fontSize: 17, lineHeight: 1.65, maxWidth: 620, margin: "0 auto 30px" }}>
              Rozmawiaj z <strong style={{ color: "#E9DCC0", fontWeight: 500 }}>Astreą</strong> — astrologiem AI, który zna Twój kosmogram. Pytasz o cokolwiek, a odpowiedź wychodzi z Twojego układu planet, nie ze znaku. I pamięta, o czym rozmawialiście.
            </p>
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 30px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
                color: "#241704",
                background: "linear-gradient(135deg,#FFC56B 0%,#E0992E 100%)",
                boxShadow: "0 8px 26px rgba(255,174,61,.18)",
                textDecoration: "none",
              }}
            >
              {CHAT_ICON}
              Zacznij rozmowę
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <p style={{ marginTop: 14, fontSize: 12.5, color: "#877FA0" }}>
              Najpierw wygeneruj kosmogram — za darmo — a Astrea pozna Twój układ.
            </p>
          </div>
        </header>

        {/* DEFINICJA */}
        <section style={sectionPad}>
          <div style={wrap}>
            <div
              style={{
                background: "#14101F",
                border: "1px solid #2B2540",
                borderLeft: "3px solid #E0B566",
                borderRadius: 16,
                padding: "26px 28px",
                maxWidth: 800,
                margin: "0 auto",
              }}
            >
              <span style={eyebrow}>Czym jest Cosmo Chat?</span>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "#F4F1EA" }}>
                <strong style={{ color: "#E0B566", fontWeight: 600 }}>Cosmo Chat</strong> to rozmowa z Astreą, astrologiem AI po polsku. W odróżnieniu od zwykłego chatbota nie zgaduje ze znaku — czyta z Twojego{" "}
                <strong style={{ color: "#E0B566", fontWeight: 600 }}>policzonego kosmogramu</strong> i pamięta wcześniejsze wątki, jak ktoś, kto naprawdę Cię zna.
              </p>
            </div>
          </div>
        </section>

        {/* PRZYKŁADOWE PYTANIA */}
        <section style={sectionPad}>
          <div style={wrap}>
            <div style={secH}>
              <span style={eyebrow}>Przykładowe pytania</span>
              <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", marginBottom: 10 }}>
                O co ludzie pytają Astreę
              </h2>
              <p style={{ color: "#B6AFC6", fontSize: 15.5 }}>
                Nie o znak spod gazety — o własne życie: relacje, pracę, emocje, decyzje.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 14,
                maxWidth: 820,
                margin: "0 auto",
              }}
            >
              {[
                { tag: "Relacje", q: "Dlaczego tak trudno mi zakończyć tę relację?" },
                { tag: "Kariera", q: "Czy to dobry moment na zmianę pracy?" },
                { tag: "Rozwój", q: "Skąd biorą się moje problemy ze stawianiem granic?" },
                { tag: "Komunikacja", q: "Jak przyjmować krytykę, nie zamykając się w sobie?" },
              ].map(({ tag, q }) => (
                <div
                  key={q}
                  style={{
                    position: "relative",
                    ...cardBase,
                    padding: "20px 22px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      padding: "4px 10px",
                      borderRadius: 999,
                      color: "#E0B566",
                      background: "rgba(224,181,102,.08)",
                      border: "1px solid rgba(224,181,102,.22)",
                      marginBottom: 12,
                    }}
                  >
                    {tag}
                  </span>
                  <p
                    style={{
                      fontFamily: "var(--font-fraunces), 'Fraunces', serif",
                      fontStyle: "italic",
                      fontSize: 17,
                      lineHeight: 1.45,
                      color: "#E9DCC0",
                      paddingRight: 24,
                    }}
                  >
                    {`„${q}"`}
                  </p>
                  <span
                    style={{
                      position: "absolute",
                      right: 18,
                      bottom: 18,
                      color: "#E0B566",
                      opacity: 0.45,
                    }}
                  >
                    {SEND_ICON}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CECHY */}
        <section style={sectionPad}>
          <div style={wrap}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {[
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 18, height: 18 }}>
                      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
                      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5z" />
                    </svg>
                  ),
                  title: "Głęboka wiedza astrologiczna",
                  desc: "Oparta na klasycznej, psychologicznej i ewolucyjnej astrologii — nie ogólniki, lecz odpowiedź, która rozumie kontekst.",
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 18, height: 18 }}>
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                    </svg>
                  ),
                  title: "Zna Twój kosmogram",
                  desc: "Każda odpowiedź wychodzi z Twojego układu planet i tego, co dzieje się na niebie teraz — nie z porady spod znaku.",
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 18, height: 18 }}>
                      <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" />
                      <path d="M8.5 11.5h7M8.5 14h4" />
                    </svg>
                  ),
                  title: "Pamięta rozmowę",
                  desc: "Pytaj jak przyjaciela. Możesz pogłębiać, doprecyzowywać i wracać do tematów — Astrea pamięta, o czym mówiliście.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ ...cardBase, padding: 24 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      background: "rgba(224,181,102,.10)",
                      border: "1px solid rgba(224,181,102,.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                      color: "#E0B566",
                    }}
                  >
                    {icon}
                  </div>
                  <h3 style={{ ...serif, fontSize: 16.5, marginBottom: 8 }}>{title}</h3>
                  <p style={{ color: "#877FA0", fontSize: 13.5, lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TABELA PORÓWNAWCZA */}
        <section style={sectionPad}>
          <div style={wrap}>
            <div style={secH}>
              <span style={eyebrow}>Dlaczego to o Tobie</span>
              <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", marginBottom: 10 }}>
                Inne chatboty mówią ogólnie.
                <br />
                Astrea mówi o Tobie.
              </h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: 820, margin: "0 auto", fontSize: 14.5 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid #2B2540", ...serif, fontWeight: 500, fontSize: 16 }}></th>
                    <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid #2B2540", ...serif, fontWeight: 500, fontSize: 16, color: "#E0B566" }}>Cosmo Chat (Astrea)</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid #2B2540", ...serif, fontWeight: 500, fontSize: 16 }}>Generyczny chatbot</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Skąd czerpie wiedzę", "Czyta z Twojego policzonego kosmogramu", "Zna najwyżej Twój znak Słońca"],
                    ["Personalizacja", "Odpowiada konkretnie o Tobie", "Podaje ogólniki pasujące do każdego"],
                    ["Pamięć", "Pamięta, o czym już rozmawialiście", "Każdą rozmowę zaczyna od zera"],
                    ["Język", "Mówi naturalnym polskim, jak bliska osoba", "Sypie sztywnymi, ogólnymi formułkami"],
                  ].map(([label, ours, theirs], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #2B2540" }}>
                      <td style={{ padding: "14px 16px", color: "#877FA0", fontWeight: 500 }}>{label}</td>
                      <td style={{ padding: "14px 16px", color: "#F4F1EA" }}>{ours}</td>
                      <td style={{ padding: "14px 16px", color: "#877FA0" }}>{theirs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* PRZYKŁAD ROZMOWY */}
        <section style={sectionPad}>
          <div style={wrap}>
            <div style={secH}>
              <span style={eyebrow}>Tak to brzmi</span>
              <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", marginBottom: 10 }}>
                Przykład rozmowy
              </h2>
              <p style={{ color: "#B6AFC6", fontSize: 15.5 }}>
                Astrea nie sypie horoskopami — odpowiada na Twoje pytanie i oddaje Ci je w lepszej formie.
              </p>
            </div>
            <div
              style={{
                maxWidth: 680,
                margin: "0 auto",
                ...cardBase,
                padding: 26,
              }}
            >
              <div
                style={{
                  maxWidth: "86%",
                  marginLeft: "auto",
                  padding: "14px 17px",
                  borderRadius: 16,
                  borderBottomRightRadius: 5,
                  background: "rgba(224,181,102,.10)",
                  border: "1px solid rgba(224,181,102,.22)",
                  color: "#E9DCC0",
                  fontSize: 14.5,
                  lineHeight: 1.65,
                  marginBottom: 14,
                  fontFamily: "var(--font-fraunces), 'Fraunces', serif",
                  fontStyle: "italic",
                }}
              >
                <span style={{ display: "block", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 7, color: "#E0B566", fontStyle: "normal", fontFamily: "'General Sans', system-ui, sans-serif" }}>Ty</span>
                Czy to dobry moment na zmianę pracy?
              </div>
              <div
                style={{
                  maxWidth: "86%",
                  padding: "14px 17px",
                  borderRadius: 16,
                  borderBottomLeftRadius: 5,
                  background: "rgba(182,175,198,.04)",
                  border: "1px solid #2B2540",
                  color: "#B6AFC6",
                  fontSize: 14.5,
                  lineHeight: 1.65,
                  marginBottom: 14,
                }}
              >
                <span style={{ display: "block", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 7, color: "#E0B566" }}>Astrea</span>
                To pytanie wraca do Ciebie nie bez powodu. W Twoim kosmogramie potrzeba, żeby praca naprawdę coś znaczyła, jest wyjątkowo silna — a teraz na niebie dzieje się coś, co tę potrzebę rozgrzewa. Zanim zmienisz pracę, sprawdź jedno: czy chodzi o samą zmianę, czy o to, że obecna rola przestała dawać Ci poczucie sensu? Co ostatnio uwierało Cię w niej najbardziej?
              </div>
              <p style={{ textAlign: "center", fontSize: 11.5, color: "#877FA0", marginTop: 8 }}>
                Ilustracja. W realnej rozmowie Astrea opiera się na Twoim kosmogramie i tym, o czym wcześniej mówiliście.
              </p>
            </div>
          </div>
        </section>

        {/* JAK TO DZIAŁA */}
        <section style={sectionPad}>
          <div style={wrap}>
            <div style={secH}>
              <span style={eyebrow}>Jak to działa</span>
              <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", marginBottom: 10 }}>
                Trzy kroki do rozmowy
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {[
                { n: "1", title: "Wygeneruj kosmogram", desc: "Za darmo, z daty i miejsca urodzenia. To on daje Astrei kontekst o Tobie." },
                { n: "2", title: "Zacznij rozmowę", desc: "Zapytaj o cokolwiek — relację, decyzję, trudny moment. Własnymi słowami." },
                { n: "3", title: "Pogłębiaj i wracaj", desc: "Astrea pamięta wątki, więc rozmowa rośnie z czasem — jak z kimś, kto Cię zna." },
              ].map(({ n, title, desc }) => (
                <div key={n} style={{ ...cardBase, padding: 22 }}>
                  <div
                    style={{
                      ...serif,
                      fontSize: 13,
                      color: "#E0B566",
                      border: "1px solid #2B2540",
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 13,
                    }}
                  >
                    {n}
                  </div>
                  <h3 style={{ ...serif, fontSize: 17, marginBottom: 7 }}>{title}</h3>
                  <p style={{ color: "#B6AFC6", fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* POWIĄZANE */}
        <section style={sectionPad}>
          <div style={wrap}>
            <div style={secH}>
              <span style={eyebrow}>Cały ekosystem</span>
              <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", marginBottom: 10 }}>
                Z czym łączy się Cosmo Chat
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
                maxWidth: 860,
                margin: "0 auto",
              }}
            >
              {[
                {
                  href: "/cosmogram",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: 16, height: 16 }}>
                      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
                      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                    </svg>
                  ),
                  title: "Kosmogram",
                  desc: "Najpierw poznaj swój — to z niego Astrea czyta odpowiedzi.",
                },
                {
                  href: "/match",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: 16, height: 16 }}>
                      <circle cx="8" cy="8" r="4.5" /><circle cx="16" cy="16" r="4.5" />
                      <path d="M11 11l2 2" />
                    </svg>
                  ),
                  title: "Cosmo Match",
                  desc: "Dopytaj Astreę o Waszą relację po porównaniu kosmogramów.",
                },
                {
                  href: "/calendar",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ width: 16, height: 16 }}>
                      <rect x="3" y="5" width="18" height="16" rx="2.5" />
                      <path d="M3 9h18M8 3v4M16 3v4" />
                    </svg>
                  ),
                  title: "Kalendarz",
                  desc: "Zapytaj, co dziś na niebie i jak to wykorzystać.",
                },
              ].map(({ href, icon, title, desc }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex",
                    gap: 13,
                    alignItems: "flex-start",
                    ...cardBase,
                    padding: 18,
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "rgba(224,181,102,.10)",
                      border: "1px solid rgba(224,181,102,.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#E0B566",
                    }}
                  >
                    {icon}
                  </div>
                  <div>
                    <h3 style={{ ...serif, fontSize: 15, marginBottom: 3 }}>{title}</h3>
                    <p style={{ fontSize: 12.5, color: "#877FA0", lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={sectionPad}>
          <div style={wrap}>
            <div style={secH}>
              <span style={eyebrow}>FAQ</span>
              <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", marginBottom: 10 }}>
                Najczęstsze pytania o astrologa AI
              </h2>
            </div>
            <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                {
                  q: "Czym jest Cosmo Chat?",
                  a: "To astrolog AI po polsku — rozmowa z Astreą, która czyta odpowiedzi z Twojego policzonego kosmogramu (nie ze znaku) i pamięta wcześniejsze wątki.",
                },
                {
                  q: "Czym różni się od ChatGPT albo zwykłego chatbota astrologicznego?",
                  a: "Zwykłe chatboty znają najwyżej Twój znak i zaczynają każdą rozmowę od zera. Astrea ma za kontekst Twój pełny kosmogram i pamięta, o czym rozmawialiście — dlatego odpowiada o Tobie, nie ogólnikami.",
                },
                {
                  q: "Skąd Astrea zna mój kosmogram?",
                  a: "Po wygenerowaniu kosmogramu (za darmo) Twój układ planet staje się kontekstem rozmowy. Dlatego najpierw kosmogram, potem czat.",
                },
                {
                  q: "Czy pamięta wcześniejsze rozmowy?",
                  a: "Tak. Możesz wracać do wątków i pogłębiać tematy — rozmowa rośnie z czasem, jak z kimś, kto Cię zna.",
                },
                {
                  q: "Czy AI zastępuje astrologa?",
                  a: "Nie. Astrea to narzędzie do autorefleksji i nauki o sobie, nie zamiennik człowieka. Przy tematach zdrowia czy poważnych decyzji życiowych kieruje do odpowiedniego specjalisty.",
                },
                {
                  q: "Czy to wróżenie?",
                  a: "Nie. Traktujemy astrologię jak symboliczne lustro do lepszego rozumienia siebie, a nie wyrocznię. Treści mają charakter refleksyjny i rozrywkowy.",
                },
              ].map(({ q, a }, i) => (
                <details
                  key={i}
                  style={{ ...cardBase, padding: "4px 18px" }}
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

        {/* CTA */}
        <section style={{ ...sectionPad, paddingBottom: 80 }}>
          <div style={wrap}>
            <div
              style={{
                textAlign: "center",
                maxWidth: 680,
                margin: "0 auto",
                background: "radial-gradient(120% 120% at 50% 0%, rgba(224,181,102,.08), #14101F)",
                border: "1px solid rgba(224,181,102,.22)",
                borderRadius: 22,
                padding: "44px 28px",
              }}
            >
              <h2 style={{ ...serif, fontSize: "clamp(28px, 3.6vw, 38px)", marginBottom: 12 }}>
                Zadaj pierwsze pytanie
              </h2>
              <p style={{ color: "#B6AFC6", marginBottom: 24 }}>
                Utwórz konto, wygeneruj kosmogram i zacznij rozmawiać z Astreą — Twoim osobistym astrologiem AI.
              </p>
              <Link
                href="/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 30px",
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#241704",
                  background: "linear-gradient(135deg,#FFC56B 0%,#E0992E 100%)",
                  boxShadow: "0 8px 26px rgba(255,174,61,.22)",
                  textDecoration: "none",
                }}
              >
                Utwórz konto za darmo
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <p style={{ marginTop: 16, fontSize: 12.5, color: "#877FA0" }}>
                Bez karty · pierwszy kosmogram i podstawowa interpretacja za darmo · Twoich danych nie sprzedajemy
              </p>
            </div>
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_APP) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_FAQ) }}
      />
    </div>
  );
}
