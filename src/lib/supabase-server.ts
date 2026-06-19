import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Strip any accidental path suffix (e.g. /rest/v1) from the Supabase URL.
// SDK constructs auth URL as new URL('auth/v1', baseUrl) — if baseUrl has a
// path, the resulting auth endpoint is wrong (/rest/v1/auth/v1 instead of /auth/v1).
function normalizeUrl(raw: string): string {
  return (raw ?? "")
    .replace(/\/(auth|rest|storage|realtime|functions)(\/.*)?$/, "")
    .replace(/\/+$/, "");
}

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars missing");
    _client = createClient(url, key);
  }
  return _client;
}

// Proxy defers createClient() until first actual use (runtime, not build time)
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const client = getClient();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function"
      ? (val as (...args: unknown[]) => unknown).bind(client)
      : val;
  },
});
