import { type AiProviderSettings } from "@/server/ai/ai-config";

type ChatCompletionRequestInput = {
  model: string;
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
};

export function buildChatCompletionRequestBody(input: ChatCompletionRequestInput) {
  return {
    model: input.model,
    messages: [
      {
        role: "system",
        content: `${input.instructions}\n\nYou must respond with valid JSON matching this schema: ${JSON.stringify(input.schema)}. Do not include any text outside the JSON object.`,
      },
      {
        role: "user",
        content: input.input,
      },
    ],
    response_format: { type: "json_object" },
  };
}

export function buildChatCompletionUrl(baseURL: string) {
  return `${baseURL.replace(/\/+$/, "")}/chat/completions`;
}

export async function callAIForStructuredOutput<T>(
  settings: AiProviderSettings,
  input: ChatCompletionRequestInput,
): Promise<{ data: T }> {
  const url = buildChatCompletionUrl(settings.baseURL);
  const body = buildChatCompletionRequestBody(input);

  console.log("[AI] Calling", url, "model:", input.model);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chat Completions API request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Chat Completions API returned no content in choices[0].message");
  }

  return {
    data: JSON.parse(content) as T,
  };
}