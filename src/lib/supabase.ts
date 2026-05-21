import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Strip any trailing path segments (e.g. /auth/v1, /rest/v1) and trailing slashes
// that can appear when the env var is copied from Supabase dashboard connection strings.
const url = rawUrl.replace(/\/(auth|rest|storage|realtime|functions)(\/.*)?$/, "").replace(/\/+$/, "");

const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(url, anon);
