import { addDays, formatISO } from "date-fns";

import {
  AttemptResponse,
  MistakeLog,
  MistakeTag,
  ReadingAttemptSummary,
  ReviewQueueEntry,
  ReviewReason,
} from "@/types/domain";

const mistakeWeights: Record<ReviewReason, number> = {
  mistake: 100,
  vocab: 60,
  mock: 80,
  rewrite: 75,
};

function resolveSystemTag(response: AttemptResponse): MistakeTag {
  return response.selfTag ?? "干扰项误选";
}

export function getReviewPriority(input: {
  sourceWeight: number;
  overdueDays: number;
  reason: ReviewReason;
}) {
  return Math.round(
    mistakeWeights[input.reason] * input.sourceWeight + input.overdueDays * 10,
  );
}

export function evaluateReadingAttempt(input: {
  sectionId: string;
  responses: AttemptResponse[];
  sourceWeight: number;
}): ReadingAttemptSummary {
  const wrongResponses = input.responses.filter(
    (response) => response.answer !== response.correctAnswer,
  );

  const mistakeLogs: MistakeLog[] = wrongResponses.map((response, index) => ({
    id: `mistake-${input.sectionId}-${response.questionId}-${index}`,
    userId: "mock-user",
    moduleType: "reading",
    questionId: response.questionId,
    selfTag: response.selfTag,
    systemTag: resolveSystemTag(response),
    evidence: `题目 ${response.questionId} 在 ${response.elapsedSec}s 后仍选错，需进入复盘。`,
    resolved: false,
  }));

  const reviewQueue: ReviewQueueEntry[] = wrongResponses.map((response) => ({
    entityType: "question",
    entityId: response.questionId,
    reason: "mistake",
    priority: getReviewPriority({
      sourceWeight: input.sourceWeight,
      overdueDays: 1,
      reason: "mistake",
    }),
    nextReviewAt: formatISO(addDays(new Date(), 1)),
    intervalDays: 1,
    systemTag: resolveSystemTag(response),
  }));

  return {
    sectionId: input.sectionId,
    accuracy:
      input.responses.length === 0
        ? 0
        : Number(
            (
              (input.responses.length - wrongResponses.length) /
              input.responses.length
            ).toFixed(2),
          ),
    mistakeLogs,
    reviewQueue,
  };
}

export function buildDailyDashboardSummary(input: {
  completedTasks: number;
  totalTasks: number;
  overdueReviewCount: number;
  weakestModule: string;
  streakDays: number;
}) {
  return {
    progressLabel: `${input.completedTasks} / ${input.totalTasks} 项已完成`,
    reviewAlert: `${input.overdueReviewCount} 条复习待清理`,
    nextAction: `下一步优先做${input.weakestModule === "listening" ? "听力精听补弱" : "薄弱模块专项训练"}`,
    streakLabel: `已连续学习 ${input.streakDays} 天`,
  };
}
