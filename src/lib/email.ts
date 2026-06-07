import { Resend } from "resend";
import { render } from "@react-email/components";
import WelcomeEmail from "@/emails/WelcomeEmail";
import DailyHoroscopeEmail from "@/emails/DailyHoroscopeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM ?? "Cosmogram <horoskop@cosmo-gram.com>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.cosmo-gram.com";

export async function sendWelcomeEmail(email: string): Promise<void> {
  const html = await render(WelcomeEmail({ appUrl: BASE_URL }));
  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: "✦ Witaj w Cosmogramie — Twój ołtarz astrologiczny czeka",
    html,
  });
}

export async function sendDailyHoroscopeEmail(
  email:    string,
  sunSign:  string,
  date:     string,
  unsubId:  string,
): Promise<void> {
  const html = await render(
    DailyHoroscopeEmail({ sunSign, date, appUrl: BASE_URL, unsubId })
  );
  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: `✦ Twój horoskop na ${date} — ${sunSign}`,
    html,
    headers: {
      "List-Unsubscribe": `<${BASE_URL}/api/email/unsubscribe?id=${unsubId}>`,
    },
  });
}
