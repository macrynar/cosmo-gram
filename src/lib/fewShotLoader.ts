import { supabaseAdmin } from "@/lib/supabase-server";

type FewShotExemplar = {
  input: unknown;
  output: string;
};

export async function loadFewShots(
  promptName: string,
  count: number
): Promise<FewShotExemplar[]> {
  if (count <= 0) return [];

  const { data } = await supabaseAdmin
    .from("few_shot_exemplars")
    .select("input_data, output_markdown")
    .eq("prompt_name", promptName)
    .eq("active", true)
    .order("quality_score", { ascending: false })
    .limit(count * 3);

  if (!data || data.length === 0) return [];

  // Random sample from top results
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((e) => ({
    input: e.input_data,
    output: e.output_markdown as string,
  }));
}

export function buildFewShotBlock(exemplars: FewShotExemplar[]): string {
  if (exemplars.length === 0) return "";
  return (
    "\n\nPrzykłady wzorcowych interpretacji:\n\n" +
    exemplars
      .map(
        (e, i) =>
          `--- PRZYKŁAD ${i + 1} ---\nInput: ${JSON.stringify(e.input)}\nOutput:\n${e.output}\n`
      )
      .join("\n") +
    "\n---\nTeraz wygeneruj interpretację dla:\n"
  );
}
