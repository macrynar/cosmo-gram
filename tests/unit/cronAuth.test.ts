import { describe, it, expect, afterEach } from "vitest";
import type { NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cronAuth";

function reqWith(auth: string | null): NextRequest {
  return {
    headers: { get: (k: string) => (k.toLowerCase() === "authorization" ? auth : null) },
  } as unknown as NextRequest;
}

describe("isAuthorizedCron", () => {
  const orig = process.env.CRON_SECRET;
  afterEach(() => {
    if (orig === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = orig;
  });

  it("akceptuje poprawny bearer", () => {
    process.env.CRON_SECRET = "abc123";
    expect(isAuthorizedCron(reqWith("Bearer abc123"))).toBe(true);
  });

  it("akceptuje gdy wartość env ma doklejony \\n (realny bug prod) — trim ratuje", () => {
    process.env.CRON_SECRET = "abc123\n";
    expect(isAuthorizedCron(reqWith("Bearer abc123"))).toBe(true);
  });

  it("akceptuje gdy env ma spację na końcu", () => {
    process.env.CRON_SECRET = "abc123 ";
    expect(isAuthorizedCron(reqWith("Bearer abc123"))).toBe(true);
  });

  it("odrzuca zły sekret", () => {
    process.env.CRON_SECRET = "abc123";
    expect(isAuthorizedCron(reqWith("Bearer nope"))).toBe(false);
  });

  it("odrzuca brak nagłówka", () => {
    process.env.CRON_SECRET = "abc123";
    expect(isAuthorizedCron(reqWith(null))).toBe(false);
  });

  it("odrzuca gdy CRON_SECRET nieustawiony", () => {
    delete process.env.CRON_SECRET;
    expect(isAuthorizedCron(reqWith("Bearer abc123"))).toBe(false);
  });
});
