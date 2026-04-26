import { describe, expect, it } from "vitest";

import { buildChatCompletionRequestBody, buildChatCompletionUrl } from "@/server/ai/openai-compatible";

describe("openai-compatible chat completions", () => {
  it("builds a structured json_schema chat completion payload", () => {
    const body = buildChatCompletionRequestBody({
      model: "glm-5",
      instructions: "You are a teacher.",
      input: "Explain why this task is first.",
      schemaName: "teacher_message_bundle",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
        },
        required: ["summary"],
      },
    });

    expect(body.model).toBe("glm-5");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[1].role).toBe("user");
    expect(body.messages[1].content).toBe("Explain why this task is first.");
    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("builds the chat completions endpoint from a base url", () => {
    expect(buildChatCompletionUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")).toBe(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    );
    expect(buildChatCompletionUrl("https://example.com/proxy/v1/")).toBe(
      "https://example.com/proxy/v1/chat/completions",
    );
  });
});
