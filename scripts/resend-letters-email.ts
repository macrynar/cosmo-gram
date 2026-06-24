#!/usr/bin/env tsx
// Jednorazowo: przewyślij poprawione maile (prod-linki) dla już dostarczonych listów.
// Uruchom: npx tsx --env-file=.env.local scripts/resend-letters-email.ts

import { supabaseAdmin } from "../src/lib/supabase-server";
import { sendLetterEmail } from "../src/lib/letters/email";

(async () => {
  const { data: letters } = await supabaseAdmin
    .from("user_letters")
    .select("id, user_id, letter_slug")
    .in("status", ["delivered", "read"]);

  console.log(`→ Przewysyłam ${letters?.length ?? 0} maili (poprawione linki)…`);
  for (const l of letters ?? []) {
    const r = await sendLetterEmail({ userId: l.user_id as string, userLetterId: l.id as string });
    console.log(`   ${l.letter_slug}: ${JSON.stringify(r)}`);
  }
})().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
