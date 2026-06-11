// getDayIntensity kept for potential future use; getDayClass and DAY_CLASS_LABEL removed (dead code).
export function getDayIntensity(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 10) return 5;
  if (score >= 7)  return 4;
  if (score >= 5)  return 3;
  if (score >= 3)  return 2;
  return 1;
}
