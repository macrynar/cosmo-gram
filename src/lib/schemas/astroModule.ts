import { z } from "zod";

export const TAG_REGEX = /^[a-ząćęłńóśźż]+$/;

export const VisualMeterSchema = z.object({
  label:     z.string().min(3).max(40),
  value:     z.number().int().min(0).max(100),
  archetype: z.string().min(3).max(80),
  category:  z.enum(["action", "emotion", "mind", "soul", "social"]),
});

export const AstroModuleSchema = z.object({
  id: z.enum(["core", "superpowers", "childhood", "love", "career", "shadows", "roots", "purpose"]),

  title: z.string().min(3).max(60),

  quote: z.string()
    .min(20).max(120)
    .refine(s => s.split(/\s+/).length <= 14, "Max 14 słów")
    .refine(s => !/twój\/twoja|swój\/swoja/i.test(s), "No slash-form"),

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

// Schema for AI output — without backend-injected fields
export const AstroModuleAIOutputSchema = AstroModuleSchema.omit({
  confidenceScore: true,
  isPremium:       true,
  cacheKey:        true,
  promptVersion:   true,
});

export type AstroModule        = z.infer<typeof AstroModuleSchema>;
export type AstroModuleAIOutput = z.infer<typeof AstroModuleAIOutputSchema>;
export type VisualMeter        = z.infer<typeof VisualMeterSchema>;
export type ModuleId           = AstroModule["id"];

export const ALL_MODULE_IDS: ModuleId[] = [
  "core", "superpowers", "childhood", "love", "career", "shadows", "roots", "purpose",
];
