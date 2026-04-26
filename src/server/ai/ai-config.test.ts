import { describe, expect, it } from "vitest";

import {
  normalizeAiProviderSettings,
  redactAiProviderSettings,
} from "@/server/ai/ai-config";

describe("ai config", () => {
  it("normalizes partial settings with openai-compatible defaults", () => {
    const normalized = normalizeAiProviderSettings({
      apiKey: "sk-test",
    });

    expect(normalized.provider).toBe("openai-compatible");
    expect(normalized.baseURL).toBe("https://dashscope.aliyuncs.com/compatible-mode/v1");
    expect(normalized.model).toBe("glm-5");
  });

  it("redacts the api key in settings payloads", () => {
    const redacted = redactAiProviderSettings(
      normalizeAiProviderSettings({
        apiKey: "sk-1234567890",
      }),
    );

    expect(redacted.apiKey).toContain("****");
    expect(redacted.apiKey).not.toContain("1234567890");
  });
});
