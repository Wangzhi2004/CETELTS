import { z } from "zod";

import type {
  ExecutionContext,
  ModuleType,
  ScoreCenterCard,
  ScoreCenterMode,
  StandardErrorType,
  TaskType,
} from "@/types/domain";

const taskTypes = ["reading", "listening", "vocab", "writing", "mock", "review"] as const;

function inferTaskType(card: Pick<ScoreCenterCard, "taskId" | "cardId" | "targetSkills">): TaskType {
  const candidates = [card.taskId, card.cardId, ...card.targetSkills].filter(Boolean).join(" ");
  return taskTypes.find((taskType) => candidates.includes(taskType)) ?? "review";
}

const standardErrorTypes = [
  "vocabulary_gap",
  "syntax_parse_failure",
  "evidence_location_failure",
  "option_discrimination_failure",
  "topic_misread",
  "detail_misread",
  "inference_failure",
  "listening_keyword_miss",
  "listening_structure_loss",
  "writing_task_response_weak",
  "writing_cohesion_weak",
  "writing_grammar_risk",
  "timing_failure",
  "confidence_miscalibration",
] as const satisfies readonly StandardErrorType[];

export const executionResultSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["success", "partial", "failed"]),
  accuracy: z.number().min(0).max(1),
  timeSpentSec: z.number().nonnegative(),
  completionRate: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  selfAssessment: z.string().optional(),
  detectedErrors: z.array(z.enum(standardErrorTypes)),
  subSkillSignals: z.array(
    z.object({
      skill: z.string().min(1),
      value: z.number(),
    }),
  ),
  reviewQueueDelta: z.array(z.unknown()),
  artifacts: z.array(z.unknown()),
  rawTelemetry: z.unknown().optional(),
});

function inferModuleType(card: Pick<ScoreCenterCard, "taskId" | "cardId" | "targetSkills">): ModuleType {
  const taskType = inferTaskType(card);
  return taskType === "review" ? "mistake" : taskType;
}

export function buildExecutionContext(input: {
  sessionId: string;
  userId: string;
  card: ScoreCenterCard;
  mode: ScoreCenterMode;
  userStateSnapshot: Record<string, unknown>;
}): ExecutionContext & {
  sessionId: string;
  cardId: string;
  priority: number;
  targetOutcome: string;
} {
  const priority = input.card.utilityScore ?? input.card.confidence;

  return {
    sessionId: input.sessionId,
    cardId: input.card.cardId,
    taskId: input.card.cardId,
    userId: input.userId,
    moduleType: inferModuleType(input.card),
    skillTargets: input.card.targetSkills,
    sourceRef: input.card.destinationPage,
    difficultyTarget: input.card.difficulty,
    timeBudgetSec: input.card.estimatedTime * 60,
    mode: input.mode,
    expectedSignals: [
      input.card.successSignal,
      ...input.card.targetSkills.map((skill) => `${skill}:delta`),
    ],
    priority,
    targetOutcome: input.card.successSignal,
    prerequisiteState: {
      prerequisite: input.card.prerequisite,
      relation: input.card.relation,
      userStateSnapshot: input.userStateSnapshot,
    },
  };
}
