import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kalendarz astrologiczny — Twoje Dni Mocy · Cosmogram",
  description:
    "Dni Mocy liczone z Twojego kosmogramu — najlepsze dni na decyzje, rozmowy i działanie. Kalendarz astrologiczny po polsku: dziś, tydzień, miesiąc i rok.",
  alternates: { canonical: "https://www.cosmo-gram.com/calendar" },
  openGraph: {
    title: "Kalendarz astrologiczny — Twoje Dni Mocy · Cosmogram",
    description:
      "Dni Mocy liczone z Twojego kosmogramu — najlepsze dni na decyzje, rozmowy i działanie.",
    url: "https://www.cosmo-gram.com/calendar",
  },
};

const HERO_IMG =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3EFduSqbvnymFyBD7x7Gq2XzuOp/hf_20260617_141347_9d715f0e-595a-49db-851f-e2689ab4fcc2.png";

const FAQ_ITEMS = [
  {
    q: "Czym są Dni Mocy?",
    a: "To dni, w których ruch planet układa się najlepiej względem Twojego kosmogramu. Łatwiej wtedy działać, rozmawiać i decydować. Każdy ma je w innym czasie, bo liczą się z osobistego układu, nie ze znaku.",
  },
  {
    q: "Czy Dni Mocy są moje, czy takie same dla wszystkich?",
    a: 'Twoje. Liczymy je z Twojego kosmogramu, więc u każdej osoby wypadają inaczej — inaczej niż „dobre dni" z gazety, które są wspólne dla całego znaku.',
  },
  {
    q: "Co to jest tranzyt?",
    a: 'To po prostu ruch planety, która w danym dniu „przechodzi" obok jakiegoś punktu w Twoim kosmogramie i go aktywuje. My liczymy te przejścia za Ciebie i tłumaczymy po ludzku, co znaczą.',
  },
  {
    q: "Czy potrzebuję kosmogramu i godziny urodzenia?",
    a: "Kosmogram — tak, bo to on daje kalendarzowi kontekst. Godzina zwiększa dokładność, ale nie jest konieczna; bez niej dostajesz wynik przybliżony.",
  },
  {
    q: "Jak często warto zaglądać?",
    a: 'Rano na „pogodę dnia", a raz w tygodniu rzut oka na nadchodzące Dni Mocy, żeby zaplanować ważne sprawy z wyprzedzeniem.',
  },
  {
    q: "Czy to wróżenie?",
    a: "Nie. Traktujemy astrologię jak symboliczne lustro i narzędzie do lepszego planowania, a nie wyrocznię. Treści mają charakter refleksyjny i rozrywkowy.",
  },
];

const JSON_WEBPAGE = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Kalendarz astrologiczny — Twoje Dni Mocy",
  description: "Dni Mocy liczone z Twojego kosmogramu. Najlepsze dni na decyzje, rozmowy i działanie — po polsku.",
  url: "https://www.cosmo-gram.com/calendar",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Cosmogram", item: "https://www.cosmo-gram.com" },
      { "@type": "ListItem", position: 2, name: "Kalendarz astrologiczny", item: "https://www.cosmo-gram.com/calendar" },
    ],
  },
};

const JSON_APP = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Kalendarz astrologiczny Cosmogram",
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
  name: "Jak działa kalendarz astrologiczny Cosmogram",
  step: [
    { "@type": "HowToStep", name: "Łączymy niebo z Twoim kosmogramem", text: "Codziennie sprawdzamy, gdzie są planety i jak układają się względem Twojego układu z dnia narodzin." },
    { "@type": "HowToStep", name: "Wybieramy Twoje Dni Mocy", text: "Spośród wszystkich dni miesiąca wskazujemy te, w których to ułożenie najbardziej Ci sprzyja." },
    { "@type": "HowToStep", name: "Mówimy, na co je wykorzystać", text: "Dostajesz konkret: kiedy rozmawiać, kiedy decydować, a kiedy odpuścić i nabrać sił." },
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

/* ─── SVG icons ─── */
function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" />
    </svg>
  );
}
function IconPlanet() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="2.2" />
      <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)" />
    </svg>
  );
}
function IconCal() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 3v4M16 3v4M8 13h2M14 13h2M8 17h2M14 17h2" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" />
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
function IconChat() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}
function IconSunSm() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5.2 5.2 7 7M17 17l1.8 1.8" />
    </svg>
  );
}

