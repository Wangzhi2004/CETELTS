import { z } from "zod";

import { loadAiProviderSettings } from "@/server/ai/ai-config";
import { callOpenAICompatibleResponses } from "@/server/ai/openai-compatible";
import {
  compactTeacherConversation,
  getTeacherConversationSummary,
  getTeacherPreviousResponseId,
  saveTeacherConversationSummary,
  saveTeacherPreviousResponseId,
} from "@/server/ai/teacher-memory";
import { buildTeacherMessages } from "@/server/services/score-center-runtime";
import type { ScoreCenterState, TeacherMessage } from "@/types/domain";

const teacherEvidenceSchema = z.object({
  source: z.enum([
    "weight_breakdown",
    "diagnostic",
    "review_queue",
    "conversation_summary",
    "teacher_thread",
  ]),
  cardId: z.string().optional(),
  signal: z.string(),
  quote: z.string(),
  confidence: z.number().min(0).max(1),
  actionBinding: z.string(),
});

export const teacherBundleSchema = z.object({
  briefing: z.string(),
  update: z.string(),
  evidenceUsed: z.array(teacherEvidenceSchema).min(1).max(6),
  decisionSummary: z.array(z.string()).min(2).max(4),
});

export function buildTeacherEvidenceInput(input: {
  cards: Array<
    Pick<
      ScoreCenterState["cards"][number],
      | "cardId"
      | "cardType"
      | "title"
      | "whyThisNow"
      | "expectedImpact"
      | "targetSkills"
      | "status"
      | "weightBreakdown"
    >
  >;
  evidenceSnippets?: string[];
  memorySummary?: {
    summary: string;
    keyDecisions?: string[];
  };
}) {
  const cardEvidence = input.cards.flatMap((card) =>
    (card.weightBreakdown?.terms ?? [])
      .slice()
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 2)
      .map((term) => ({
        source: "weight_breakdown" as const,
        cardId: card.cardId,
        signal: term.key,
        quote: `${card.title}: ${term.label}=${term.value}, contribution=${term.contribution}`,
        confidence: Math.max(0, Math.min(1, Math.abs(term.contribution) * 4)),
        actionBinding: card.whyThisNow,
      })),
  );
  const diagnosticEvidence =
    input.evidenceSnippets?.slice(0, 3).map((snippet) => ({
      source: "diagnostic" as const,
      signal: "recent_error_evidence",
      quote: snippet,
      confidence: 0.72,
      actionBinding: "Use recent error evidence to justify repair, review, or ordering changes.",
    })) ?? [];
  const memoryEvidence = input.memorySummary
    ? [
        {
          source: "conversation_summary" as const,
          signal: "long_term_teacher_memory",
          quote: input.memorySummary.summary,
          confidence: 0.68,
          actionBinding:
            input.memorySummary.keyDecisions?.[0] ??
            "Preserve continuity with earlier teacher decisions.",
        },
      ]
    : [];

  return [...cardEvidence, ...diagnosticEvidence, ...memoryEvidence].slice(0, 8);
}

