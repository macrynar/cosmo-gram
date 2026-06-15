import { z } from "zod";
import { VisualMeterSchema } from "./astroModule";

export const ChildModuleSchema = z.object({
  id: z.enum(["temperament", "emotions", "learning", "talents", "parenting", "peers"]),

  title: z.string().min(1).max(80),

  quote: z.string().min(10).max(140),

  content: z.string().min(50),

  tactics: z.array(z.string().min(5).max(300)).min(1).max(6),

  tags: z.array(z.string().min(2).max(30)).min(2).max(8),

  visualMeters: z.array(VisualMeterSchema).min(1).max(5),

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
