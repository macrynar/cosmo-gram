import {
  Html, Head, Preview, Body, Container, Section, Heading, Text, Hr, Button, Img,
} from "@react-email/components";
import * as React from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.cosmo-gram.com";

// ─── Shared premium dark/gold layout (matches DailyHoroscopeEmail) ─────────────

const S = {
  body:    { background: "#050508", fontFamily: "Georgia, 'Times New Roman', serif", margin: 0, padding: 0 } as const,
  container: { maxWidth: 560, margin: "0 auto", padding: "40px 24px" } as const,
  brand:   { color: "rgba(212,175,55,0.6)", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 } as const,
  date:    { color: "rgba(100,116,139,0.7)", fontSize: 11, letterSpacing: "0.15em", margin: "8px 0 0" } as const,
  hrGold:  { borderColor: "rgba(212,175,55,0.22)", margin: "24px 0 28px" } as const,
  heading: { color: "#F3E5AB", fontSize: 26, fontWeight: 400, lineHeight: 1.35, margin: "0 0 6px", textAlign: "center" } as const,
  intro:   { color: "rgba(148,163,184,0.80)", fontSize: 14, lineHeight: 1.7, margin: "0 0 24px", textAlign: "center" } as const,
  card:    { background: "rgba(212,175,55,0.05)", border: "0.5px solid rgba(212,175,55,0.18)", borderRadius: 14, padding: "22px 24px" } as const,
  para:    { color: "rgba(226,232,240,0.88)", fontSize: 15, lineHeight: 1.75, margin: "0 0 14px" } as const,
  button:  { background: "linear-gradient(135deg, #D4AF37, #C5A059)", color: "#050508", padding: "14px 32px", borderRadius: 24, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textDecoration: "none", display: "inline-block" } as const,
  hrFaint: { borderColor: "rgba(212,175,55,0.10)", margin: "32px 0 20px" } as const,
  footer:  { color: "rgba(100,116,139,0.7)", fontSize: 11, lineHeight: 1.6, margin: "0 0 8px", textAlign: "center" } as const,
  footerSm:{ color: "rgba(100,116,139,0.45)", fontSize: 10, margin: 0, textAlign: "center" } as const,
  linkGold:{ color: "rgba(212,175,55,0.55)", textDecoration: "none" } as const,
  linkUnsub:{ color: "rgba(100,116,139,0.65)", textDecoration: "underline" } as const,
};

function HoroscopeLayout({
  dateLabel, heading, intro, content, ctaHref, ctaLabel, userId, unsubLabel,
}: {
  dateLabel: string; heading: string; intro: string; content: string;
  ctaHref: string; ctaLabel: string; userId: string; unsubLabel: string;
}) {
  const paragraphs = content.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  return (
    <Html lang="pl">
      <Head />
      <Preview>{heading} · Cosmogram</Preview>
      <Body style={S.body}>
        <Container style={S.container}>
          <Section style={{ textAlign: "center" }}>
            <Img
              src={`${APP_URL}/email/logo-cosmogram.png`}
              alt="Cosmogram"
              width={170}
              height={31}
              style={{ margin: "0 auto" }}
            />
            <Text style={S.date}>{dateLabel}</Text>
          </Section>

          <Hr style={S.hrGold} />

          <Heading style={S.heading}>{heading}</Heading>
          <Text style={S.intro}>{intro}</Text>

          <Section style={S.card}>
            {paragraphs.map((p, i) => (
              <Text key={i} style={{ ...S.para, margin: i === paragraphs.length - 1 ? 0 : S.para.margin }}>
                {p}
              </Text>
            ))}
          </Section>

          <Section style={{ textAlign: "center", margin: "28px 0 0" }}>
            <Button href={ctaHref} style={S.button}>{ctaLabel}</Button>
          </Section>

          <Hr style={S.hrFaint} />

          <Section>
            <Text style={S.footer}>
              Wysłano z <a href="https://www.cosmo-gram.com" style={S.linkGold}>cosmo-gram.com</a>
            </Text>
            <Text style={S.footerSm}>
              {unsubLabel}{" "}
              <a href={`${APP_URL}/api/email/unsubscribe?id=${userId}`} style={S.linkUnsub}>Wypisz się</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Weekly ────────────────────────────────────────────────────────────────────

export interface WeeklyHoroscopeEmailProps {
  userName: string;
  weekStart: string;
  weekEnd: string;
  horoscopeContent: string;
  userId: string;
}

export function WeeklyHoroscopeEmail({ userName, weekStart, weekEnd, horoscopeContent, userId }: WeeklyHoroscopeEmailProps) {
  return (
    <HoroscopeLayout
      dateLabel={`${weekStart} – ${weekEnd}`}
      heading="Twoja prognoza na nadchodzący tydzień"
      intro={`Cześć ${userName} — oto co gwiazdy szykują na nadchodzący tydzień.`}
      content={horoscopeContent}
      ctaHref={`${APP_URL}/app/calendar?h=week`}
      ctaLabel="Zobacz cały tydzień →"
      userId={userId}
      unsubLabel="Nie chcesz tygodniowych horoskopów?"
    />
  );
}

// ─── Monthly ───────────────────────────────────────────────────────────────────

export interface MonthlyForecastEmailProps {
  userName: string;
  month: string;
  year: number;
  forecastContent: string;
  userId: string;
}

export function MonthlyForecastEmail({ userName, month, year, forecastContent, userId }: MonthlyForecastEmailProps) {
  return (
    <HoroscopeLayout
      dateLabel={`${month} ${year}`}
      heading="Twoja prognoza na nadchodzący miesiąc"
      intro={`Cześć ${userName} — oto co gwiazdy szykują na ${month.toLowerCase()}.`}
      content={forecastContent}
      ctaHref={`${APP_URL}/app/calendar?h=month`}
      ctaLabel="Zobacz pełną prognozę →"
      userId={userId}
      unsubLabel="Nie chcesz miesięcznych prognoz?"
    />
  );
}