export async function generateTeacherExplanationBundle(input: {
  userId: string;
  exam: "cet6" | "ielts";
  state: ScoreCenterState;
  latestCommand?: string;
  latestSubmit?: {
    status: "completed" | "failed";
    primaryError?: string;
  };
  evidenceSnippets?: string[];
}): Promise<{
  teacherMessages: TeacherMessage[];
  decisionSummary: string[];
}> {
  const settings = await loadAiProviderSettings();

  if (!settings.enabled || !settings.apiKey) {
    console.warn("[teacher-explainer] AI disabled or missing API key, using template messages");
    return {
      teacherMessages: buildTeacherMessages({
        totalMinutes: input.state.budget.totalMinutes,
        mode: input.state.mode,
        latestCommand: input.latestCommand,
        latestSubmit: input.latestSubmit,
      }),
      decisionSummary: input.state.decisionSummary,
    };
  }

  try {
    const previousResponseId = await getTeacherPreviousResponseId(input.userId, input.exam);
    const compacted = compactTeacherConversation({
      messages: input.state.teacherMessages,
      maxRecentMessages: 4,
    });
    if (compacted.summary) {
      await saveTeacherConversationSummary({
        userId: input.userId,
        exam: input.exam,
        summary: compacted.summary.summary,
        keyDecisions: compacted.summary.keyDecisions,
        compactedCount: compacted.compactedCount,
      });
    }
    const persistedSummary = await getTeacherConversationSummary(input.userId, input.exam);
    const evidence = buildTeacherEvidenceInput({
      cards: input.state.cards.map((card) => ({
        cardId: card.cardId,
        cardType: card.cardType,
        title: card.title,
        whyThisNow: card.whyThisNow,
        expectedImpact: card.expectedImpact,
        targetSkills: card.targetSkills,
        status: card.status,
        weightBreakdown: card.weightBreakdown,
      })),
      evidenceSnippets: input.evidenceSnippets,
      memorySummary: persistedSummary ?? compacted.summary,
    });
    const result = await callOpenAICompatibleResponses<z.infer<typeof teacherBundleSchema>>(
      settings,
      {
        model: settings.teacherModel,
        instructions:
          "You are an exam score-improvement teacher. Explain scheduling decisions with teaching intent, evidence, and action. Be concise, specific, and never chat idly. Use the supplied evidence, budget, skill weaknesses, and error patterns. Maintain continuity with previous turns.",
        input: JSON.stringify({
          mode: input.state.mode,
          budget: input.state.budget,
          cards: input.state.cards.map((card) => ({
            type: card.cardType,
            title: card.title,
            whyThisNow: card.whyThisNow,
            expectedImpact: card.expectedImpact,
            targetSkills: card.targetSkills,
            status: card.status,
          })),
          panel: input.state.panel,
          latestCommand: input.latestCommand,
          latestSubmit: input.latestSubmit,
          structuredEvidence: evidence,
          conversationSummary: persistedSummary ?? compacted.summary,
          previousTeacherMessages: compacted.recentMessages.map((message) => ({
            kind: message.kind,
            content: message.content,
          })),
        }),
        schemaName: "teacher_message_bundle",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            briefing: { type: "string" },
            update: { type: "string" },
            evidenceUsed: {
              type: "array",
              minItems: 1,
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  source: {
                    type: "string",
                    enum: [
                      "weight_breakdown",
                      "diagnostic",
                      "review_queue",
                      "conversation_summary",
                      "teacher_thread",
                    ],
                  },
                  cardId: { type: "string" },
                  signal: { type: "string" },
                  quote: { type: "string" },
                  confidence: { type: "number" },
                  actionBinding: { type: "string" },
                },
                required: ["source", "signal", "quote", "confidence", "actionBinding"],
              },
            },
            decisionSummary: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 4,
            },
          },
          required: ["briefing", "update", "evidenceUsed", "decisionSummary"],
        },
        previousResponseId,
      },
    );

    if (result.responseId) {
      await saveTeacherPreviousResponseId(input.userId, input.exam, result.responseId);
    }

    const parsed = teacherBundleSchema.parse(result.data);
    return {
      teacherMessages: [
        {
          id: "teacher-briefing-ai",
          role: "teacher",
          kind: "briefing",
          content: parsed.briefing,
          createdAt: new Date().toISOString(),
        },
        {
          id: "teacher-update-ai",
          role: "teacher",
          kind:
            input.latestSubmit?.status === "failed"
              ? "diagnosing"
              : input.latestCommand
                ? "replanning"
                : "explaining",
          content: parsed.update,
          createdAt: new Date().toISOString(),
        },
      ],
      decisionSummary: parsed.decisionSummary,
    };
  } catch (error) {
    console.error("[teacher-explainer] AI call failed:", error);
    return {
      teacherMessages: buildTeacherMessages({
        totalMinutes: input.state.budget.totalMinutes,
        mode: input.state.mode,
        latestCommand: input.latestCommand,
        latestSubmit: input.latestSubmit,
      }),
      decisionSummary: input.state.decisionSummary,
    };
  }
}
