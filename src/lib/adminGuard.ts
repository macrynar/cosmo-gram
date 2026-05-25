import { supabaseAdmin } from "@/lib/supabase-server";

export async function isAdmin(token: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  if (!user) return false;

  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return data !== null;
}

export async function requireAdmin(
  token: string | null
): Promise<{ userId: string } | null> {
  if (!token) return null;
  const clean = token.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(clean);
  if (!user) return null;

  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;
  return { userId: user.id };
}
