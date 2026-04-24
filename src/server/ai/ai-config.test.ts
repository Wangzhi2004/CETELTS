import { describe, expect, it } from "vitest";

import {
  buildResponsesApiUrl,
  normalizeAiProviderSettings,
  redactAiProviderSettings,
} from "@/server/ai/ai-config";

describe("ai config", () => {
  it("normalizes partial settings with openai-compatible defaults", () => {
    const normalized = normalizeAiProviderSettings({
      apiKey: "sk-test",
    });

    expect(normalized.provider).toBe("openai-compatible");
    expect(normalized.baseURL).toBe("https://api.openai.com/v1");
    expect(normalized.model).toBe("gpt-5.2");
  });

  it("builds the responses endpoint from a base url", () => {
    expect(buildResponsesApiUrl("https://api.openai.com/v1")).toBe(
      "https://api.openai.com/v1/responses",
    );
    expect(buildResponsesApiUrl("https://example.com/proxy/v1/")).toBe(
      "https://example.com/proxy/v1/responses",
    );
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
