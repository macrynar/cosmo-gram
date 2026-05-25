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
  "reasoning": "<1 krótkie zdanie uzasadnienia po polsku>"
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

  // Trim chart_data to avoid blowing up the context — only first 500 chars needed for reference
  const inputSummary = JSON.stringify(rawInput).slice(0, 500);

  const userPrompt = `Dane astrologiczne (skrót): ${inputSummary}

Forma gramatyczna: ${grammaticalForm}

Interpretacja do oceny:
"""
${generatedOutput.slice(0, 3000)}
"""

Oceń. Zwróć tylko JSON.`;

  const callParams = {
    apiKey,
    system: JUDGE_SYSTEM,
    messages: [{ role: "user" as const, content: userPrompt }],
    maxTokens: 2000,
    temperature: 0.2,
    responseFormat: "json_object" as const,
  };

  let raw = await deepSeekChat(callParams);
  if (!raw) raw = await deepSeekChat(callParams); // one retry on empty
  if (!raw) throw new Error("DeepSeek zwrócił pustą odpowiedź po retry");

  let parsed: JudgeScores & { reasoning: string };
  try {
    parsed = JSON.parse(raw) as JudgeScores & { reasoning: string };
  } catch {
    throw new Error(`JSON parse failed. Raw: ${raw.slice(0, 200)}`);
  }
  const { reasoning = "", ...scores } = parsed;
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
