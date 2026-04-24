import { describe, expect, it } from "vitest";

import { buildResponsesRequestBody } from "@/server/ai/openai-compatible";

describe("openai-compatible responses", () => {
  it("builds a structured json_schema responses payload", () => {
    const body = buildResponsesRequestBody({
      model: "gpt-5.2",
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

    expect(body.model).toBe("gpt-5.2");
    expect(body.instructions).toBe("You are a teacher.");
    expect(body.input).toBe("Explain why this task is first.");
    expect(body.text.format.type).toBe("json_schema");
    expect(body.text.format.name).toBe("teacher_message_bundle");
  });

  it("includes previous_response_id when present for multi-turn memory", () => {
    const body = buildResponsesRequestBody({
      model: "gpt-5.2",
      instructions: "You are a teacher.",
      input: "Explain the replan.",
      schemaName: "teacher_message_bundle",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
        },
        required: ["summary"],
      },
      previousResponseId: "resp_123",
    });

    expect(body.previous_response_id).toBe("resp_123");
  });
});
