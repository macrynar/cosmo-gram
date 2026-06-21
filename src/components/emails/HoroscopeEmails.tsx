import { Html, Body, Container, Section, Text, Link, Footer, Heading } from "@react-email/components";

export interface WeeklyHoroscopeEmailProps {
  userName: string;
  weekStart: string;
  weekEnd: string;
  horoscopeContent: string;
  unsubscribeToken: string;
  userId: string;
}

export function WeeklyHoroscopeEmail({
  userName,
  weekStart,
  weekEnd,
  horoscopeContent,
  unsubscribeToken,
  userId,
}: WeeklyHoroscopeEmailProps) {
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://cosmogram.pl"}/emails/unsubscribe?type=weekly&token=${unsubscribeToken}`;

  return (
    <Html>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f5f0" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "20px" }}>
          <Section style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "30px", marginBottom: "20px" }}>
            <Heading style={{ color: "#2d2d2d", fontSize: "24px", marginTop: 0 }}>
              Twoja tygodniówka ✨
            </Heading>

            <Text style={{ color: "#666", fontSize: "14px", margin: "10px 0" }}>
              Cześć {userName}!
            </Text>

            <Text style={{ color: "#666", fontSize: "14px", margin: "10px 0" }}>
              Oto energetyczne trendy na tydzień <strong>{weekStart}</strong> – <strong>{weekEnd}</strong>:
            </Text>

            <Section
              style={{
                backgroundColor: "#faf7f3",
                borderLeft: "4px solid #d4a574",
                padding: "15px",
                marginTop: "20px",
                marginBottom: "20px",
                borderRadius: "4px",
              }}
            >
              <Text style={{ color: "#2d2d2d", fontSize: "16px", lineHeight: "1.6", margin: 0 }}>
                {horoscopeContent}
              </Text>
            </Section>

            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL || "https://cosmogram.pl"}/app/calendar?h=week`}
              style={{
                display: "inline-block",
                backgroundColor: "#d4a574",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "4px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "bold",
                marginTop: "20px",
              }}
            >
              Przejdź do kalendarza
            </Link>
          </Section>

          <Footer style={{ textAlign: "center", color: "#999", fontSize: "12px", paddingTop: "20px" }}>
            <Text style={{ marginBottom: "10px" }}>
              © {new Date().getFullYear()} Cosmogram. Wszyscy prawa zastrzeżone.
            </Text>
            <Link
              href={unsubscribeUrl}
              style={{
                color: "#d4a574",
                textDecoration: "underline",
                fontSize: "12px",
              }}
            >
              Wyrejestruj się z wiadomości tygodniowych
            </Link>
          </Footer>
        </Container>
      </Body>
    </Html>
  );
}

export interface MonthlyForecastEmailProps {
  userName: string;
  month: string;
  year: number;
  forecastContent: string;
  unsubscribeToken: string;
  userId: string;
}

export function MonthlyForecastEmail({
  userName,
  month,
  year,
  forecastContent,
  unsubscribeToken,
  userId,
}: MonthlyForecastEmailProps) {
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://cosmogram.pl"}/emails/unsubscribe?type=monthly&token=${unsubscribeToken}`;

  return (
    <Html>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f5f0" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "20px" }}>
          <Section style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "30px", marginBottom: "20px" }}>
            <Heading style={{ color: "#2d2d2d", fontSize: "24px", marginTop: 0 }}>
              Twoja prognoza na miesiąc 🌙
            </Heading>

            <Text style={{ color: "#666", fontSize: "14px", margin: "10px 0" }}>
              Cześć {userName}!
            </Text>

            <Text style={{ color: "#666", fontSize: "14px", margin: "10px 0" }}>
              Oto szczegółowa prognoza na <strong>{month} {year}</strong>:
            </Text>

            <Section
              style={{
                backgroundColor: "#faf7f3",
                borderLeft: "4px solid #d4a574",
                padding: "15px",
                marginTop: "20px",
                marginBottom: "20px",
                borderRadius: "4px",
              }}
            >
              <Text style={{ color: "#2d2d2d", fontSize: "16px", lineHeight: "1.6", margin: 0 }}>
                {forecastContent}
              </Text>
            </Section>

            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL || "https://cosmogram.pl"}/app/calendar`}
              style={{
                display: "inline-block",
                backgroundColor: "#d4a574",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "4px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "bold",
                marginTop: "20px",
              }}
            >
              Przejdź do pełnego kalendarza
            </Link>
          </Section>

          <Footer style={{ textAlign: "center", color: "#999", fontSize: "12px", paddingTop: "20px" }}>
            <Text style={{ marginBottom: "10px" }}>
              © {new Date().getFullYear()} Cosmogram. Wszyscy prawa zastrzeżone.
            </Text>
            <Link
              href={unsubscribeUrl}
              style={{
                color: "#d4a574",
                textDecoration: "underline",
                fontSize: "12px",
              }}
            >
              Wyrejestruj się z wiadomości miesięcznych
            </Link>
          </Footer>
        </Container>
      </Body>
    </Html>
  );
}
