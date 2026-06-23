import { describe, it, expect } from "vitest";
import { planDripAction, type DripTemplateLite, type DripExistingLite } from "@/lib/letters/schedule";

const T: DripTemplateLite[] = [
  { slug: "misja", days_from_natal: 5, sort_order: 1 },
  { slug: "swiat", days_from_natal: 14, sort_order: 2 },
  { slug: "kochasz", days_from_natal: 21, sort_order: 3 },
];
const now = new Date("2026-06-23T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const plan = (over: Partial<Parameters<typeof planDripAction>[0]>) =>
  planDripAction({ templates: T, existing: [], anchor: daysAgo(0), now, lastDeliveredAt: null, ...over });

describe("planDripAction", () => {
  it("nowy user: pierwszy list jeszcze za wcześnie (poza oknem pre-gen)", () => {
    expect(plan({ anchor: now })).toBeNull(); // due za 5 dni > okno 2 dni
  });

  it("w oknie pre-gen: tworzy, ale jeszcze nie dostarcza", () => {
    const p = plan({ anchor: daysAgo(4) }); // misja due za 1 dzień
    expect(p).not.toBeNull();
    expect(p!.slug).toBe("misja");
    expect(p!.create).toBe(true);
    expect(p!.deliver).toBe(false);
  });

  it("dzień nadszedł, brak wcześniejszych listów → dostarcza", () => {
    const p = plan({ anchor: daysAgo(10) });
    expect(p!.slug).toBe("misja");
    expect(p!.deliver).toBe(true);
  });

  it("dyscyplina częstotliwości: świeżo dostarczony list blokuje kolejny (<7 dni)", () => {
    const existing: DripExistingLite[] = [{ slug: "misja", status: "delivered" }];
    const p = plan({ anchor: daysAgo(30), existing, lastDeliveredAt: daysAgo(3) });
    expect(p!.slug).toBe("swiat"); // frontier przeskoczył na #2
    expect(p!.deliver).toBe(false); // ale za wcześnie po poprzednim
    expect(p!.create).toBe(true);
  });

  it("po 7 dniach od poprzedniego → dostarcza następny", () => {
    const existing: DripExistingLite[] = [{ slug: "misja", status: "delivered" }];
    const p = plan({ anchor: daysAgo(30), existing, lastDeliveredAt: daysAgo(8) });
    expect(p!.slug).toBe("swiat");
    expect(p!.deliver).toBe(true);
  });

  it("frontier pomija pre-wygenerowany (generated) wiersz bez tworzenia", () => {
    const existing: DripExistingLite[] = [{ slug: "misja", status: "generated" }];
    const p = plan({ anchor: daysAgo(10), existing, lastDeliveredAt: null });
    expect(p!.slug).toBe("misja");
    expect(p!.create).toBe(false); // wiersz już jest
    expect(p!.deliver).toBe(true);
  });

  it("wszystko dostarczone → brak akcji", () => {
    const existing: DripExistingLite[] = T.map((t) => ({ slug: t.slug, status: "read" as const }));
    expect(plan({ anchor: daysAgo(200), existing })).toBeNull();
  });
});
