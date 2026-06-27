import type { NextRequest } from "next/server";

/**
 * Czy request niesie poprawny token `CRON_SECRET` (schemat Bearer).
 *
 * Trim po OBU stronach jest celowy: wartości env wklejane przez dashboard Vercela
 * często mają doklejony końcowy `\n`/spację (np. skopiowane z bloku kodu). HTTP i tak
 * nie przenosi białych znaków na końcu wartości nagłówka, więc bez trimu porównanie
 * `Bearer <secret>` nigdy się nie zgadza i KAŻDY cron leci 401 — także te wywoływane
 * przez samego Vercela. Patrz: gotcha „Vercel crony down".
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return req.headers.get("authorization")?.trim() === `Bearer ${secret}`;
}
