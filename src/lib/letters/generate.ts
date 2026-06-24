// Silnik generacji listu/raportu: resolver → prompt (pseudonimizowany) → Sonnet →
// walidacja → metadane. Treść NIGDY nie trafia do ai_call_logs (aiComplete loguje
// tylko metadane). Cache i zapis do user_letters robi warstwa store (Faza 3/5).

import { aiComplete } from "@/lib/deepseek";
import { resolvePromptVersion, renderTemplate } from "@/lib/promptResolver";
import { resolvePlacements } from "@/lib/letters/resolver";
import { correctLetterText } from "@/lib/letters/correct";
import { validateLetterContent, type LetterValidation } from "@/lib/letters/validate";
import { formDirective, DEFAULT_FORM, type GrammaticalForm } from "@/lib/letters/form";
import type { NatalChart } from "@/lib/astro-types";
import type { LetterTemplate } from "@/types/letters";

export class LetterGenerationError extends Error {
  constructor(msg: string) { super(msg); this.name = "LetterGenerationError"; }
}

export interface GeneratedLetter {
  content_md: string;
  model: string;
  ai_prompt_version: string;
  prompt_version_id: string;
  placement_snapshot: Record<string, unknown>;
  signature_label: string;
  validation: LetterValidation;
}

// Wybór fixture pod AI_MOCK — kształt zależny od rodzaju i poziomu wellbeing.
function mockFixtureFor(t: LetterTemplate): string {
  if (t.kind === "report") return "letters/report.md";
  if (t.wellbeing_level === "delikatny") return "letters/delikatny.md";
  return "letters/standard.md";
}

export async function generateLetterContent(params: {
  template: LetterTemplate;
  chart: NatalChart;
  userId: string;
  modelOverride?: string;
  /** Listy eventowe: deterministyczne fakty tranzytu do zacytowania (z events.ts). */
  eventContext?: string;
  /** Forma gramatyczna usera (rodzaj copy). Domyślnie męska. */
  grammaticalForm?: GrammaticalForm;
}): Promise<GeneratedLetter> {
  const { template, chart, userId } = params;
  const grammaticalForm = params.grammaticalForm ?? DEFAULT_FORM;

  const resolved = resolvePlacements(chart, template.placement_inputs);
  const eventContext = params.eventContext?.trim();
  if (!resolved.text.trim() && !eventContext) {
    throw new LetterGenerationError(`Brak fundamentu dla ${template.slug}`);
  }
  const placementsText = [formDirective(grammaticalForm), resolved.text, eventContext].filter(Boolean).join("\n\n");

  const version = await resolvePromptVersion(template.prompt_slug, userId);
  if (!version) {
    throw new LetterGenerationError(`Brak aktywnego promptu „${template.prompt_slug}" w prompt_versions`);
  }

  const model = params.modelOverride ?? version.config.model ?? "claude-sonnet-4-6";
  const maxTokens = version.config.max_tokens ?? (template.kind === "report" ? 4000 : 1400);
  const baseUser = renderTemplate(version.user_prompt_template, {
    title: template.title,
    placements: placementsText,
  });

  const mockFixture = mockFixtureFor(template);
  let best = "";
  let validation: LetterValidation = { ok: false, reasons: ["nie wygenerowano"], words: 0 };

  // Do 3 podejść: kolejne z notką korygującą wg powodów walidacji (tylko gdy walidacja zawiedzie).
  for (let attempt = 0; attempt < 3; attempt++) {
    const userPrompt = attempt === 0
      ? baseUser
      : `${baseUser}\n\nPOPRZEDNIA WERSJA MIAŁA PROBLEMY: ${validation.reasons.join("; ")}. Popraw i napisz list jeszcze raz, trzymając się głosu i struktury.`;

    const raw = await aiComplete({
      model,
      system: version.system_prompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens,
      task: `letter:${template.slug}`,
      mockFixture,
    });

    // Korekta językowa (egzekwuje wybraną formę) PRZED walidacją — wzór z natalu.
    const content = await correctLetterText((raw ?? "").trim(), grammaticalForm);
    validation = validateLetterContent(content, {
      wordMin: template.word_min,
      wordMax: template.word_max,
      kind: template.kind,
      isEvent: template.trigger_type === "event",
    });

    if (content) best = content;
    if (validation.ok) break;
  }

  if (!best) throw new LetterGenerationError(`Pusty output dla ${template.slug}`);

  return {
    content_md: best,
    model,
    ai_prompt_version: `${template.prompt_slug}@${version.version}`,
    prompt_version_id: version.id,
    placement_snapshot: eventContext ? { ...resolved.snapshot, event_context: eventContext } : resolved.snapshot,
    signature_label: resolved.signatureLabel,
    validation,
  };
}
