import { describe, it, expect } from "vitest";
import {
  FREE_CHILD_MODULE_IDS,
  PREMIUM_CHILD_MODULE_IDS,
  CHILD_MODULE_SPECS,
  ALL_CHILD_MODULE_IDS,
} from "@/lib/schemas/childModule";
import { FREE_MODULE_IDS, PREMIUM_MODULE_IDS } from "@/lib/moduleSpecs";
import { buildChildV2UserPrompt } from "@/lib/prompts/child-v2";
import type { ChartNodes } from "@/lib/chart-engine";

const nodes: ChartNodes = {
  north_node_sign: "Lew", south_node_sign: "Wodnik",
  north_node_house: null, south_node_house: null,
};

describe("freemium — kosmogram dziecka (2/6)", () => {
  it("free = temperament + emotions; premium = pozostałe 4", () => {
    expect(FREE_CHILD_MODULE_IDS).toEqual(["temperament", "emotions"]);
    expect(PREMIUM_CHILD_MODULE_IDS).toHaveLength(4);
    expect(FREE_CHILD_MODULE_IDS.length + PREMIUM_CHILD_MODULE_IDS.length).toBe(ALL_CHILD_MODULE_IDS.length);
  });

  it("isPremium=false tylko dla 2 wolnych modułów", () => {
    expect(CHILD_MODULE_SPECS.temperament.isPremium).toBe(false);
    expect(CHILD_MODULE_SPECS.emotions.isPremium).toBe(false);
    expect(CHILD_MODULE_SPECS.learning.isPremium).toBe(true);
    expect(CHILD_MODULE_SPECS.talents.isPremium).toBe(true);
    expect(CHILD_MODULE_SPECS.parenting.isPremium).toBe(true);
    expect(CHILD_MODULE_SPECS.peers.isPremium).toBe(true);
  });

  it("prompt free generuje TYLKO 2 moduły (temperament, emotions)", () => {
    const prompt = buildChildV2UserPrompt({
      name: "Test", birthDate: "2020-05-10", placements: [], aspects: [], nodes,
      moduleIds: FREE_CHILD_MODULE_IDS,
    });
    expect(prompt).toContain('id="temperament"');
    expect(prompt).toContain('id="emotions"');
    expect(prompt).not.toContain('id="learning"');
    expect(prompt).not.toContain('id="talents"');
    expect(prompt).not.toContain('id="parenting"');
    expect(prompt).not.toContain('id="peers"');
  });

  it("prompt premium (bez moduleIds) generuje wszystkie 6", () => {
    const prompt = buildChildV2UserPrompt({
      name: "Test", birthDate: "2020-05-10", placements: [], aspects: [], nodes,
    });
    for (const id of ALL_CHILD_MODULE_IDS) {
      expect(prompt).toContain(`id="${id}"`);
    }
  });
});

describe("freemium — kosmogram dorosłego (3/8)", () => {
  it("free = 3 moduły, premium = 5", () => {
    expect(FREE_MODULE_IDS).toHaveLength(3);
    expect(PREMIUM_MODULE_IDS).toHaveLength(5);
  });
});
