import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cosmo Match — synastria i kompatybilność kosmogramów · Cosmogram",
  description:
    "Synastria online: porównaj dwa kosmogramy i zobacz, jak naprawdę działacie razem — synergie, napięcia, komunikacja i styl miłości. Interpretacja AI po polsku.",
  alternates: { canonical: "https://www.cosmo-gram.com/match" },
  openGraph: {
    title: "Cosmo Match — synastria i kompatybilność kosmogramów · Cosmogram",
    description:
      "Synastria online: porównaj dwa kosmogramy i zobacz, jak naprawdę działacie razem — synergie, napięcia, komunikacja i styl miłości.",
    url: "https://www.cosmo-gram.com/match",
  },
};

const HERO_IMG =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3EFduSqbvnymFyBD7x7Gq2XzuOp/hf_20260617_131542_b3855484-9960-4a3d-9676-1fbba64dac7c.png";

const FAQ_ITEMS = [
  {
    q: "Czym jest synastria?",
    a: "Synastria to porównanie dwóch kosmogramów urodzeniowych w celu zrozumienia dynamiki relacji. Analizuje aspekty — kąty między planetami obu osób — które pokazują mocne strony i wyzwania związku.",
  },
  {
    q: "Czym różni się od dopasowania znaków zodiaku?",
    a: "Dopasowanie znaków patrzy tylko na Słońce obu osób (jedna z 78 kombinacji). Synastria porównuje całe kosmogramy — wszystkie planety i aspekty między nimi — więc jest osobista i znacznie dokładniejsza.",
  },
  {
    q: "Czy potrzebuję godziny urodzenia obu osób?",
    a: "Nie jest konieczna — wystarczą daty i miejsca. Godzina zwiększa dokładność (dodaje Księżyc, Ascendent i domy, ważne w relacji); bez niej policzymy analizę przybliżoną, opartą na planetach niezależnych od godziny.",
  },
  {
    q: "Czy działa dla przyjaźni i relacji zawodowych?",
    a: "Tak. Synastria opisuje każdą relację dwóch osób — romantyczną, przyjacielską, rodzinną i zawodową. Akcent interpretacji dobieramy do typu relacji.",
  },
  {
    q: "Które planety są najważniejsze w relacji?",
    a: "W romansie przede wszystkim Wenus i Mars (miłość i pożądanie) oraz Słońce i Księżyc (tożsamość i emocje). W relacjach zawodowych większą wagę mają Merkury i Saturn.",
  },
  {
    q: "Czy to wróżenie?",
    a: "Nie. Traktujemy astrologię jak symboliczne lustro do lepszego rozumienia się nawzajem, a nie wyrocznię. Treści mają charakter refleksyjny i rozrywkowy.",
  },
];

const JSON_WEBPAGE = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Cosmo Match — synastria i kompatybilność kosmogramów",
  description: "Sprawdź kompatybilność dwóch kosmogramów — synastria online z interpretacją AI po polsku.",
  url: "https://www.cosmo-gram.com/match",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Cosmogram", item: "https://www.cosmo-gram.com" },
      { "@type": "ListItem", position: 2, name: "Cosmo Match", item: "https://www.cosmo-gram.com/match" },
    ],
  },
};

const JSON_APP = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cosmo Match",
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
  name: "Jak sprawdzić kompatybilność w synastrii",
  step: [
    { "@type": "HowToStep", name: "Podajesz dwie daty", text: "Data i miejsce urodzenia obu osób; godzina opcjonalnie, uściśla wynik." },
    { "@type": "HowToStep", name: "Nakładamy Wasze kosmogramy", text: "Położenie planet obu osób i kąty (aspekty) między nimi." },
    { "@type": "HowToStep", name: "Czytasz mapę relacji", text: "Po polsku: synergie, napięcia i wskazówki." },
  ],
};

/* ─── style helpers ─── */
const wrap: React.CSSProperties = { maxWidth: 1000, margin: "0 auto", padding: "0 22px" };
const secH: React.CSSProperties = { textAlign: "center", maxWidth: 640, margin: "0 auto 34px" };
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

