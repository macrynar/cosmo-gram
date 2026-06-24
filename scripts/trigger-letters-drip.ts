#!/usr/bin/env tsx
// Ręczny trigger dripu listów na prodzie (gdy cron Vercela nie wystartował).
// Ta sama logika co route. Uruchom: npx tsx --env-file=.env.local scripts/trigger-letters-drip.ts

import { runLettersDrip } from "../src/lib/letters/runDrip";

(async () => {
  console.log("→ Uruchamiam letters-drip na prodzie…");
  const r = await runLettersDrip(new Date());
  console.log("✓ Wynik:", JSON.stringify(r));
})().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
