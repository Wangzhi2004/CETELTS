import { describe, expect, it } from "vitest";

import {
  essayFeedbackSchema,
  normalizeEssayFeedback,
} from "@/server/ai/essay-feedback";

describe("essay feedback schema", () => {
  it("normalizes structured ai feedback into stable dimensions", () => {
    const parsed = normalizeEssayFeedback(
      essayFeedbackSchema.parse({
        overallScore: 14.5,
        summary: "论证结构完整，但语言表达仍有重复。",
        dimensions: [
          { key: "task_response", label: "任务完成度", score: 15 },
          { key: "coherence", label: "结构与逻辑", score: 14 },
        ],
        mistakes: [
          {
            title: "词汇重复",
            evidence: "benefits far outweigh the drawbacks",
            suggestion: "替换为更具体的表达。",
          },
        ],
        suggestions: ["下一篇练习重点压缩句式重复。"],
        nextActions: ["重写第二段论证展开。"],
        confidence: 0.82,
      }),
    );

    expect(parsed.dimensions).toHaveLength(4);
    expect(parsed.dimensions[2]).toEqual(
      expect.objectContaining({
        key: "lexical_resource",
        score: 0,
      }),
    );
    expect(parsed.nextActions[0]).toContain("重写");
  });
});
