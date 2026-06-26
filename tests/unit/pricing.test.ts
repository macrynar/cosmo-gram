import { describe, it, expect } from "vitest";
import {
  FREE_CHAT_MESSAGES,
  PREMIUM_MONTHLY_CHAT_LIMIT,
  CHAT_PACKS,
  FREE_GENERATION_LIMIT,
  PREMIUM_MONTHLY_GENERATION_CAP,
} from "@/lib/pricing";

describe("pricing config — model 2026-06-25", () => {
  it("Cosmo Chat: free 3, premium 50/mc", () => {
    expect(FREE_CHAT_MESSAGES).toBe(3);
    expect(PREMIUM_MONTHLY_CHAT_LIMIT).toBe(50);
  });

  it("capy generacji: free 1 (lifetime), premium 5/mc", () => {
    expect(FREE_GENERATION_LIMIT).toBe(1);
    expect(PREMIUM_MONTHLY_GENERATION_CAP).toBe(5);
  });

  it("paczki czatu: kredyty 50/150/500, ceny stare (9,99/24,99/199)", () => {
    expect(CHAT_PACKS.map(p => p.messages)).toEqual([50, 150, 500]);
    expect(CHAT_PACKS.find(p => p.size === "small")?.price).toBe("9,99 zł");
    expect(CHAT_PACKS.find(p => p.size === "medium")?.price).toBe("24,99 zł");
    expect(CHAT_PACKS.find(p => p.size === "large")?.price).toBe("199,00 zł");
  });
});
