import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import * as React from "react";

// Powiadomienie open-loop: zajawka + CTA do aplikacji. Pełnej treści NIE ma w mailu —
// mail prowadzi do skrzynki (napędza powrót).
type Props = { appUrl: string; title: string; preview: string; unsubUrl: string };

export default function LetterEmail({ appUrl, title, preview, unsubUrl }: Props) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>Astrea odsłania kolejną warstwę Twojego kosmogramu</Preview>
      <Body style={{ background: "#050508", fontFamily: "Georgia, serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px" }}>

          <Section style={{ textAlign: "center", marginBottom: 28 }}>
            <Text style={{ color: "rgba(212,175,55,0.6)", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 }}>
              ✦ COSMOGRAM ✦
            </Text>
          </Section>

          <Hr style={{ borderColor: "rgba(212,175,55,0.25)", marginBottom: 36 }} />

          <Section style={{ textAlign: "center", marginBottom: 28 }}>
            <Text style={{ color: "rgba(212,175,55,0.55)", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", margin: "0 0 12px" }}>
              Astrea napisała do Ciebie list
            </Text>
            <Heading style={{ color: "#F3E5AB", fontSize: 30, fontWeight: 400, lineHeight: 1.3, margin: "0 0 20px", fontFamily: "Georgia, 'Times New Roman', serif" }}>
              {title}
            </Heading>
          </Section>

          <Section style={{ marginBottom: 32 }}>
            <Text style={{ color: "#C9C2D6", fontSize: 16, lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>
              „{preview}”
            </Text>
          </Section>

          <Section style={{ textAlign: "center", marginBottom: 16 }}>
            <Text style={{ color: "#8B8398", fontSize: 13, lineHeight: 1.7, margin: "0 0 24px" }}>
              To dopiero początek. Cały list czeka na Ciebie w skrzynce w aplikacji.
            </Text>
            <Button
              href={`${appUrl}/app/cosmogram?inbox=1`}
              style={{
                background: "linear-gradient(135deg, #F5D98B, #D4AF37)",
                color: "#201405", fontSize: 14, fontWeight: 600, textDecoration: "none",
                padding: "14px 32px", borderRadius: 999, fontFamily: "Georgia, serif",
              }}
            >
              Przeczytaj w aplikacji →
            </Button>
          </Section>

          <Hr style={{ borderColor: "rgba(212,175,55,0.15)", margin: "36px 0 16px" }} />

          <Section style={{ textAlign: "center" }}>
            <Text style={{ color: "#5f586e", fontSize: 11, lineHeight: 1.6, margin: 0 }}>
              Dostajesz ten mail, bo masz aktywną subskrypcję Cosmogramu.{" "}
              <a href={unsubUrl} style={{ color: "#877FA0" }}>Nie chcę powiadomień o listach</a>.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
