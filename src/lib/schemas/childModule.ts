import { z } from "zod";
import { TAG_REGEX, VisualMeterSchema } from "./astroModule";

export const ChildModuleSchema = z.object({
  id: z.enum(["temperament", "emotions", "learning", "talents", "parenting", "peers"]),

  title: z.string().min(3).max(60),

  quote: z.string()
    .min(40, "Cytat min 40 znaków")
    .max(90,  "Cytat max 90 znaków")
    .refine(s => !s.endsWith("."),  "Cytat nie kończy się kropką")
    .refine(s => !s.includes("?"),  "Cytat bez znaku zapytania"),

  content: z.string()
    .refine(s => s.split(/\s+/).length >= 200, "Too short, min 200 words")
    .refine(s => s.split(/\s+/).length <= 550, "Too long, max 550 words")
    .refine(
      s => !/\b(IC|MC|ASC|DSC|orb|dyspozytor|retrogradacj|kwadratura|trygon|sekstyl|koniunkcja|opozycja)\b/i.test(s),
      "No astro jargon"
    ),

  tactics: z.array(z.string().min(20).max(140)).length(3),

  tags: z.array(
    z.string().regex(TAG_REGEX, "PL lowercase letters only").min(3).max(20)
  ).length(4),

  visualMeters: z.array(VisualMeterSchema).length(3),

  confidenceScore: z.number().int().min(40).max(100),
  isPremium:       z.boolean(),
  cacheKey:        z.string(),
  promptVersion:   z.string(),
});

export const ChildModuleAIOutputSchema = ChildModuleSchema.omit({
  confidenceScore: true,
  isPremium:       true,
  cacheKey:        true,
  promptVersion:   true,
});

export type ChildModule        = z.infer<typeof ChildModuleSchema>;
export type ChildModuleAIOutput = z.infer<typeof ChildModuleAIOutputSchema>;
export type ChildModuleId      = ChildModule["id"];

export const ALL_CHILD_MODULE_IDS: ChildModuleId[] = [
  "temperament", "emotions", "learning", "talents", "parenting", "peers",
];

export const CHILD_MODULE_SPECS: Record<ChildModuleId, { title: string; shortName: string; isPremium: boolean }> = {
  temperament: { title: "Temperament",              shortName: "Temperament", isPremium: false },
  emotions:    { title: "Świat emocji",             shortName: "Emocje",      isPremium: true  },
  learning:    { title: "Jak poznaje świat",        shortName: "Poznawanie",  isPremium: true  },
  talents:     { title: "Talenty i mocne strony",   shortName: "Talenty",     isPremium: true  },
  parenting:   { title: "Wskazówki dla rodzica",    shortName: "Rodzic",      isPremium: true  },
  peers:       { title: "Relacje z rówieśnikami",   shortName: "Rówieśnicy",  isPremium: true  },
};
