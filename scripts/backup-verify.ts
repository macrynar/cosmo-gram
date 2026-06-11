#!/usr/bin/env tsx
// Weryfikuje że Supabase jest osiągalne i kluczowe tabele mają dane.
// Uruchomienie: npx tsx scripts/backup-verify.ts
// Używaj po restore żeby potwierdzić integralność danych.

import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Brakuje zmiennych: NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

type CheckResult = { table: string; count: number | null; ok: boolean; error?: string };

async function countRows(table: string): Promise<CheckResult> {
  const { count, error } = await sb.from(table).select("*", { count: "exact", head: true });
  if (error) return { table, count: null, ok: false, error: error.message };
  return { table, count: count ?? 0, ok: true };
}

async function main() {
  console.log("=== Cosmo-Gram backup verify ===\n");

  const tables = [
    "readings",
    "children",
    "matches",
    "conversations",
    "messages",
    "user_preferences",
    "natal_modules_cache",
    "ai_call_logs",
    "cron_runs",
  ];

  const results = await Promise.all(tables.map(countRows));
  let allOk = true;

  for (const r of results) {
    const icon = r.ok ? "✓" : "✗";
    const info = r.ok ? `${r.count} rows` : `ERROR: ${r.error}`;
    console.log(`  ${icon} ${r.table.padEnd(24)} ${info}`);
    if (!r.ok) allOk = false;
  }

  console.log(`\nStatus: ${allOk ? "OK — wszystkie tabele osiągalne" : "BŁĄD — sprawdź logi powyżej"}`);
  process.exit(allOk ? 0 : 1);
}

main();
