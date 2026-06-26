import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rateLimiter";
import { resolveActiveSubscription } from "@/lib/subscription";
import { supabaseAdmin } from "@/lib/supabase-server";
import { checkUsageLimit, incrementUsage } from "@/lib/usageLimits";
import { FREE_GENERATION_LIMIT, PREMIUM_MONTHLY_GENERATION_CAP } from "@/lib/pricing";
import { generateMatchResult } from "@/lib/astro/matchGenerator";

// Cała logika generacji żyje w src/lib/astro/matchGenerator.ts (współdzielona z
// /api/astro-match/upgrade). Tu zostaje tylko auth + delete-proof cap + IO.
// Re-export typów — importują je z tego route'a m.in. chat, share, komponenty match.
export type { CompatibilityCategory, CompatibilityResult } from "@/lib/astro/matchGenerator";

// Freemium: free → 1 match (lifetime), 3/8 modułów; premium → 5 matchy/mc, pełne 8. (§2.5)

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const authHeaderForRL = req.headers.get("Authorization");
  const rlIdentifier = authHeaderForRL
    ? authHeaderForRL.replace("Bearer ", "").slice(0, 32)
    : (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anon");
  const rateLimitRes = await checkRateLimit("ai", rlIdentifier);
  if (rateLimitRes) return rateLimitRes;

  let isPaidUser = false;
  let userId: string | null = null;
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        userId = user.id;
        isPaidUser = await resolveActiveSubscription(user.id, user.email);
        // Delete-proof cap: free 1 match (lifetime), premium 5/mc (§2.5).
        const limitOpts = isPaidUser
          ? { limit: PREMIUM_MONTHLY_GENERATION_CAP, scope: "month" as const }
          : { limit: FREE_GENERATION_LIMIT, scope: "lifetime" as const };
        const { allowed } = await checkUsageLimit(user.id, "match", limitOpts);
        if (!allowed) {
          // FREE_LIMIT → paywall (1. match gratis); MONTHLY_LIMIT → cap 5/mc.
          return NextResponse.json({ error: isPaidUser ? "MONTHLY_LIMIT" : "FREE_LIMIT" }, { status: 402 });
        }
      }
    }
  } catch { /* paywall check failed gracefully — allow request */ }

  const PersonSchema = z.object({
    name:  z.string().max(50).default(""),
    date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => {
      const y = parseInt(s.slice(0, 4)); return y >= 1900 && y <= new Date().getFullYear();
    }, "Rok poza zakresem 1900–teraz"),
    time:  z.string().max(5).default(""),
    place: z.string().max(100).default(""),
    lat:   z.number().min(-90).max(90),
    lng:   z.number().min(-180).max(180),
  });
  const BodySchema = z.object({ person1: PersonSchema, person2: PersonSchema });

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane wejściowe" }, { status: 400 });
  }

  try {
    const { result, charts } = await generateMatchResult(parsed.person1, parsed.person2, isPaidUser, userId);

    // Udana generacja = utworzenie → inkrementuj delete-proof licznik (best-effort).
    if (userId) await incrementUsage(userId, "match");

    return NextResponse.json({ result, isPaidUser, charts });
  } catch (err) {
    console.error("Match error:", err);
    return NextResponse.json({ error: "Błąd analizy" }, { status: 500 });
  }
}
