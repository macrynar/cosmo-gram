import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { isAuthorizedCron } from "@/lib/cronAuth";

// Runs monthly — deletes chat sessions (conversations + messages via CASCADE) older than 12 months.
// Configured in vercel.json: "0 3 1 * *" (03:00 UTC, 1st of each month)
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);

  const { data: old, error } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .lt("last_message_at", cutoff.toISOString())
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (old ?? []).map(c => c.id);
  if (ids.length === 0) {
    await supabaseAdmin.from("cron_runs").insert({ name: "cleanup-chat-sessions", status: "ok", metadata: { deleted: 0 } });
    return NextResponse.json({ deleted: 0 });
  }

  // Messages deleted via FK ON DELETE CASCADE
  await supabaseAdmin.from("conversations").delete().in("id", ids);

  await supabaseAdmin.from("cron_runs").insert({
    name: "cleanup-chat-sessions",
    status: "ok",
    metadata: { deleted: ids.length },
  });

  return NextResponse.json({ deleted: ids.length });
}
