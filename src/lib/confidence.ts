import type { ModuleId } from "./schemas/astroModule";

export type ConfidenceContext = {
  hasExactTime:         boolean;
  birthYear:            number;
  locationPrecisionKm:  number;
  hasStrongStellium?:   boolean;
};

const TIME_DEPENDENT: ModuleId[] = ["childhood", "career", "love", "purpose"];

export function computeConfidenceScore(moduleId: ModuleId, ctx: ConfidenceContext): number {
  let score = 100;

  if (!ctx.hasExactTime && TIME_DEPENDENT.includes(moduleId)) score -= 30;
  if (ctx.birthYear < 1900) score -= 10;
  if (ctx.birthYear < 1850) score -= 20;
  if (ctx.locationPrecisionKm > 50) score -= 5;
  if (ctx.hasStrongStellium) score += 5;

  return Math.max(40, Math.min(100, score));
}
