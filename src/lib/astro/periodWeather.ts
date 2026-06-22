/**
 * Period weather — one coherent reading for the Prognoza header card.
 *
 * Pure, no React, no I/O — so it can be unit-tested directly.
 *
 * The bug this replaces: the header mashed together three values from unrelated
 * sources — intensity bars = window COUNT, character tag = favourability, and the
 * background graphic = mood — so a day with one weak window showed "1 bar +
 * napięty + a vivid intense orb". Three signals, three contradictory stories.
 *
 * Here a single computation drives all of it:
 *   intensity → how astrologically loud the period is (peak score + density)
 *   tone      → calm | good | tense | mixed, forced "calm" at the lowest level
 *   orb       → hero graphic, a 5-step energy ramp keyed to INTENSITY (not tone)
 *   opacity   → vividness scales with intensity (faint at 1, vivid at 5)
 */

export type PeriodTone = "calm" | "good" | "tense" | "mixed";

// The hero orb is a 5-step energy ramp keyed to INTENSITY (level 1 → 5) — one
// artwork per level, a neutral "how much is happening" gauge. Tone (sprzyja /
// wymaga) is NOT in the orb; it lives in the bar colour + the description line.
export function intensityOrb(intensity: number): string {
  const i = Math.max(1, Math.min(5, Math.round(intensity)));
  return `/assets/prognoza/intensity-${i}.png`;
}

export type PeriodWeather = {
  intensity: number;     // 1–5 — the only thing the gauge shows (always gold)
  tone:      PeriodTone;  // drives the description sentence only (not any colour)
};

// The gauge is labelled "INTENSYWNOŚĆ", so the word under the bars names the
// LEVEL — never the tone. Tone-neutral on purpose: a loud period can be good or
// demanding (that nuance lives in the bar colour + the description sentence).
const INTENSITY_LABEL = ["minimalna", "niska", "średnia", "wysoka", "maksymalna"];

export function intensityLabel(intensity: number): string {
  const i = Math.max(1, Math.min(5, Math.round(intensity)));
  return INTENSITY_LABEL[i - 1];
}

export type WeatherItem = { score: number; favorable: boolean };

/**
 * Collapses a period's transit windows (or seasons) into one coherent weather
 * reading. `refMax` is the score that counts as full intensity; `denseAt` is the
 * item count that bumps a busy period up one level.
 *   windows (fast planets):  { refMax: 90,  denseAt: 4 }   (Month uses denseAt 6)
 *   seasons (slow planets):  { refMax: 150, denseAt: 3 }
 */
export function summarizePeriodWeather(
  items: WeatherItem[],
  opts: { refMax: number; denseAt: number } = { refMax: 90, denseAt: 4 },
): PeriodWeather {
  if (items.length === 0) {
    return { intensity: 1, tone: "calm" };
  }

  const peak = Math.max(...items.map(i => i.score));
  const norm = Math.min(1, peak / opts.refMax);
  let intensity =
    norm >= 0.85 ? 5 :
    norm >= 0.62 ? 4 :
    norm >= 0.42 ? 3 :
    norm >= 0.22 ? 2 : 1;
  if (items.length >= opts.denseAt) intensity = Math.min(5, intensity + 1);

  const unfav = items.filter(i => !i.favorable).length;
  const fav   = items.length - unfav;
  const total = unfav + fav;

  // "mixed" only when genuinely balanced — a clear majority (≥60%) leans to its
  // own tone, so the graphic matches what the day-grid shows (e.g. a month that's
  // mostly tense days reads tense, not a washed-out "mixed").
  let tone: PeriodTone;
  if (intensity <= 1)            tone = "calm";   // quiet period always reads calm
  else if (unfav === 0)          tone = "good";
  else if (fav === 0)            tone = "tense";
  else if (unfav / total >= 0.6) tone = "tense";
  else if (fav   / total >= 0.6) tone = "good";
  else                           tone = "mixed";

  return { intensity, tone };
}

/**
 * Vividness of the background orb. The orb IMAGE already escalates with the level
 * (sparse → dense), so this is a gentle reinforcement with a visible floor — even
 * level 1 stays clearly present (never looks like a broken/empty image).
 */
export function orbOpacity(intensity: number): number {
  const i = Math.max(1, Math.min(5, Math.round(intensity)));
  return Math.round((0.66 + (i - 1) * 0.04) * 100) / 100;
}

/**
 * Deterministic one-line description for the header (shown until the AI reading
 * is generated, and always for free users) — never a fake "Ładowanie…".
 */
export function characterLine(w: PeriodWeather, count: number): string {
  switch (w.tone) {
    case "good":  return "Sprzyjający okres — energia układa się po Twojej myśli.";
    case "tense": return "Wymagający okres — warto uważać i nie forsować.";
    case "mixed": return "Mieszany okres — i wsparcie, i napięcia naraz.";
    default:      return count === 0
      ? "Spokojny okres — niewiele wyraźnych wpływów."
      : "Łagodny okres — bez mocnych zwrotów.";
  }
}

// ─── Polish pluralisation ─────────────────────────────────────────────────────

function plForm(n: number, one: string, few: string, many: string): string {
  const last = n % 10, last2 = n % 100;
  if (n === 1) return one;
  if (last >= 2 && last <= 4 && !(last2 >= 12 && last2 <= 14)) return few;
  return many;
}
export const plOkno  = (n: number) => plForm(n, "okno",  "okna",   "okien");
export const plSezon = (n: number) => plForm(n, "sezon", "sezony", "sezonów");
