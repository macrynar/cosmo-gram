import { z } from "zod";

export const PersonalHoroscopeAIOutputSchema = z.object({
  headline:   z.string().max(80),
  main:       z.string().min(100),   // min 2 akapity
  reflection: z.string().max(300),
  weather: z.object({
    intensity: z.number().int().min(1).max(5),
    element:   z.string(),
    character: z.string(),
  }),
});

export type PersonalHoroscopeAIOutput = z.infer<typeof PersonalHoroscopeAIOutputSchema>;

// Validate AI output contains ≥2 references to natal chart specifics
// (planet names, signs, aspect names from the transit data)
export function hasConcreteReferences(output: PersonalHoroscopeAIOutput, transitContext: string): boolean {
  const text = output.main + " " + output.headline;
  const natalTerms = extractNatalTerms(transitContext);
  const matches = natalTerms.filter(term => text.toLowerCase().includes(term.toLowerCase()));
  return matches.length >= 2;
}

function extractNatalTerms(transitContext: string): string[] {
  const signs = ["Baran","Byk","Bliźnięta","Rak","Lew","Panna","Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby"];
  const planets = ["Słońce","Księżyc","Merkury","Wenus","Mars","Jowisz","Saturn","Uran","Neptun","Pluton","ASC","MC"];
  const aspects = ["koniunkcja","opozycja","kwadratura","trygon","sekstyl"];

  const terms: string[] = [];
  for (const sign of signs)   if (transitContext.includes(sign))   terms.push(sign);
  for (const planet of planets) if (transitContext.includes(planet)) terms.push(planet);
  for (const aspect of aspects) if (transitContext.includes(aspect)) terms.push(aspect);
  return terms;
}
