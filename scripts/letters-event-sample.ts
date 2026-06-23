#!/usr/bin/env tsx
// THROWAWAY — próbka listów EVENTOWYCH (Faza 6). Znajduje daty, w których event
// jest realnie aktywny dla przykładowego wykresu, generuje i wysyła mailem.
// Uruchom: npx tsx --env-file=.env.local scripts/letters-event-sample.ts

import { Resend } from "resend";
import { calculateChart } from "../src/lib/chart-engine";
import { detectEvents, type DetectedEvent } from "../src/lib/letters/events";
import { getLetterTemplate } from "../src/lib/letters/store";
import { generateLetterContent } from "../src/lib/letters/generate";

const TO = "mrynarzewski@gmail.com";
const FROM = process.env.RESEND_FROM ?? "Cosmogram <hello@cosmo-gram.com>";

const BIRTH = { date: "1987-11-04", time: "03:30", place: "Gdańsk", lat: 54.352, lng: 18.6466, timezone: "Europe/Warsaw" };
const chart = calculateChart({ date: BIRTH.date, time: BIRTH.time, lat: BIRTH.lat, lng: BIRTH.lng, place: BIRTH.place }).chart;

// Skan dat, by znaleźć realnie aktywny event danego typu.
function findEvent(slug: string, fromY: number, toY: number): { date: Date; ev: DetectedEvent } | null {
  for (let t = Date.UTC(fromY, 0, 1); t <= Date.UTC(toY, 11, 31); t += 7 * 86_400_000) {
    const date = new Date(t);
    const ev = detectEvents(chart, date).find((e) => e.slug === slug);
    if (ev) return { date, ev };
  }
  return null;
}

function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#F4F1EA;font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#B6AFC6">$1</em>');
}
function mdToHtml(md: string): string {
  return md.trim().split(/\n\n+/).map((b) => {
    const t = b.trim();
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) return "";
    return `<p style="margin:0 0 16px;line-height:1.8;color:#D2CCDE;font-size:16px">${inline(t)}</p>`;
  }).join("");
}

async function main() {
  const targets = [
    findEvent("powrot-saturna", 2015, 2019),
    findEvent("sezon-przemiany", 2023, 2028),
    findEvent("twoj-rok", 2026, 2026),
  ].filter(Boolean) as Array<{ date: Date; ev: DetectedEvent }>;

  const sections: string[] = [];
  for (const { date, ev } of targets) {
    const t = await getLetterTemplate(ev.slug);
    if (!t) continue;
    console.log(`\n→ ${ev.title} (event aktywny ${date.toISOString().slice(0, 10)}, key ${ev.event_key})…`);
    const gen = await generateLetterContent({ template: t, chart, userId: "event-sample", eventContext: ev.context });
    console.log(`   ${gen.validation.words} słów · walidacja ${gen.validation.ok ? "OK" : gen.validation.reasons.join("; ")}`);

    sections.push(`
      <div style="margin:0 0 48px;padding:0 0 40px;border-bottom:1px solid rgba(212,175,55,0.15)">
        <p style="color:rgba(212,175,55,0.7);font-size:12px;margin:0 0 4px">✉ Temat: <strong style="color:#E0B566">Wiadomość od Astrei: ${t.subject_phrase}</strong></p>
        <p style="color:#5f586e;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 8px">event · ${t.wellbeing_level} · aktywny ${date.toISOString().slice(0, 10)}</p>
        <h1 style="color:#F4F1EA;font-size:28px;font-weight:400;margin:0 0 14px;font-family:Georgia,serif">${t.title}</h1>
        ${mdToHtml(gen.content_md)}
        <p style="color:#5f586e;font-size:11px;margin:18px 0 0">${gen.validation.words} słów · ${gen.model}</p>
      </div>`);
  }

  if (sections.length === 0) { console.error("Brak eventów do wygenerowania."); process.exit(2); }

  const html = `<!DOCTYPE html><html lang="pl"><body style="background:#0B0912;margin:0;padding:0;font-family:Georgia,serif">
    <div style="max-width:620px;margin:0 auto;padding:40px 24px">
      <div style="text-align:center;margin:0 0 8px"><img src="https://www.cosmo-gram.com/apple-touch-icon.png" width="48" height="48" alt="Cosmogram" style="border-radius:12px;display:inline-block" /></div>
      <p style="color:rgba(212,175,55,0.7);font-size:11px;letter-spacing:0.35em;text-transform:uppercase;text-align:center;margin:0 0 24px">Cosmogram</p>
      <h2 style="color:#F4F1EA;text-align:center;font-weight:400;font-size:22px;margin:0 0 6px;font-family:Georgia,serif">Listy eventowe — próbki (Faza 6)</h2>
      <p style="color:#877FA0;text-align:center;font-size:13px;margin:0 0 36px">Wyzwalane tranzytem, na przykładowym kosmogramie (${BIRTH.date}, ${BIRTH.place}). Każdy cytuje konkretny tranzyt.</p>
      ${sections.join("")}
    </div></body></html>`;

  console.log(`\n→ Wysyłam ${sections.length} listów na ${TO}…`);
  const res = await new Resend(process.env.RESEND_API_KEY!).emails.send({
    from: FROM, to: TO, subject: "Listy eventowe — próbki (Powrót Saturna, Sezon przemiany)", html,
  });
  console.log("   Resend:", JSON.stringify(res.data ?? res.error));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
