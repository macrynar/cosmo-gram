import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Only used in server-side API routes — never expose this to the browser
export const supabaseAdmin = createClient(url, serviceKey);
