import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock jest hoistowane → stan testowy trzymamy w vi.hoisted, by był dostępny w fabryce.
const h = vi.hoisted(() => ({
  state: {
    monthRow: null as { count: number } | null,
    lifetimeRows: [] as { count: number }[],
  },
  rpcMock: vi.fn(async () => ({ data: null, error: null })),
}));

// Mock supabaseAdmin: jeden chainable builder. Ścieżka "month" kończy się .maybeSingle()
// → { data: monthRow }; ścieżka "lifetime" jest awaitowana (thenable) → { data: lifetimeRows }.
vi.mock("@/lib/supabase-server", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => ({ data: h.state.monthRow }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then: (resolve: any) => resolve({ data: h.state.lifetimeRows }),
  };
  return {
    supabaseAdmin: {
      from: () => builder,
      rpc: h.rpcMock,
    },
  };
});

import {
  checkUsageLimit,
  getUsedCount,
  currentPeriodYm,
  incrementUsage,
} from "@/lib/usageLimits";

beforeEach(() => {
  h.state.monthRow = null;
  h.state.lifetimeRows = [];
  h.rpcMock.mockClear();
});

describe("currentPeriodYm", () => {
  it("formatuje YYYY-MM", () => {
    expect(currentPeriodYm(new Date("2026-06-25T12:00:00Z"))).toBe("2026-06");
  });

  it("granica miesiąca w strefie Europe/Warsaw (zima UTC+1)", () => {
    // 31 stycznia 23:30 UTC → 1 lutego 00:30 w Warszawie → nowy okres.
    expect(currentPeriodYm(new Date("2026-01-31T23:30:00Z"))).toBe("2026-02");
  });

  it("granica roku", () => {
    // 31 grudnia 23:30 UTC → 1 stycznia 00:30 Warszawa → następny rok.
    expect(currentPeriodYm(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01");
  });
});

describe("checkUsageLimit — cap miesięczny (premium 5/mc)", () => {
  it("przepuszcza poniżej limitu", async () => {
    h.state.monthRow = { count: 4 };
    expect(await checkUsageLimit("u1", "natal", { limit: 5, scope: "month" }))
      .toEqual({ allowed: true, used: 4 });
  });

  it("blokuje na limicie (5/5)", async () => {
    h.state.monthRow = { count: 5 };
    expect(await checkUsageLimit("u1", "natal", { limit: 5, scope: "month" }))
      .toEqual({ allowed: false, used: 5 });
  });

  it("brak rekordu = 0 użyć", async () => {
    h.state.monthRow = null;
    expect(await checkUsageLimit("u1", "match", { limit: 5, scope: "month" }))
      .toEqual({ allowed: true, used: 0 });
  });
});

describe("checkUsageLimit — limit free (lifetime, delete-proof)", () => {
  it("1. utworzenie dozwolone", async () => {
    h.state.lifetimeRows = [];
    expect(await checkUsageLimit("u1", "match", { limit: 1, scope: "lifetime" }))
      .toEqual({ allowed: true, used: 0 });
  });

  it("2. utworzenie zablokowane mimo skasowania rekordu (licznik nie spada)", async () => {
    // Po wygenerowaniu 1 matcha licznik = 1; usunięcie rekordu matcha NIE dekrementuje
    // licznika, więc kolejna próba dalej widzi used=1 ≥ limit.
    h.state.lifetimeRows = [{ count: 1 }];
    expect(await checkUsageLimit("u1", "match", { limit: 1, scope: "lifetime" }))
      .toEqual({ allowed: false, used: 1 });
  });

  it("lifetime sumuje wszystkie miesiące (przetrwa granicę miesiąca)", async () => {
    h.state.lifetimeRows = [{ count: 1 }, { count: 0 }];
    const r = await getUsedCount("u1", "child", "lifetime");
    expect(r).toBe(1);
  });
});

describe("incrementUsage", () => {
  it("woła RPC z poprawnym okresem", async () => {
    await incrementUsage("u1", "match", new Date("2026-06-25T12:00:00Z"));
    expect(h.rpcMock).toHaveBeenCalledWith("increment_usage_counter", {
      p_user_id: "u1",
      p_kind: "match",
      p_period_ym: "2026-06",
    });
  });
});
