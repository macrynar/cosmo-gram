// Test negatywny RLS — Listy od Astrei (najwrażliwsza warstwa, obok chatu).
// Dowodzi, że user B NIE odczyta listów / skrzynki / zakupów usera A.
//
// Domyślnie SKIPPED (vitest run zostaje zielony). Uruchom świadomie:
//   RUN_RLS_TESTS=true npx vitest run tests/integration/letters-rls.test.ts
// Wymaga env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
//
// Wersja "na żywo" (rolled-back, bez tworzenia userów) była uruchamiana przez MCP
// przy wdrożeniu migracji — patrz docs/LISTY-VERIFY.md.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const enabled = process.env.RUN_RLS_TESTS === "true" && !!URL && !!ANON && !!SERVICE;

describe.skipIf(!enabled)("RLS — Listy od Astrei (test negatywny)", () => {
  const run = Date.now();
  const emailA = `rls-a-${run}@cosmo-test.invalid`;
  const emailB = `rls-b-${run}@cosmo-test.invalid`;
  const password = `Tst!${run}aZ`;

  let admin: SupabaseClient;
  let userA = "";
  let userB = "";
  let letterId = "";
  let clientB: SupabaseClient;
  let clientA: SupabaseClient;

  beforeAll(async () => {
    admin = createClient(URL!, SERVICE!, { auth: { persistSession: false, autoRefreshToken: false } });
    const a = await admin.auth.admin.createUser({ email: emailA, password, email_confirm: true });
    const b = await admin.auth.admin.createUser({ email: emailB, password, email_confirm: true });
    userA = a.data.user!.id;
    userB = b.data.user!.id;

    // Service role (omija RLS) sieje dane usera A — tak jak robi to cron/generacja.
    const letter = await admin.from("user_letters").insert({
      user_id: userA, letter_slug: "twoja-misja", content_md: "SEKRET A", status: "delivered", source: "drip",
    }).select("id").single();
    letterId = letter.data!.id;
    await admin.from("inbox_items").insert({
      user_id: userA, type: "letter", ref_id: letterId, title: "List A", preview: "zajawka A",
    });
    await admin.from("letter_purchases").insert({
      user_id: userA, report_slug: "zloty-kompas", stripe_session_id: `sess_${run}`,
    });

    clientA = createClient(URL!, ANON!, { auth: { persistSession: false } });
    clientB = createClient(URL!, ANON!, { auth: { persistSession: false } });
    await clientA.auth.signInWithPassword({ email: emailA, password });
    await clientB.auth.signInWithPassword({ email: emailB, password });
  });

  afterAll(async () => {
    await admin.from("inbox_items").delete().eq("user_id", userA);
    await admin.from("letter_purchases").delete().eq("user_id", userA);
    await admin.from("user_letters").delete().eq("user_id", userA);
    if (userA) await admin.auth.admin.deleteUser(userA);
    if (userB) await admin.auth.admin.deleteUser(userB);
  });

  it("user B nie widzi listów usera A", async () => {
    const { data } = await clientB.from("user_letters").select("id").eq("content_md", "SEKRET A");
    expect(data ?? []).toHaveLength(0);
  });

  it("user B nie widzi skrzynki usera A", async () => {
    const { data } = await clientB.from("inbox_items").select("id").eq("title", "List A");
    expect(data ?? []).toHaveLength(0);
  });

  it("user B nie widzi zakupów usera A", async () => {
    const { data } = await clientB.from("letter_purchases").select("id").eq("stripe_session_id", `sess_${run}`);
    expect(data ?? []).toHaveLength(0);
  });

  it("user A widzi własny list (RLS przepuszcza właściciela, nie brak GRANT-u)", async () => {
    const { data } = await clientA.from("user_letters").select("id").eq("content_md", "SEKRET A");
    expect(data ?? []).toHaveLength(1);
  });
});
