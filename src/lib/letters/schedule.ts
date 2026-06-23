// Pure'owa logika dripu — KOD decyduje, kto „due". Bez DB, więc testowalna.
//
// Model „frontier": listy są sekwencyjne (sort_order). Frontier = pierwszy list,
// który NIE został jeszcze dostarczony. Operujemy tylko na nim:
//   - pre-generacja, gdy dzień dostarczenia jest w oknie (24-48 h przed),
//   - dostarczenie, gdy dzień nadszedł I minął min. odstęp od ostatniego listu.
// Dyscyplina częstotliwości (≥7 dni między dostawami) sama rozkłada nadrabianie
// zaległości u istniejących płatników: 1 list / tydzień, nigdy zrzut naraz.

export const PREGEN_DAYS = 2;
export const MIN_GAP_DAYS = 7;
const DAY_MS = 86_400_000;

export interface DripTemplateLite {
  slug: string;
  days_from_natal: number;
  sort_order: number;
}

export interface DripExistingLite {
  slug: string;
  status: "scheduled" | "generated" | "delivered" | "read";
}

export interface DripPlan {
  slug: string;
  deliverAt: string; // ISO — docelowy dzień dostarczenia
  create: boolean;   // brak wiersza → utwórz (scheduled)
  deliver: boolean;  // dzień nadszedł i odstęp pozwala → dostarcz
}

export function planDripAction(params: {
  templates: DripTemplateLite[];
  existing: DripExistingLite[];
  anchor: Date;            // data wygenerowania kosmogramu (start zegara retencji)
  now: Date;
  lastDeliveredAt: Date | null;
  pregenDays?: number;
  minGapDays?: number;
}): DripPlan | null {
  const { templates, existing, anchor, now } = params;
  const pregenDays = params.pregenDays ?? PREGEN_DAYS;
  const minGapDays = params.minGapDays ?? MIN_GAP_DAYS;

  const bySlug = new Map(existing.map((e) => [e.slug, e]));
  const ordered = [...templates].sort((a, b) => a.sort_order - b.sort_order);

  // Frontier: pierwszy szablon bez wiersza lub niedostarczony.
  const frontier = ordered.find((t) => {
    const row = bySlug.get(t.slug);
    return !row || (row.status !== "delivered" && row.status !== "read");
  });
  if (!frontier) return null;

  const dueDay = new Date(anchor.getTime() + frontier.days_from_natal * DAY_MS);
  if (dueDay.getTime() > now.getTime() + pregenDays * DAY_MS) return null; // jeszcze za wcześnie

  const freqOK =
    !params.lastDeliveredAt ||
    now.getTime() - params.lastDeliveredAt.getTime() >= minGapDays * DAY_MS;

  return {
    slug: frontier.slug,
    deliverAt: dueDay.toISOString(),
    create: !bySlug.has(frontier.slug),
    deliver: dueDay.getTime() <= now.getTime() && freqOK,
  };
}
