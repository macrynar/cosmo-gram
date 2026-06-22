import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Tailwind,
} from "@react-email/components";
import * as React from "react";

type Props = {
  sunSign:   string;
  date:      string;
  appUrl:    string;
  unsubId:   string;
  headline?: string;  // personal horoscope headline for premium users
};

const SIGN_EMOJI: Record<string, string> = {
  "Baran": "♈", "Byk": "♉", "Bliźnięta": "♊", "Rak": "♋",
  "Lew": "♌", "Panna": "♍", "Waga": "♎", "Skorpion": "♏",
  "Strzelec": "♐", "Koziorożec": "♑", "Wodnik": "♒", "Ryby": "♓",
};

export default function DailyHoroscopeEmail({ sunSign, date, appUrl, unsubId, headline }: Props) {
  const emoji = SIGN_EMOJI[sunSign] ?? "✦";

  return (
    <Html lang="pl">
      <Head />
      <Preview>{emoji} Twój horoskop na {date} — {sunSign} | Cosmogram</Preview>
      <Tailwind>
        <Body style={{ background: "#050508", fontFamily: "Georgia, serif", margin: 0, padding: 0 }}>
          <Container style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px" }}>

            {/* Header */}
            <Section style={{ textAlign: "center", marginBottom: 24 }}>
              <Text style={{ color: "rgba(212,175,55,0.6)", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 }}>
                ✦ COSMOGRAM ✦
              </Text>
              <Text style={{ color: "rgba(100,116,139,0.6)", fontSize: 11, letterSpacing: "0.15em", margin: "8px 0 0" }}>
                {date}
              </Text>
            </Section>

            <Hr style={{ borderColor: "rgba(212,175,55,0.22)", marginBottom: 36 }} />

            {/* Sign badge */}
            <Section style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{
                display: "inline-block",
                background: "rgba(212,175,55,0.07)",
                border: "0.5px solid rgba(212,175,55,0.25)",
                borderRadius: 24,
                padding: "8px 20px",
                marginBottom: 20,
              }}>
                <Text style={{ color: "#D4AF37", fontSize: 13, margin: 0, letterSpacing: "0.12em" }}>
                  {emoji} {sunSign}
                </Text>
              </div>

              <Heading style={{
                color: "#F3E5AB",
                fontSize: headline ? 22 : 28,
                fontWeight: 400,
                lineHeight: 1.4,
                margin: "0 0 16px",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}>
                {headline ?? "Twój horoskop na dziś jest gotowy"}
              </Heading>

              <Text style={{ color: "rgba(148,163,184,0.80)", fontSize: 15, lineHeight: 1.7, margin: "0 0 28px" }}>
                {headline
                  ? `Twój personalny horoskop na ${date} jest gotowy — otwórz aplikację, żeby go przeczytać.`
                  : `Kosmogram przygotował Twój spersonalizowany horoskop na ${date}. Sprawdź co gwiazdy mówią o Twoim dniu — tranzytowe aspekty do Twojej karty urodzeniowej, energia dnia i konkretne wskazówki.`}
              </Text>

              <Button
                href={`${appUrl}/app/horoscope`}
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #C5A059)",
                  color: "#050508",
                  padding: "14px 32px",
                  borderRadius: 24,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Otwórz horoskop →
              </Button>
            </Section>

            <Hr style={{ borderColor: "rgba(212,175,55,0.10)", margin: "36px 0" }} />

            {/* Quick links */}
            <Section style={{ marginBottom: 32 }}>
              <Text style={{ color: "rgba(212,175,55,0.50)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 16px", textAlign: "center" }}>
                Odkryj więcej
              </Text>
              <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td style={{ padding: "0 4px 0 0" }}>
                      <a href={`${appUrl}/app/cosmogram`} style={{
                        display: "block",
                        background: "rgba(212,175,55,0.05)",
                        border: "0.5px solid rgba(212,175,55,0.14)",
                        borderRadius: 10,
                        padding: "12px 14px",
                        textDecoration: "none",
                      }}>
                        <Text style={{ color: "#D4AF37", fontSize: 12, margin: 0, fontWeight: 600 }}>✦ Kosmogram</Text>
                        <Text style={{ color: "rgba(148,163,184,0.65)", fontSize: 11, margin: "2px 0 0", lineHeight: 1.4 }}>Twoja karta</Text>
                      </a>
                    </td>
                    <td style={{ padding: "0 0 0 4px" }}>
                      <a href={`${appUrl}/app/calendar`} style={{
                        display: "block",
                        background: "rgba(212,175,55,0.05)",
                        border: "0.5px solid rgba(212,175,55,0.14)",
                        borderRadius: 10,
                        padding: "12px 14px",
                        textDecoration: "none",
                      }}>
                        <Text style={{ color: "#D4AF37", fontSize: 12, margin: 0, fontWeight: 600 }}>📅 Kalendarz</Text>
                        <Text style={{ color: "rgba(148,163,184,0.65)", fontSize: 11, margin: "2px 0 0", lineHeight: 1.4 }}>Dni Mocy</Text>
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Hr style={{ borderColor: "rgba(212,175,55,0.08)", margin: "28px 0" }} />

            {/* Footer */}
            <Section style={{ textAlign: "center" }}>
              <Text style={{ color: "rgba(100,116,139,0.7)", fontSize: 11, lineHeight: 1.6, margin: "0 0 8px" }}>
                Wysłano z{" "}
                <a href={appUrl} style={{ color: "rgba(212,175,55,0.55)", textDecoration: "none" }}>
                  cosmo-gram.com
                </a>
              </Text>
              <Text style={{ color: "rgba(100,116,139,0.45)", fontSize: 10, margin: 0 }}>
                Nie chcesz otrzymywać codziennych horoskopów?{" "}
                <a
                  href={`${appUrl}/api/email/unsubscribe?id=${unsubId}`}
                  style={{ color: "rgba(100,116,139,0.65)", textDecoration: "underline" }}
                >
                  Wypisz się
                </a>
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
