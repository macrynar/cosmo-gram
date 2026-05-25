type DeepSeekRole = "system" | "user" | "assistant";

type DeepSeekMessage = {
  role: DeepSeekRole;
  content: string;
};

type DeepSeekChatParams = {
  apiKey: string;
  system?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  responseFormat?: "json_object";
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function deepSeekChat({
  apiKey,
  system,
  messages,
  maxTokens,
  temperature,
  model,
  responseFormat,
}: DeepSeekChatParams): Promise<string> {
  const finalMessages: DeepSeekMessage[] = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model ?? process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      messages: finalMessages,
      ...(typeof maxTokens === "number" ? { max_tokens: maxTokens } : {}),
      ...(typeof temperature === "number" ? { temperature } : {}),
      ...(responseFormat ? { response_format: { type: responseFormat } } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as DeepSeekResponse;
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
