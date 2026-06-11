import type { DayData } from "@/lib/chart-engine";
import type { PowerDay } from "@/lib/astro/powerDays";

export type DayClass = "exceptional" | "power" | "significant" | "normal";

// Thresholds — calibrated so: ~5 power, ~5-8 significant, rest normal (month of 30 days)
// score comes from computeMonthData (chart-engine), range 0-15+
const SIGNIFICANT_SCORE = 5;

// A power day is "exceptional" when the top transit hits a high-value natal point very tightly
const EXCEPTIONAL_NATAL_POINTS = new Set(["Słońce", "Księżyc", "ASC", "MC"]);
const EXCEPTIONAL_ORB = 0.6; // degrees

export function getDayClass(
  day: DayData,
  powerDayMap: Map<string, PowerDay>,
  isPremium: boolean,
): DayClass {
  const powerDay = isPremium ? powerDayMap.get(day.date) : undefined;

  if (powerDay) {
    const t = powerDay.topTransit;
    const isExceptional =
      EXCEPTIONAL_NATAL_POINTS.has(t.natalPoint) && t.orbDegrees <= EXCEPTIONAL_ORB;
    return isExceptional ? "exceptional" : "power";
  }

  if (day.score >= SIGNIFICANT_SCORE) return "significant";
  return "normal";
}

// Intensity 1-5 for grid texture (derived from DayData.score, works for all users)
export function getDayIntensity(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 10) return 5;
  if (score >= 7)  return 4;
  if (score >= 5)  return 3;
  if (score >= 3)  return 2;
  return 1;
}

// Human-readable badge labels for each class
export const DAY_CLASS_LABEL: Record<DayClass, string | null> = {
  exceptional: "★ Wyjątkowy dzień",
  power:       null,  // shown via gold ring in grid, no text badge
  significant: null,
  normal:      null,
};