/* ─── inline SVG icons ─── */
function IconCircles() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="8" r="4.5" /><circle cx="16" cy="16" r="4.5" /><path d="M11 11l2 2" />
    </svg>
  );
}
function IconHeart() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 20.3l-1.3-1.2C6 14.8 3.5 12.5 3.5 9.4 3.5 7 5.4 5.2 7.7 5.2c1.3 0 2.6.6 3.4 1.6.8-1 2.1-1.6 3.4-1.6 2.3 0 4.2 1.8 4.2 4.2 0 3.1-2.5 5.4-7.2 9.7L12 20.3z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="8" r="3" /><path d="M3.5 20c0-3.3 2.4-5 5.5-5s5.5 1.7 5.5 5" />
      <circle cx="17.5" cy="9.5" r="2.2" /><path d="M16.5 14.2c2.7 0 4 1.4 4 3.8" />
    </svg>
  );
}
function IconBriefcase() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M9 12a3 3 0 0 1 3-3h2.5a3.5 3.5 0 0 1 0 7H13M15 12a3 3 0 0 1-3 3H9.5a3.5 3.5 0 0 1 0-7H11" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3l1.8 4.9L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12z" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" />
    </svg>
  );
}
function IconWheel() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </svg>
  );
}
function IconCal() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}