export default function CalendarPage() {
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
      <header style={{ position: "relative", textAlign: "center", padding: "90px 22px 70px", overflow: "hidden" }}>
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
            background: "radial-gradient(68% 70% at 50% 38%, rgba(11,9,18,.32) 0%, rgba(11,9,18,.86) 70%, var(--bg-base) 100%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto" }}>
          <h1 style={{ ...serif, fontSize: "clamp(34px, 5.4vw, 54px)", marginBottom: 18 }}>
            Twoja osobista
            <br />
            <span style={{ background: "var(--grad-ember)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              prognoza astrologiczna
            </span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 17, lineHeight: 1.65, maxWidth: 620, margin: "0 auto 30px" }}>
            Kalendarz pokazuje, kiedy niebo Ci sprzyja, a kiedy lepiej odpuścić. Nakłada ruch planet na Twój kosmogram i wskazuje{" "}
            <strong style={{ color: "var(--voice)", fontWeight: 500 }}>Twoje Dni Mocy</strong>
            {" "}— najlepsze momenty na decyzje, rozmowy i działanie. To nie wróżby dla znaku — to liczone dla Ciebie.
          </p>
          <Link href="/signup" style={btnPrimary}>
            <IconBolt />
            Zobacz swoje Dni Mocy →
          </Link>
          <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--text-muted)" }}>
            Najpierw wygeneruj kosmogram — za darmo — kalendarz liczy się z Twojego układu.
          </p>
        </div>
      </header>

      {/* ─── DEFINICJA (GEO) ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={{ ...cardBase, borderLeft: "3px solid var(--accent-deep)", padding: "26px 28px", maxWidth: 800, margin: "0 auto" }}>
            <span style={eyebrow}>Czym są Dni Mocy?</span>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--text-primary)" }}>
              <strong style={{ color: "var(--accent-deep)", fontWeight: 600 }}>Dni Mocy</strong>
              {" "}to dni, w których ruch planet układa się najlepiej względem Twojego kosmogramu — Twoje osobiste „zielone światło". Łatwiej wtedy działać, rozmawiać i podejmować decyzje. U każdego wypadają w innym czasie, bo liczą się z{" "}
              <strong style={{ color: "var(--accent-deep)", fontWeight: 600 }}>Twojego układu, nie ze znaku</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CO DOSTAJESZ ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Co dostajesz</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Kalendarz, który zna Twój układ
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, maxWidth: 860, margin: "0 auto" }}>
            {[
              { icon: <IconBolt />, title: "Twoje Dni Mocy", desc: "Pięć najlepszych dni w miesiącu, wyliczonych z Twojego kosmogramu — nie z gazetowego horoskopu." },
              { icon: <IconTarget />, title: 'Okna „Kiedy najlepiej…?"', desc: "Osobno zaznaczamy dni dobre na karierę, miłość, pieniądze, ważną rozmowę i odpoczynek." },
              { icon: <IconPlanet />, title: "Ruch planet, po ludzku", desc: "Mówimy, co dzieje się na niebie i jak to dotyka właśnie Twoich obszarów życia — bez tabelek i żargonu." },
              { icon: <IconCal />, title: "Dziś, tydzień, miesiąc, rok", desc: "Jeden kalendarz w czterech powiększeniach — sprawdzasz dzień albo planujesz miesiąc z wyprzedzeniem." },
            ].map((item) => (
              <div key={item.title} style={{ display: "flex", gap: 14, ...cardBase, padding: "20px 22px" }}>
                <span
                  style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: "rgba(224,181,102,.10)", border: "1px solid rgba(224,181,102,.22)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--accent-deep)",
                  }}
                >
                  {item.icon}
                </span>
                <div>
                  <h3 style={{ ...serif, fontSize: 16, marginBottom: 5 }}>{item.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: 13.5, lineHeight: 1.55 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DOWÓD: przykładowy Dzień Mocy ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Tak to wygląda</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Przykładowy Dzień Mocy
            </h2>
          </div>
          <div
            style={{
              maxWidth: 560, margin: "0 auto",
              background: "radial-gradient(130% 130% at 0% 0%, rgba(224,181,102,.08), var(--bg-elevated))",
              border: "1px solid rgba(224,181,102,.26)",
              borderRadius: 20, padding: 26,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ ...serif, fontSize: 22, color: "var(--text-primary)" }}>wt · 14 maja</span>
              <span
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
                  padding: "4px 11px", borderRadius: 999, color: "#241704",
                  background: "var(--grad-ember)",
                }}
              >
                Dzień Mocy
              </span>
              <span style={{ marginLeft: "auto", color: "var(--accent)" }}>
                <IconSun />
              </span>
            </div>
            <div style={{ fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent-deep)", marginBottom: 8 }}>
              Dobry na ważną rozmowę
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--text-secondary)" }}>
              Łatwiej dziś o szczerość bez spięcia. Jeśli masz coś do wyjaśnienia albo o coś poprosić — to dobry moment.
              Słowa trafią celniej niż zwykle, a druga strona chętniej posłucha.
            </p>
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                marginTop: 16, fontSize: 12, color: "var(--text-muted)",
                border: "1px solid var(--line)", borderRadius: 999, padding: "5px 12px",
              }}
            >
              na podstawie ·{" "}
              <strong style={{ color: "var(--accent-deep)", fontWeight: 600 }}>
                Merkury wspiera Twój Księżyc
              </strong>
            </span>
          </div>
          <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-muted)", marginTop: 12 }}>
            Ilustracja. Twoje Dni Mocy i ich tematy liczą się z Twojego własnego kosmogramu.
          </p>
        </div>
      </section>

      {/* ─── JAK TO DZIAŁA ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Jak to działa</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Trzy kroki do Twoich Dni Mocy
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { n: "1", title: "Łączymy niebo z Twoim kosmogramem", desc: "Codziennie sprawdzamy, gdzie są planety i jak układają się względem Twojego układu z dnia narodzin." },
              { n: "2", title: "Wybieramy Twoje Dni Mocy", desc: "Spośród wszystkich dni miesiąca wskazujemy te, w których to ułożenie najbardziej Ci sprzyja." },
              { n: "3", title: "Mówimy, na co je wykorzystać", desc: "Dostajesz konkret: kiedy rozmawiać, kiedy decydować, a kiedy odpuścić i nabrać sił." },
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
                <h3 style={{ ...serif, fontSize: 16.5, marginBottom: 7 }}>{step.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TABELA PORÓWNAWCZA ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Dlaczego to dla Ciebie</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Twoje Dni Mocy a „dobre dni" z gazety
            </h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: 820, margin: "0 auto", fontSize: 14.5 }}>
              <thead>
                <tr>
                  <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid var(--line)", ...serif, fontSize: 16 }} />
                  <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid var(--line)", ...serif, fontSize: 16, color: "var(--accent-deep)" }}>
                    Twój kalendarz w Cosmogram
                  </th>
                  <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid var(--line)", ...serif, fontSize: 16 }}>
                    „Dobre dni" dla znaku
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Dla kogo", "Liczony z Twojego kosmogramu", "Wspólny dla całego znaku"],
                  ["Personalizacja", "U każdego wypada inaczej", "Ten sam dla milionów osób"],
                  ["Co mówi", "Na co konkretnie wykorzystać dzień", 'Ogólne „sprzyja / nie sprzyja"'],
                  ["Zasięg", "Dziś, tydzień, miesiąc i rok", "Zwykle jeden dzień"],
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

      {/* ─── CYTAT (PL) ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
            <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(21px, 2.8vw, 28px)", lineHeight: 1.5, color: "var(--voice)", marginBottom: 14 }}>
              „Nie chodzi o to, żeby działać więcej — tylko w lepszym momencie."
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: 14.5 }}>
              Wyczucie czasu zawsze było przewagą. Kalendarz daje Ci je czarno na białym.
            </p>
          </div>
        </div>
      </section>

      {/* ─── POWIĄZANE ─── */}
      <section style={sectionPad}>
        <div style={wrap}>
          <div style={secH}>
            <span style={eyebrow}>Cały ekosystem</span>
            <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 34px)", margin: "8px 0 10px" }}>
              Z czym łączy się kalendarz
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, maxWidth: 860, margin: "0 auto" }}>
            {[
              { icon: <IconWheel />, title: "Kosmogram", desc: "Najpierw poznaj swój — to z niego liczą się Dni Mocy.", href: "/cosmogram" },
              { icon: <IconChat />, title: "Cosmo Chat", desc: "Dopytaj Astreę, jak najlepiej wykorzystać dany dzień.", href: "/app/chat" },
              { icon: <IconSunSm />, title: "Horoskop dzienny", desc: 'Krótka „pogoda" na dziś — w 60 sekund przy kawie.', href: "/daily" },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                style={{ display: "flex", gap: 13, alignItems: "flex-start", background: "var(--bg-elevated)", border: "1px solid var(--line)", borderRadius: 14, padding: 18, textDecoration: "none" }}
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
              Najczęstsze pytania o Dni Mocy
            </h2>
          </div>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} style={{ ...cardBase, borderRadius: 13, padding: "4px 18px" }}>
                <summary
                  style={{
                    cursor: "pointer", padding: "15px 0", fontWeight: 600, fontSize: 15,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    gap: 12, listStyle: "none", color: "var(--text-primary)",
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
              border: "1px solid rgba(224,181,102,.22)", borderRadius: 22, padding: "44px 28px",
            }}
          >
            <h2 style={{ ...serif, fontSize: "clamp(28px, 3.6vw, 38px)", marginBottom: 12 }}>
              Zacznij planować z głową
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              Wygeneruj kosmogram i odblokuj swój kalendarz — Twoje Dni Mocy już na Ciebie czekają.
            </p>
            <Link href="/signup" style={btnPrimary}>
              Utwórz konto za darmo →
            </Link>
            <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--text-muted)" }}>
              Bez karty · pierwszy kosmogram za darmo · Twoich danych nie sprzedajemy
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
