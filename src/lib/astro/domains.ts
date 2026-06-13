/**
 * Heuristic v1 mapping: WindowCategory → UI domain label + display meta.
 * Pending astrologer verification (§7 of koncepcja v6).
 * Finanse has no dedicated WindowCategory — returns null until verified.
 */

import type { TransitWindow, WindowCategory } from "./layers";

export type UIDomain = "Kariera" | "Relacje" | "Finanse" | "Energia" | "Decyzje";

export type DomainMeta = {
  label:    UIDomain;
  color:    string;    // hex — for tint backgrounds / border accents
  iconName: string;    // lucide-react icon name
};

// Amber-first; no violet/purple per design system
export const DOMAIN_META: Record<UIDomain, DomainMeta> = {
  Kariera: { label: "Kariera", color: "#E0B566", iconName: "Briefcase"  },
  Relacje: { label: "Relacje", color: "#E07A9F", iconName: "Heart"      },
  Finanse: { label: "Finanse", color: "#6BC4A0", iconName: "TrendingUp" },
  Energia: { label: "Energia", color: "#FFAE3D", iconName: "Zap"        },
  Decyzje: { label: "Decyzje", color: "#7BA4C9", iconName: "Compass"    },
};

/**
 * Returns the UIDomain for a window, or null when the signal is uncertain.
 * Null means: don't show a domain label (rather than showing a wrong one).
 */
export function windowToDomain(w: TransitWindow): UIDomain | null {
  const cat = w.category as WindowCategory;

  if (cat === "miłość")        return "Relacje";
  if (cat === "kariera")       return "Kariera";
  if (cat === "komunikacja")   return "Decyzje";
  if (cat === "transformacja") return "Energia";
  if (cat === "intuicja")      return "Relacje";

  if (cat === "energia") {
    // MC in the energia category signals career context
    if (w.natalPoint === "MC") return "Kariera";
    return "Energia";
  }

  return null;
}

// ─── Chip order for "Kiedy najlepiej?" (Faza 3) ───────────────────────────────
// Finanse is included here even though windowToDomain can't return it yet —
// the Faza 3 bestWindowForDomain engine will handle the Jowisz/Wenus heuristic.
export const WHEN_BEST_CHIPS: Array<{ domain: UIDomain | "Uważaj"; label: string; premium: boolean }> = [
  { domain: "Kariera",  label: "Nowy biznes",     premium: false },
  { domain: "Relacje",  label: "Miłość",           premium: false },
  { domain: "Finanse",  label: "Pieniądze",        premium: false },
  { domain: "Decyzje",  label: "Ważna rozmowa",    premium: false },
  { domain: "Energia",  label: "Odpoczynek",       premium: false },
  { domain: "Uważaj",   label: "Kiedy uważać",     premium: true  },
];
