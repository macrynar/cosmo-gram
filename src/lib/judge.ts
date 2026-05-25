import { deepSeekChat } from "@/lib/deepseek";

const JUDGE_SYSTEM = `Jesteś krytycznym ewaluatorem astrologicznych interpretacji generowanych przez AI. Oceniasz w skali 1-5 (1=fatalne, 5=znakomite) na pięciu wymiarach:

1. ACCURACY — czy interpretacja faktycznie odzwierciedla podane dane astrologiczne (nie generyczne)
2. ENGAGEMENT — czy chce się czytać dalej — mocne metafory, niebanalne obrazy
3. SPECIFICITY — konkret do tej osoby vs uogólnienia widoczne dla każdego użytkownika
4. NO_JARGON — zero "orb", "dyspozytor", "retrograde", "MC", "IC", "trygon", "kwadratura", "sekstyl" — chyba że natychmiast wyjaśnione
5. GRAMMAR — zero slash-form ("oddałeś/aś"), spójna forma gramatyczna z deklarowaną

Output STRICTLY jako JSON (żaden inny tekst):
{
  "accuracy": <1-5>,
  "engagement": <1-5>,
  "specificity": <1-5>,
  "no_jargon": <1-5>,
  "grammar": <1-5>,
  "reasoning": "<2-3 zdania konkretnego uzasadnienia po polsku>"
}`;

export type JudgeScores = {
  accuracy: number;
  engagement: number;
  specificity: number;
  no_jargon: number;
  grammar: number;
};

export type JudgeResult = {
  scores: JudgeScores;
  reasoning: string;
  overall: number;
  judge_model: string;
};

export async function judgeReading(
  rawInput: unknown,
  generatedOutput: string,
  grammaticalForm: string
): Promise<JudgeResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY missing");

  const userPrompt = `Dane astrologiczne (input do AI):
${JSON.stringify(rawInput, null, 2)}

Deklarowana forma gramatyczna: ${grammaticalForm}

Wygenerowana interpretacja:
"""
${generatedOutput.slice(0, 6000)}
"""

Oceń. Zwróć tylko JSON.`;

  const raw = await deepSeekChat({
    apiKey,
    system: JUDGE_SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 600,
    temperature: 0.2,
    responseFormat: "json_object",
  });

  const parsed = JSON.parse(raw) as JudgeScores & { reasoning: string };
  const { reasoning, ...scores } = parsed;
  const overall =
    Math.round(
      ((scores.accuracy + scores.engagement + scores.specificity + scores.no_jargon + scores.grammar) /
        5) *
        10
    ) / 10;

  return {
    scores,
    reasoning,
    overall,
    judge_model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
  };
}
