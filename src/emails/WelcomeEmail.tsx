import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Img, Preview, Section, Text, Tailwind,
} from "@react-email/components";
import * as React from "react";

type Props = { appUrl: string };

export default function WelcomeEmail({ appUrl }: Props) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>Twój ołtarz astrologiczny jest gotowy — stwórz swój kosmogram</Preview>
      <Tailwind>
        <Body style={{ background: "#050508", fontFamily: "Georgia, serif", margin: 0, padding: 0 }}>
          <Container style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px" }}>

            {/* Logo area */}
            <Section style={{ textAlign: "center", marginBottom: 32 }}>
              <Text style={{ color: "rgba(212,175,55,0.6)", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 }}>
                ✦ COSMOGRAM ✦
              </Text>
            </Section>

            {/* Gold divider */}
            <Hr style={{ borderColor: "rgba(212,175,55,0.25)", marginBottom: 40 }} />

            {/* Hero */}
            <Section style={{ textAlign: "center", marginBottom: 40 }}>
              <Text style={{ color: "rgba(212,175,55,0.55)", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", margin: "0 0 12px" }}>
                Witaj w swoim ołtarzu
              </Text>
              <Heading style={{
                color: "#F3E5AB",
                fontSize: 32,
                fontWeight: 400,
                lineHeight: 1.3,
                margin: "0 0 20px",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}>
                Kosmogram jest gotowy.<br />Teraz czas na Twój.
              </Heading>
              <Text style={{ color: "rgba(148,163,184,0.85)", fontSize: 15, lineHeight: 1.7, margin: "0 0 32px" }}>
                Twoje konto zostało aktywowane. Stwórz swój kosmogram natalny i odkryj, co gwiazdy mówiły w chwili Twoich narodzin — interpretacja AI z prawdziwym głosem, nie szablon.
              </Text>
              <Button
                href={`${appUrl}/app/cosmogram`}
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
                Stwórz swój kosmogram →
              </Button>
            </Section>

            {/* Gold divider */}
            <Hr style={{ borderColor: "rgba(212,175,55,0.12)", margin: "40px 0" }} />

            {/* Features */}
            <Section style={{ marginBottom: 40 }}>
              <Text style={{ color: "rgba(212,175,55,0.55)", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", margin: "0 0 24px", textAlign: "center" }}>
                Co znajdziesz w Cosmogramie
              </Text>

              {[
                { icon: "✦", title: "Kosmogram natalny", desc: "8 modułów interpretacji — tożsamość, supermoce, cienie, misja." },
                { icon: "📅", title: "Kalendarz kosmiczny", desc: "Dni Mocy, okna aktywności. Wiesz kiedy działać, kiedy odpoczywać." },
                { icon: "💬", title: "Cosmo Chat", desc: "Astrolog AI który zna Twoją kartę. Pytaj o wszystko." },
                { icon: "❤️", title: "Cosmo Match", desc: "Synastria z partnerem, przyjacielem, rodziną. Kto Cię uzupełnia?" },
              ].map(({ icon, title, desc }) => (
                <Section key={title} style={{
                  background: "rgba(212,175,55,0.04)",
                  border: "0.5px solid rgba(212,175,55,0.12)",
                  borderRadius: 12,
                  padding: "14px 18px",
                  marginBottom: 10,
                }}>
                  <Text style={{ margin: 0, color: "#F3E5AB", fontSize: 14, fontWeight: 600 }}>
                    {icon} {title}
                  </Text>
                  <Text style={{ margin: "4px 0 0", color: "rgba(148,163,184,0.80)", fontSize: 13, lineHeight: 1.5 }}>
                    {desc}
                  </Text>
                </Section>
              ))}
            </Section>

            {/* Gold divider */}
            <Hr style={{ borderColor: "rgba(212,175,55,0.12)", margin: "32px 0" }} />

            {/* Footer */}
            <Section style={{ textAlign: "center" }}>
              <Text style={{ color: "rgba(100,116,139,0.7)", fontSize: 11, lineHeight: 1.6, margin: "0 0 8px" }}>
                Wysłano z{" "}
                <a href={appUrl} style={{ color: "rgba(212,175,55,0.55)", textDecoration: "none" }}>
                  cosmo-gram.com
                </a>
              </Text>
              <Text style={{ color: "rgba(100,116,139,0.5)", fontSize: 10, margin: 0 }}>
                Otrzymujesz ten mail ponieważ założyłeś konto w Cosmogramie.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
