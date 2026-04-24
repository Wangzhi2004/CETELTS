import { buildResponsesApiUrl, type AiProviderSettings } from "@/server/ai/ai-config";

type ResponsesRequestInput = {
  model: string;
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
  previousResponseId?: string;
};

export function buildResponsesRequestBody(input: ResponsesRequestInput) {
  return {
    model: input.model,
    instructions: input.instructions,
    input: input.input,
    ...(input.previousResponseId && {
      previous_response_id: input.previousResponseId,
    }),
    text: {
      format: {
        type: "json_schema",
        name: input.schemaName,
        schema: input.schema,
        strict: true,
      },
    },
    store: false,
  };
}

export async function callOpenAICompatibleResponses<T>(
  settings: AiProviderSettings,
  input: ResponsesRequestInput,
): Promise<{ data: T; responseId?: string }> {
  const response = await fetch(buildResponsesApiUrl(settings.baseURL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(buildResponsesRequestBody(input)),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Responses API request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as { id?: string; output_text?: string };
  if (!payload.output_text) {
    throw new Error("Responses API returned no output_text");
  }

  return {
    data: JSON.parse(payload.output_text) as T,
    responseId: payload.id,
  };
}
