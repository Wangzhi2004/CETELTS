import { createScoreCenterState } from "@/domain/score-center";
import { prisma } from "@/server/db/prisma";
import {
  mapDiagnosticRecordsToMistakeLogs,
  mapScoreCenterCardsToTaskCardRows,
} from "@/server/services/score-center-runtime";
import type { DailyTask, ExamType, Goal, ReviewQueueEntry } from "@/types/domain";

type SkillSignal = {
  skillNode: string;
  mastery: number;
  confidence: number;
  decayRisk: number;
  speedDeficit: number;
  recurrence: number;
  transferGain: number;
  stressDrop: number;
  evidenceCount: number;
};

export async function generateDailyTaskStack(
  userId: string,
  examType: ExamType,
  sessionId: string,
) {
  const userState = await prisma.userState.findUnique({
    where: { userId_targetExam: { userId, targetExam: examType } },
  });

  if (!userState) {
    throw new Error("User state not found");
  }

  const [reviewQueueRecords, recentDiagnostics, candidateTasks, skillStates] = await Promise.all([
    prisma.reviewQueue.findMany({
      where: { userId, nextReviewAt: { lte: new Date() } },
      orderBy: [{ priority: "desc" }, { nextReviewAt: "asc" }],
      take: 5,
    }),
    prisma.diagnosticRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.dailyTask.findMany({
      where: { userId, status: { not: "done" } },
      orderBy: { priority: "desc" },
      take: 8,
    }),
    prisma.skillState.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 16,
    }),
  ]);

  const goal: Goal = {
    id: `goal-${examType}`,
    userId,
    examType,
    targetScore: userState.targetScore,
    examDate: userState.examDate.toISOString(),
    dailyMinutes: userState.dailyBudgetMinutes,
    phase:
      userState.mode === "recovery"
        ? "recovery"
        : userState.mode === "sprint"
          ? "sprint"
          : "intensive",
  };
  const reviewQueue: ReviewQueueEntry[] = reviewQueueRecords.map((entry: { entityType: string; entityId: string; reason: string; priority: number; nextReviewAt: Date }) => ({
    entityType: entry.entityType as ReviewQueueEntry["entityType"],
    entityId: entry.entityId,
    reason: entry.reason as ReviewQueueEntry["reason"],
    priority: entry.priority,
    nextReviewAt: entry.nextReviewAt.toISOString(),
    intervalDays: 1,
  }));
  const mistakeLogs = mapDiagnosticRecordsToMistakeLogs(
    recentDiagnostics.map((diagnostic: { diagnosticId: string; userId: string; primaryError: string; evidence: unknown }) => ({
      id: diagnostic.diagnosticId,
      userId: diagnostic.userId,
      primaryError: diagnostic.primaryError,
      evidence: Array.isArray(diagnostic.evidence) ? (diagnostic.evidence as string[]) : [],
    })),
  );
  const state = createScoreCenterState({
    exam: examType,
    goal,
    tasks: candidateTasks.map((task: { [key: string]: unknown; scheduledAt: Date }) => ({
      ...task,
      examType,
      scheduledAt: task.scheduledAt.toISOString(),
    })) as DailyTask[],
    reviewQueue,
    mistakeLogs,
    totalMinutes: userState.dailyBudgetMinutes,
    energy: userState.mode === "light" ? "low" : "normal",
    skillStates: skillStates.map((skillState: { skillNode: string; mastery: number; confidence: number; decayRisk: number; speedDeficit: number; recurrence: number; transferGain: number; stressDrop: number; evidenceCount: number }): SkillSignal => ({
      skillNode: skillState.skillNode,
      mastery: skillState.mastery,
      confidence: skillState.confidence,
      decayRisk: skillState.decayRisk,
      speedDeficit: skillState.speedDeficit,
      recurrence: skillState.recurrence,
      transferGain: skillState.transferGain,
      stressDrop: skillState.stressDrop,
      evidenceCount: skillState.evidenceCount,
    })),
  });

  await prisma.taskCard.deleteMany({
    where: { userId, sessionId },
  });

  if (state.cards.length > 0) {
    await prisma.taskCard.createMany({
      data: mapScoreCenterCardsToTaskCardRows(userId, sessionId, state.cards),
    });
  }

  return prisma.taskCard.findMany({
    where: { userId, sessionId },
    orderBy: { sequence: "asc" },
  });
}
