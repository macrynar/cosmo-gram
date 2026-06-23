#!/usr/bin/env tsx
// THROWAWAY — generuje prawdziwe listy (Sonnet) i wysyła je mailem do kontroli jakości.
// Uruchom: npx tsx --env-file=.env.local scripts/letters-quality-sample.ts
// Usuwany po użyciu.

import { Resend } from "resend";
import { getLetterTemplate } from "../src/lib/letters/store";
import { generateLetterContent } from "../src/lib/letters/generate";
import type { NatalChart } from "../src/lib/astro-types";

const TO = "mrynarzewski@gmail.com";
const FROM = process.env.RESEND_FROM ?? "Cosmogram <hello@cosmo-gram.com>";

// Przykładowy kosmogram (nie Twój — do oceny samego pisania/voice).
const BIRTH = { date: "1987-11-04", time: "03:30", place: "Gdańsk", lat: 54.352, lng: 18.6466, timezone: "Europe/Warsaw" };
const chart: NatalChart = { planets: [], houses: [], ascendant: 0, mc: 0, birthData: BIRTH };

// Cztery różne tematy, w tym jeden „delikatny" (cień).
const SLUGS = ["twoja-misja", "jak-kochasz", "twoje-dary", "twoj-cien"];

function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#F4F1EA;font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#B6AFC6">$1</em>');
}
function mdToHtml(md: string): string {
  return md.trim().split(/\n\n+/).map((b) => {
    const t = b.trim();
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) return ""; // gołe poziome linie — pomiń
    if (t.startsWith("## ")) return `<h2 style="color:#E9DCC0;font-size:20px;font-weight:400;margin:26px 0 10px;font-family:Georgia,serif">${inline(t.slice(3))}</h2>`;
    if (t.startsWith("### ")) return `<h3 style="color:#E9DCC0;font-size:17px;margin:20px 0 8px">${inline(t.slice(4))}</h3>`;
    return `<p style="margin:0 0 16px;line-height:1.8;color:#D2CCDE;font-size:16px">${inline(t)}</p>`;
  }).join("");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Sonnet to model produkcyjny listów; przy przeciążeniu (5xx) fallback na Opus 4.8, potem Haiku.
const MODELS = ["claude-sonnet-4-6", "claude-opus-4-8", "claude-haiku-4-5-20251001"];

async function genWithRetry(t: Awaited<ReturnType<typeof getLetterTemplate>>) {
  let lastErr: unknown;
  for (const m of MODELS) {
    for (let i = 0; i < 3; i++) {
      try {
        return await generateLetterContent({ template: t!, chart, userId: "quality-sample", modelOverride: m });
      } catch (e) {
        lastErr = e;
        const status = (e as { status?: number })?.status;
        console.log(`   …${m} próba ${i + 1} (${status ?? "err"}), ponawiam…`);
        await sleep(2500 * (i + 1));
      }
    }
    console.log(`   ↳ ${m} niedostępny, próbuję kolejny model…`);
  }
  throw lastErr;
}

async function main() {
  const sections: string[] = [];
  for (const slug of SLUGS) {
    const t = await getLetterTemplate(slug);
    if (!t) { console.error(`Brak szablonu ${slug}`); continue; }
    console.log(`\n→ Generuję „${t.title}" (${t.wellbeing_level})…`);
    let gen;
    try {
      gen = await genWithRetry(t);
    } catch (e) {
      console.error(`   ✗ Pominięto ${slug} po retry:`, (e as Error)?.message?.slice(0, 120));
      await sleep(2000);
      continue;
    }
    console.log(`   ${gen.validation.words} słów · walidacja ${gen.validation.ok ? "OK" : "FAIL: " + gen.validation.reasons.join("; ")} · fundament: ${gen.signature_label}`);
    await sleep(1500);

    sections.push(`
      <div style="margin:0 0 48px;padding:0 0 40px;border-bottom:1px solid rgba(212,175,55,0.15)">
        <p style="color:rgba(212,175,55,0.55);font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px">List od Astrei · ${t.wellbeing_level}</p>
        <h1 style="color:#F4F1EA;font-size:28px;font-weight:400;margin:0 0 10px;font-family:Georgia,serif">${t.title}</h1>
        <p style="display:inline-block;margin:0 0 20px;padding:4px 12px;border-radius:999px;background:rgba(255,174,61,0.10);border:1px solid rgba(255,174,61,0.25);color:#E0B566;font-size:12px">✦ ${gen.signature_label}</p>
        ${mdToHtml(gen.content_md)}
        <p style="color:#5f586e;font-size:11px;margin:18px 0 0">${gen.validation.words} słów · model ${gen.model}</p>
      </div>`);
  }

  const html = `<!DOCTYPE html><html lang="pl"><body style="background:#0B0912;margin:0;padding:0;font-family:Georgia,serif">
    <div style="max-width:620px;margin:0 auto;padding:40px 24px">
      <div style="text-align:center;margin:0 0 8px">
        <img src="https://www.cosmo-gram.com/apple-touch-icon.png" width="48" height="48" alt="Cosmogram" style="border-radius:12px;display:inline-block" />
      </div>
      <p style="color:rgba(212,175,55,0.7);font-size:11px;letter-spacing:0.35em;text-transform:uppercase;text-align:center;margin:0 0 24px">Cosmogram</p>
      <h2 style="color:#F4F1EA;text-align:center;font-weight:400;font-size:22px;margin:0 0 6px;font-family:Georgia,serif">Listy od Astrei — próbki jakości</h2>
      <p style="color:#877FA0;text-align:center;font-size:13px;margin:0 0 36px">4 tematy na przykładowym kosmogramie (${BIRTH.date}, ${BIRTH.place}). To NIE Twój wykres — do oceny pisania i głosu.</p>
      ${sections.join("")}
      <p style="color:#5f586e;font-size:11px;text-align:center;margin:24px 0 0">Wygenerowane silnikiem Listów (Sonnet, prompty z prompt_versions). Throwaway.</p>
    </div></body></html>`;

  if (sections.length === 0) {
    console.error("\n✗ Zero listów wygenerowanych (API przeciążone). NIE wysyłam pustego maila. Spróbuj ponownie później.");
    process.exit(2);
  }

  console.log(`\n→ Wysyłam ${sections.length} listów na ${TO}…`);
  const res = await new Resend(process.env.RESEND_API_KEY!).emails.send({
    from: FROM, to: TO, subject: "✦ Astrea przeczytała kosmogram — 4 listy w środku", html,
  });
  console.log("   Resend:", JSON.stringify(res.data ?? res.error));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
