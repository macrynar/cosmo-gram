// Powiadomienie mailowe o nowym liście (Resend, React Email). Open-loop:
// zajawka + CTA do skrzynki, BEZ pełnej treści. Respektuje opt-out (email_letters).

import { Resend } from "resend";
import { render } from "@react-email/components";
import LetterEmail from "@/emails/LetterEmail";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getLetterTemplate, buildPreview } from "@/lib/letters/store";

const FROM = process.env.RESEND_FROM ?? "Cosmogram <hello@cosmo-gram.com>";
// Maile ZAWSZE wskazują na produkcję — NIGDY NEXT_PUBLIC_APP_URL (bywa localhostem
// przy lokalnym/ręcznym uruchomieniu). Override tylko świadomie przez EMAIL_APP_URL.
const BASE_URL = process.env.EMAIL_APP_URL ?? "https://www.cosmo-gram.com";

export interface SendLetterEmailResult {
  sent: boolean;
  reason?: "opted_out" | "no_email" | "no_content" | "skipped";
}

export async function sendLetterEmail(params: { userId: string; userLetterId: string }): Promise<SendLetterEmailResult> {
  const { userId, userLetterId } = params;

  const { data: pref } = await supabaseAdmin
    .from("user_preferences")
    .select("email_letters")
    .eq("user_id", userId)
    .maybeSingle();
  if (pref && pref.email_letters === false) return { sent: false, reason: "opted_out" };

  const { data: letter } = await supabaseAdmin
    .from("user_letters")
    .select("content_md, letter_slug")
    .eq("id", userLetterId)
    .maybeSingle();
  if (!letter?.content_md) return { sent: false, reason: "no_content" };

  const { data: auth } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = auth?.user?.email;
  if (!email) return { sent: false, reason: "no_email" };

  const template = await getLetterTemplate(letter.letter_slug as string);
  const title = template?.title ?? "List od Astrei";
  const subjectPhrase = template?.subject_phrase ?? `Oto ${title}`;
  const preview = buildPreview(letter.content_md as string, 220);
  const unsubUrl = `${BASE_URL}/api/email/unsubscribe?id=${userId}&type=letters`;

  // Nie wysyłaj w mocku/lokalnie (brak klucza) — przydatne w E2E.
  if (process.env.AI_MOCK === "true" || !process.env.RESEND_API_KEY) {
    return { sent: false, reason: "skipped" };
  }

  const html = await render(LetterEmail({ appUrl: BASE_URL, title, preview, unsubUrl }));
  await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: FROM,
    to: email,
    subject: `Wiadomość od Astrei: ${subjectPhrase}`,
    html,
    headers: { "List-Unsubscribe": `<${unsubUrl}>` },
  });

  return { sent: true };
}
