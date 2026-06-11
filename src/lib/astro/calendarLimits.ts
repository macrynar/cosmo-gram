/**
 * Absolutne progi kalibracyjne kalendarza.
 *
 * Progi wyznaczone analitycznie ze wzoru computeScore():
 *   score = transitPlanetWeight × aspectWeight × natalPointWeight × orbFactor
 *
 * Przykłady przy MIN_SCORE=15:
 *   Mars×trine×Moon (orb=0.5)   → 4×2×5×0.5 = 20  ✓ widoczne
 *   Jupiter×sextile×Sun (orb=0.5)→ 7×1×5×0.5 = 17.5 ✓ widoczne
 *   Saturn×square×Venus (orb=1) → 8×3×3×0.67 = 48  ✓ widoczne
 *   Mars×sextile×Moon (orb=0.5) → 4×1×5×0.5 = 10  ✗ filtrowane
 *
 * Aby przeliczać progi empirycznie uruchom: npx tsx scripts/calibrate-calendar.ts
 */

/** Minimalny score tranzytowego okna, żeby trafił do kalendarza */
export const WINDOW_MIN_SCORE = 15;

/** Ile okien per miesiąc jest oznaczonych ★ (Dzień Mocy = peak okna) */
export const POWER_WINDOWS_PER_MONTH = 5;

/** Sanity cap: nigdy więcej niż tyle ★ w miesiącu */
export const POWER_DAY_SANITY_CAP = 8;
