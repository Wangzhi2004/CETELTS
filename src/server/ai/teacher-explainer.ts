import { z } from "zod";

import { loadAiProviderSettings } from "@/server/ai/ai-config";
import { callAIForStructuredOutput } from "@/server/ai/openai-compatible";
import {
  compactTeacherConversation,
  getTeacherConversationSummary,
  saveTeacherConversationSummary,
} from "@/server/ai/teacher-memory";
import { buildTeacherMessages } from "@/server/services/score-center-runtime";
import type { ScoreCenterState, TeacherMessage } from "@/types/domain";

export const intentSchema = z.object({
  intent: z.enum([
    "chat",
    "adjust_budget",
    "switch_mode",
    "change_priority",
    "request_explanation",
    "request_diagnosis",
  ]),
  budgetMinutes: z.number().int().min(5).max(300).optional(),
  mode: z.enum(["strengthen", "light", "sprint", "recovery"]).optional(),
  focusSkill: z.enum(["reading", "listening", "vocab", "writing", "mock"]).optional(),
  responseHint: z.string().optional(),
});

export type UserIntent = z.infer<typeof intentSchema>;

export async function classifyUserIntent(input: {
  userId: string;
  exam: "cet6" | "ielts";
  state: ScoreCenterState;
  command: string;
}): Promise<UserIntent> {
  const settings = await loadAiProviderSettings();

  if (!settings.enabled || !settings.apiKey) {
    return classifyIntentFallback(input.command);
  }

  try {
    const result = await callAIForStructuredOutput<z.infer<typeof intentSchema>>(
      settings,
      {
        model: settings.teacherModel,
        instructions:
          "You are an intent classifier for a study scheduling assistant. Given the student's message and current study context, classify their intent. Be strict: only classify as adjust_budget/switch_mode/change_priority if the student explicitly expresses a scheduling constraint or preference. Casual greetings, questions about the schedule, general chat, or vague statements should be classified as 'chat'. If they ask 'why' something is scheduled, use 'request_explanation'. If they disagree with a diagnosis, use 'request_diagnosis'. Return budgetMinutes only when intent is adjust_budget (the student mentioned a time constraint). Return mode only when intent is switch_mode (the student explicitly requested a mode). Return focusSkill only when intent is change_priority (the student wants to focus on a specific skill).",
        input: JSON.stringify({
          currentMode: input.state.mode,
          currentBudget: input.state.budget.totalMinutes,
          topTask: input.state.cards[0]?.title ?? "none",
          topTaskType: input.state.cards[0]?.cardType ?? "none",
          studentMessage: input.command,
          recentMessages: input.state.teacherMessages.slice(-4).map((m) => ({
            kind: m.kind,
            content: m.content.slice(0, 100),
          })),
        }),
        schemaName: "user_intent",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            intent: {
              type: "string",
              enum: ["chat", "adjust_budget", "switch_mode", "change_priority", "request_explanation", "request_diagnosis"],
            },
            budgetMinutes: { type: "number" },
            mode: { type: "string", enum: ["strengthen", "light", "sprint", "recovery"] },
            focusSkill: { type: "string", enum: ["reading", "listening", "vocab", "writing", "mock"] },
            responseHint: { type: "string" },
          },
          required: ["intent"],
        },
      },
    );

    return intentSchema.parse(result.data);
  } catch (error) {
    console.error("[intent-classifier] AI call failed, using fallback:", error);
    return classifyIntentFallback(input.command);
  }
}

function classifyIntentFallback(command: string): UserIntent {
  const budgetMatch = command.match(/(\d+)\s*分钟/);
  if (budgetMatch) {
    return { intent: "adjust_budget", budgetMinutes: parseInt(budgetMatch[1], 10) };
  }
  if (/状态差|轻一点|变轻/.test(command)) {
    return { intent: "switch_mode", mode: "light" };
  }
  if (/冲刺/.test(command)) {
    return { intent: "switch_mode", mode: "sprint" };
  }
  if (/先练阅读|先阅读|先做阅读/.test(command)) {
    return { intent: "change_priority", focusSkill: "reading" };
  }
  if (/先练听力|先听力/.test(command)) {
    return { intent: "change_priority", focusSkill: "listening" };
  }
  if (/为什么/.test(command)) {
    return { intent: "request_explanation" };
  }
  if (/不是这个原因|不认同/.test(command)) {
    return { intent: "request_diagnosis" };
  }
  return { intent: "chat", responseHint: command };
}

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
            input.memorySummary.keyDecisions?.[0] ?? "Preserve continuity with earlier teacher decisions.",
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
  intent?: UserIntent;
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

    const intentInfo = input.intent
      ? `\nClassified intent: ${input.intent.intent}${input.intent.budgetMinutes ? `, budget=${input.intent.budgetMinutes}min` : ""}${input.intent.mode ? `, mode=${input.intent.mode}` : ""}${input.intent.focusSkill ? `, focusSkill=${input.intent.focusSkill}` : ""}${input.intent.responseHint ? `, hint="${input.intent.responseHint}"` : ""}`
      : "";

    const result = await callAIForStructuredOutput<z.infer<typeof teacherBundleSchema>>(
      settings,
      {
        model: settings.teacherModel,
        instructions:
          "You are an exam score-improvement teacher. You can chat naturally with students AND make scheduling decisions. Your behavior depends on the classified intent:\n\n- chat: Respond naturally and warmly. Briefly acknowledge, then nudge the student toward their current top task. Keep it short and friendly. Do NOT explain scheduling.\n- adjust_budget/switch_mode/change_priority: Explain what you changed and why, with evidence and teaching rationale. Be specific about the new schedule.\n- request_explanation: Explain the reasoning behind the current schedule. Use evidence.\n- request_diagnosis: Help the student understand their error pattern. Use diagnostic evidence.\n\nUse the supplied evidence, budget, skill weaknesses, and error patterns. Maintain continuity with previous turns. Be concise.",
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
          intentInfo,
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
      },
    );

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
            input.intent?.intent === "chat"
              ? "idle"
              : input.intent?.intent === "request_explanation"
                ? "explaining"
                : input.intent?.intent === "request_diagnosis"
                  ? "diagnosing"
                  : input.latestSubmit?.status === "failed"
                    ? "diagnosing"
                    : "replanning",
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