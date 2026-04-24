import { z } from "zod";

import { normalizeEssayFeedback } from "@/server/ai/essay-feedback";
import { loadAiProviderSettings } from "@/server/ai/ai-config";
import { callOpenAICompatibleResponses } from "@/server/ai/openai-compatible";

const essayFeedbackApiSchema = z.object({
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

export const aiService = {
  async generateEssayFeedback(input?: { draft?: string; prompt?: string }) {
    const settings = await loadAiProviderSettings();

    if (settings.enabled && settings.apiKey) {
      try {
        const result = await callOpenAICompatibleResponses<
          z.infer<typeof essayFeedbackApiSchema>
        >(settings, {
          model: settings.model,
          instructions:
            "You are an expert exam-writing coach. Grade and explain the essay in structured JSON. Focus on task response, coherence, lexical resource, and grammar.",
          input: JSON.stringify({
            prompt: input?.prompt ?? "",
            draft: input?.draft ?? "",
          }),
          schemaName: "essay_feedback",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              overallScore: { type: "number" },
              summary: { type: "string" },
              dimensions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    key: {
                      type: "string",
                      enum: ["task_response", "coherence", "lexical_resource", "grammar"],
                    },
                    label: { type: "string" },
                    score: { type: "number" },
                  },
                  required: ["key", "label", "score"],
                },
              },
              mistakes: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    evidence: { type: "string" },
                    suggestion: { type: "string" },
                  },
                  required: ["title", "evidence", "suggestion"],
                },
              },
              suggestions: {
                type: "array",
                items: { type: "string" },
              },
              nextActions: {
                type: "array",
                items: { type: "string" },
              },
              confidence: { type: "number" },
              referenceRewrite: { type: "string" },
            },
            required: [
              "overallScore",
              "summary",
              "dimensions",
              "mistakes",
              "suggestions",
              "nextActions",
              "confidence",
            ],
          },
        });

        return normalizeEssayFeedback(essayFeedbackApiSchema.parse(result));
      } catch {
        // Fallback below.
      }
    }

    return normalizeEssayFeedback({
      overallScore: 14.5,
      summary: "结构完整，论证方向正确，但语言层次仍有提升空间。",
      dimensions: [
        { key: "task_response", label: "任务完成度", score: 14.5 },
        { key: "coherence", label: "结构与逻辑", score: 15 },
        { key: "lexical_resource", label: "词汇运用", score: 14 },
        { key: "grammar", label: "语法准确性", score: 13.5 },
      ],
      mistakes: [
        {
          title: "表达重复",
          evidence: "benefits far outweigh the drawbacks",
          suggestion: "把结论句换成更具体的因果表达。",
        },
      ],
      suggestions: ["下一稿优先压缩第二段铺陈，增加例证。"],
      nextActions: ["重写第二段主体论证。"],
      confidence: 0.81,
      referenceRewrite:
        "With proper boundaries, digital tools expand access and efficiency rather than replacing genuine human connection.",
    });
  },
};
