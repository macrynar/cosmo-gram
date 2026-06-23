import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import type { NatalChart } from "@/lib/astro-types";
import type { LetterTemplate } from "@/types/letters";

// Mock rejestru promptów — bez DB. renderTemplate przechodzi realnie.
vi.mock("@/lib/promptResolver", () => ({
  resolvePromptVersion: vi.fn(async () => ({
    id: "pv-test",
    version: "v1",
    system_prompt: "Jesteś Astreą. Pisz ciepło.",
    user_prompt_template: "List: {{title}}\nFundament:\n{{placements}}",
    config: { model: "claude-sonnet-4-6", max_tokens: 1400 },
  })),
  renderTemplate: (tpl: string, vars: Record<string, string>) =>
    tpl.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => vars[k] ?? `{{${k}}}`),
}));

import { generateLetterContent } from "@/lib/letters/generate";

const fix = (name: string) => readFileSync(join(process.cwd(), "tests/fixtures/ai/letters", name), "utf-8").trim();

const chart: NatalChart = {
  planets: [], houses: [], ascendant: 0, mc: 0,
  birthData: { date: "1990-06-15", time: "14:30", place: "Warszawa", lat: 52.2297, lng: 21.0122, timezone: "Europe/Warsaw" },
};

const base: Omit<LetterTemplate, "slug" | "title" | "placement_inputs" | "wellbeing_level" | "prompt_slug"> = {
  id: "t", theme: "x", trigger_type: "time", trigger_value: { days_from_natal: 5 },
  tier: "free", kind: "letter", word_min: 250, word_max: 450, sort_order: 1, is_active: true, created_at: "now",
  subject_phrase: "Oto test",
};

describe("generateLetterContent (AI_MOCK)", () => {
  beforeAll(() => { process.env.AI_MOCK = "true"; });
  afterAll(() => { delete process.env.AI_MOCK; });

  it("generuje list standardowy z fixture i przechodzi walidację", async () => {
    const template: LetterTemplate = {
      ...base, slug: "twoja-misja", title: "Twoja misja", wellbeing_level: "standard",
      prompt_slug: "twoja-misja", placement_inputs: { planets: ["Słońce"], points: ["MC", "Węzeł Północny"] },
    };
    const r = await generateLetterContent({ template, chart, userId: "u1" });
    expect(r.content_md).toBe(fix("standard.md"));
    expect(r.validation.ok).toBe(true);
    expect(r.ai_prompt_version).toBe("twoja-misja@v1");
    expect(r.model).toBe("claude-sonnet-4-6");
    expect(r.signature_label).toBe("Słońce · MC · Węzeł Północny");
  });

  it("dla wellbeing delikatny bierze fixture delikatny", async () => {
    const template: LetterTemplate = {
      ...base, slug: "twoj-cien", title: "Twój cień", tier: "premium", wellbeing_level: "delikatny",
      prompt_slug: "twoj-cien", placement_inputs: { planets: ["Saturn", "Pluton"], houses: [12], points: ["Węzeł Południowy"] },
    };
    const r = await generateLetterContent({ template, chart, userId: "u1" });
    expect(r.content_md).toBe(fix("delikatny.md"));
    expect(r.validation.ok).toBe(true);
  });
});