export default function MatchPublicPage() {
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
          position: "relative", textAlign: "center",
          padding: "90px 22px 70px", overflow: "hidden",
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
          <h1 style={{ ...serif, fontSize: "clamp(34px, 5.4vw, 54px)", marginBottom: 18 }}>
            Jak naprawdę
            <br />
            <span
              style={{
                background: "var(--grad-ember)",
                WebkitBackgroundClip: "text", backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              działacie razem
            </span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 17, lineHeight: 1.65, maxWidth: 610, margin: "0 auto 30px" }}>
            Cosmo Match to{" "}
            <strong style={{ color: "var(--voice)", fontWeight: 500 }}>synastria</strong>
            {" "}— porównanie dwóch całych kosmogramów, nie samych znaków. Pokazujemy synergie,
            napięcia, styl komunikacji i miłości: Twoje planety z planetami drugiej osoby.
            Więcej niż „Waga i Byk pasują".
          </p>
          <Link href="/signup" style={btnPrimary}>
            <IconCircles />
            Sprawdź kompatybilność →
          </Link>
          <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--text-muted)" }}>
            Wystarczą daty i miejsca urodzenia obu osób — godziny dodaj, jeśli je znasz
          </p>
        </div>
      </header>

      {/* ─── DEFINICJA (GEO) ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div
            style={{
              ...cardBase,
              borderLeft: "3px solid var(--accent-deep)",
              padding: "26px 28px", maxWidth: 800, margin: "0 auto",
            }}
          >
            <span style={eyebrow}>Czym jest synastria?</span>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--text-primary)" }}>
              <strong style={{ color: "var(--accent-deep)", fontWeight: 600 }}>Synastria</strong>
              {" "}to astrologiczne porównanie dwóch kosmogramów, które pokazuje, jak układają się
              energie między dwojgiem ludzi. Zamiast pytać „czy te znaki pasują", patrzy na{" "}
              <strong style={{ color: "var(--accent-deep)", fontWeight: 600 }}>aspekty</strong>
              {" "}— kąty między planetami obu osób — i z nich czyta mocne strony oraz wyzwania relacji.
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
              Trzy kroki do mapy Waszej relacji
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { n: "1", title: "Podajesz dwie daty", desc: "Data i miejsce urodzenia obu osób. Godzinę dodaj, jeśli znasz — uściśla wynik, ale nie jest konieczna." },
              { n: "2", title: "Nakładamy Wasze kosmogramy", desc: "Wyliczamy położenie planet obu osób i kąty (aspekty) między nimi — to z nich czyta się relację. Precyzja jak u zawodowego astrologa." },
              { n: "3", title: "Czytasz mapę relacji", desc: "Po polsku, bez żargonu: gdzie się wzmacniacie, gdzie iskrzy i co z tym zrobić." },
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

      {/* ─── DLA KOGO ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Dla kogo</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Nie tylko dla par
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { icon: <IconHeart />, title: "Pary romantyczne", desc: "Gdzie jest chemia, gdzie naturalne napięcia i jak je przepracować. Bez złudzeń, ale z nadzieją." },
              { icon: <IconUsers />, title: "Przyjaźnie i rodzina", desc: "Dlaczego z jedną osobą rozmawiasz godzinami, a z inną po 5 minutach nie masz już co powiedzieć." },
              { icon: <IconBriefcase />, title: "Partnerzy biznesowi", desc: "Jak uzupełniają się Wasze style działania, kto lepiej widzi detale, kto myśli strategicznie." },
            ].map((card) => (
              <div key={card.title} style={{ ...cardBase, padding: 24, textAlign: "center" }}>
                <div
                  style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: "rgba(224,181,102,.10)", border: "1px solid rgba(224,181,102,.22)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 14px", color: "var(--accent-deep)",
                  }}
                >
                  {card.icon}
                </div>
                <h3 style={{ ...serif, fontSize: 16, marginBottom: 7 }}>{card.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13.5, lineHeight: 1.55 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CO DOSTAJESZ ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Co dostajesz w analizie</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Pełna mapa relacji, nie jedna liczba
            </h2>
          </div>
          <div
            style={{
              ...cardBase, borderRadius: 20,
              padding: "30px 32px", maxWidth: 860, margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px 26px",
              }}
            >
              {[
                { icon: <IconLink />, title: "Wynik kompatybilności", desc: "Procentowy wynik z wyjaśnieniem — co go buduje, co obniża.", tense: false },
                { icon: <IconStar />, title: "Synergie", desc: "Miejsca, gdzie Wasze planety wzmacniają się nawzajem.", tense: false },
                { icon: <IconBolt />, title: "Napięcia", desc: "Obszary tarcia — i jak je świadomie przepracować.", tense: true },
                { icon: <IconChat />, title: "Komunikacja", desc: "Jak rozmawiać, żeby się naprawdę rozumieć — nie tylko słyszeć.", tense: false },
                { icon: <IconHeart />, title: "Styl miłości", desc: "Jak każde z Was kocha — daje i przyjmuje czułość, czego potrzebuje, by czuć się kochane.", tense: false },
                { icon: <IconTarget />, title: "Wskazówki praktyczne", desc: "Konkretne rady, nie poetyckie ogólniki.", tense: false },
              ].map((item) => (
                <div key={item.title} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                  <span
                    style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: "rgba(224,181,102,.08)", border: "1px solid var(--line)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: item.tense ? "var(--tense)" : "var(--accent-deep)",
                    }}
                  >
                    {item.icon}
                  </span>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{item.title}</h3>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── DOWÓD: wizualizacja + wymiary ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Sednowy obraz</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Dwa kosmogramy, jedna mapa
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15.5 }}>
              Nakładamy Wasze koła i rysujemy aspekty między planetami — harmonijne złotem,
              napięte terakotą. To pokazuje to, czego nie da kalkulator znaków.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 26, alignItems: "center",
              maxWidth: 900, margin: "0 auto",
              background: "radial-gradient(130% 130% at 100% 0%, rgba(94,72,162,.12), var(--bg-elevated))",
              border: "1px solid var(--line)",
              borderRadius: 22, padding: 30, overflow: "hidden",
            }}
          >
            {/* Wizualizacja */}
            <div
              style={{
                borderRadius: 16, overflow: "hidden",
                border: "1px solid var(--line-soft)",
                aspectRatio: "16/11", background: "#0c0a16",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_IMG}
                alt="Wizualizacja synastrii — dwa nałożone kosmogramy"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* Wymiary */}
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div style={{ ...serif, fontSize: 34, color: "var(--voice)" }}>
                82%{" "}
                <small style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "'General Sans', system-ui, sans-serif" }}>
                  kompatybilności
                </small>
              </div>
              {[
                { label: "Komunikacja", val: 88, tense: false },
                { label: "Emocje", val: 79, tense: false },
                { label: "Namiętność", val: 84, tense: false },
                { label: "Konflikt", val: 41, tense: true },
                { label: "Długoterminowość", val: 76, tense: false },
              ].map((dim) => (
                <div key={dim.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)", marginBottom: 5 }}>
                    <span>{dim.label}</span>
                    <strong style={{ color: "var(--accent-deep)", fontVariantNumeric: "tabular-nums" }}>{dim.val}</strong>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: "rgba(182,175,198,.08)", overflow: "hidden" }}>
                    <span
                      style={{
                        display: "block", height: "100%", borderRadius: 999, width: `${dim.val}%`,
                        background: dim.tense
                          ? "linear-gradient(to right, rgba(226,101,74,.5), var(--tense))"
                          : "linear-gradient(to right, rgba(224,181,102,.6), var(--accent))",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TABELA PORÓWNAWCZA ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Dlaczego to głębsze</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Synastria a „dopasowanie znaków"
            </h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: 820, margin: "0 auto", fontSize: 14.5 }}>
              <thead>
                <tr>
                  <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid var(--line)", ...serif, fontSize: 16 }} />
                  <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid var(--line)", ...serif, fontSize: 16, color: "var(--accent-deep)" }}>
                    Synastria (Cosmo Match)
                  </th>
                  <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid var(--line)", ...serif, fontSize: 16 }}>
                    Dopasowanie znaków
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Na czym oparte", "dwa pełne kosmogramy + aspekty między planetami", "tylko znaki Słońca obu osób"],
                  ["Personalizacja", "unikalna para", "jedna z 78 kombinacji znaków"],
                  ["Co pokazuje", "komunikacja, emocje, namiętność, konflikt, trwałość", '„pasują / nie pasują"'],
                  ["Wskazówki", "jak świadomie przepracować napięcia", "brak"],
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

      {/* ─── CYTAT ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <p
            style={{
              ...serif, fontStyle: "italic",
              fontSize: "clamp(21px, 2.8vw, 27px)", lineHeight: 1.5,
              color: "var(--voice)", textAlign: "center",
              maxWidth: 680, margin: "0 auto",
            }}
          >
            „Nie chodzi o to, czy pasujecie —{" "}
            <span style={{ color: "var(--accent-deep)" }}>
              chodzi o to, jak rozumieć siebie nawzajem."
            </span>
          </p>
        </div>
      </section>

      {/* ─── POWIĄZANE ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Najpierw i potem</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Cały ekosystem Cosmogram
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14, maxWidth: 860, margin: "0 auto",
            }}
          >
            {[
              { icon: <IconWheel />, title: "Kosmogram", desc: "Najpierw poznaj swój — Match porównuje dwa kosmogramy.", href: "/cosmogram" },
              { icon: <IconCal />, title: "Kalendarz", desc: "Twoje Dni Mocy i prognoza na dziś, tydzień, miesiąc, rok.", href: "/calendar" },
              { icon: <IconChat />, title: "Cosmo Chat", desc: "Astrea — dopytaj o Waszą relację własnymi słowami.", href: "/app/chat" },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                style={{
                  display: "flex", gap: 13, alignItems: "flex-start",
                  background: "var(--bg-elevated)", border: "1px solid var(--line)",
                  borderRadius: 14, padding: 18, textDecoration: "none",
                }}
              >
                <span
                  style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: "rgba(224,181,102,.10)", border: "1px solid rgba(224,181,102,.22)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--accent-deep)",
                  }}
                >
                  {card.icon}
                </span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{card.title}</h3>
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>{card.desc}</p>
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
              Najczęstsze pytania o synastrię
            </h2>
          </div>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                style={{ ...cardBase, borderRadius: 13, padding: "4px 18px" }}
              >
                <summary
                  style={{
                    cursor: "pointer", padding: "15px 0",
                    fontWeight: 600, fontSize: 15,
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", gap: 12, listStyle: "none",
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
              Zbadaj swoją relację
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              Utwórz konto, wygeneruj kosmogram i porównaj go z kim chcesz — partnerem, przyjacielem, rodzicem.
            </p>
            <Link href="/signup" style={btnPrimary}>
              Utwórz konto za darmo →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
