// Szacowanie kosztu wywołań AI (monitoring §2.8). Ceny katalogowe Anthropic
// w USD za 1M tokenów (stan: model). Zmiana cennika modelu = edycja tu.
//
//   claude-sonnet-4-6   → $3 / $15  (input / output)
//   claude-haiku-4-5    → $1 / $5
//
// To koszt do dashboardu marży, nie do faktur — liczone z input/output_tokens
// w ai_call_logs. Nieznane modele wpadają w DEFAULT (Sonnet, ostrożnie wyżej).

type ModelPrice = { inPerM: number; outPerM: number };

const MODEL_PRICES: Record<string, ModelPrice> = {
  "claude-sonnet-4-6": { inPerM: 3, outPerM: 15 },
  "claude-haiku-4-5":  { inPerM: 1, outPerM: 5 },
};

// Fallback dla wariantów z sufiksem daty (np. claude-haiku-4-5-20251001)
// lub modeli spoza mapy — dopasuj po prefiksie, w ostateczności Sonnet.
function priceFor(model: string): ModelPrice {
  if (MODEL_PRICES[model]) return MODEL_PRICES[model];
  if (model.startsWith("claude-haiku")) return MODEL_PRICES["claude-haiku-4-5"];
  if (model.startsWith("claude-sonnet")) return MODEL_PRICES["claude-sonnet-4-6"];
  return MODEL_PRICES["claude-sonnet-4-6"];
}

/** Koszt jednego wywołania w USD na podstawie modelu i liczby tokenów. */
export function estimateAiCostUsd(
  model: string,
  inputTokens?: number | null,
  outputTokens?: number | null,
): number {
  const p = priceFor(model);
  return ((inputTokens ?? 0) / 1_000_000) * p.inPerM
       + ((outputTokens ?? 0) / 1_000_000) * p.outPerM;
}
