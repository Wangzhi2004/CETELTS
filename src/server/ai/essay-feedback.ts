import { z } from "zod";

import { EssayFeedback } from "@/types/domain";

export const essayFeedbackSchema = z.object({
  overallScore: z.number(),
  summary: z.string(),
  dimensions: z.array(
    z.object({
      key: z.enum(["task_response", "coherence", "lexical_resource", "grammar"]),
      label: z.string(),
      score: z.number(),
    }),
  ),
  mistakes: z.array(
    z.object({
      title: z.string(),
      evidence: z.string(),
      suggestion: z.string(),
    }),
  ),
  suggestions: z.array(z.string()),
  nextActions: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  referenceRewrite: z.string().optional(),
});

const stableDimensions: EssayFeedback["dimensions"] = [
  { key: "task_response", label: "任务完成度", score: 0 },
  { key: "coherence", label: "结构与逻辑", score: 0 },
  { key: "lexical_resource", label: "词汇运用", score: 0 },
  { key: "grammar", label: "语法准确性", score: 0 },
];

export function normalizeEssayFeedback(
  feedback: z.infer<typeof essayFeedbackSchema>,
): EssayFeedback {
  const dimensionMap = new Map(feedback.dimensions.map((item) => [item.key, item]));

  return {
    ...feedback,
    dimensions: stableDimensions.map((dimension) => {
      const resolved = dimensionMap.get(dimension.key);
      return resolved ? resolved : dimension;
    }),
  };
}
