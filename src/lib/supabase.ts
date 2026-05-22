import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function normalizeUrl(raw: string): string {
  return raw
    .replace(/\/(auth|rest|storage|realtime|functions)(\/.*)?$/, "")
    .replace(/\/+$/, "");
}

// Lazy singleton — defers createClient() to first use so the module can be
// imported during Next.js static prerendering without crashing when env vars
// aren't injected at build time.
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url  = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "");
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    _client = createClient(url, anon);
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const client = getClient();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? (val as (...a: unknown[]) => unknown).bind(client) : val;
  },
});
