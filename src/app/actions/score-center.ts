"use server";

import {
  applyTeacherCommand,
  completeScoreCenterDay,
  createScoreCenterState,
  postponeScoreCenterCard,
  replanScoreCenterAfterTaskResult,
  skipScoreCenterCard,
  startScoreCenterCard,
} from "@/domain/score-center";
import { mockReport, mockTasks } from "@/mocks/student-data";
import { prisma } from "@/server/db/prisma";
import { classifyUserIntent, generateTeacherExplanationBundle } from "@/server/ai/teacher-explainer";
import { processDiagnostic } from "@/server/services/algorithm/diagnostic-engine";
import {
  buildTeacherMessages,
  createReplanAuditPayload,
  deriveRemainingBudgetFromCards,
  hydrateTaskCardRows,
  mapScoreCenterCardsToPolicyLogRows,
  mapScoreCenterCardsToTaskCardRows,
  mapDiagnosticRecordsToMistakeLogs,
} from "@/server/services/score-center-runtime";
import { buildExecutionContext, executionResultSchema } from "@/server/services/score-center-protocol";
import {
  createMockGoal,
  createSeedMistakeState,
  createSeedReviewQueue,
  requestMockEssayFeedback,
} from "@/server/services/student-app-service";
import type {
  DailyTask,
  ExamType,
  Goal,
  ReviewQueueEntry,
  ScoreCenterCard,
  ScoreCenterState,
  ExecutionResult,
  TaskType,
} from "@/types/domain";

type DiagnosticRecordRow = {
  diagnosticId: string;
  userId: string;
  primaryError: string;
  evidence: unknown;
};

type ReviewQueueRow = {
  entityType: string;
  entityId: string;
  reason: string;
  priority: number;
  nextReviewAt: Date;
};

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

const DEFAULT_USER_ID = "user-alex";
const fallbackStates = new Map<string, ScoreCenterState>();

function getTodaySessionId(examType: ExamType) {
  const date = new Date().toISOString().split("T")[0];
  return `score-center-${examType}-${date}`;
}

function getFallbackSessionId(userId: string, examType: ExamType) {
  return `fallback-${userId}-${getTodaySessionId(examType)}`;
}

function isFallbackSession(sessionId: string) {
  return sessionId.startsWith("fallback-");
}

function isDatabaseUnavailableError(error: unknown) {
  if (!error || typeof error !== "object") {
    if (error instanceof Error && error.message === "DATABASE_UNAVAILABLE") {
      return true;
    }
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message = typeof candidate.message === "string" ? candidate.message : "";

  return (
    code === "ECONNREFUSED" ||
    code === "P1001" ||
    code === "P2021" ||
    code === "P2022" ||
    code === "ERR_MODULE_NOT_FOUND" ||
    message.includes("ECONNREFUSED") ||
    message.includes("Can't reach database server") ||
    message.includes("does not exist in the current database") ||
    message.includes("DATABASE_UNAVAILABLE") ||
    message.includes("ERR_MODULE_NOT_FOUND")
  );
}

function createFallbackScoreCenterResult(userId: string, examType: ExamType) {
  const sessionId = getFallbackSessionId(userId, examType);
  const existing = fallbackStates.get(sessionId);
  const goal = {
    ...createMockGoal(examType),
    userId,
  };

  if (existing) {
    return {
      state: existing,
      sessionId,
      userState: {
        targetExam: examType,
        targetScore: goal.targetScore,
        examDate: new Date(goal.examDate),
        dailyBudgetMinutes: existing.budget.totalMinutes,
        mode: existing.mode,
      },
    };
  }

  const seed = createSeedMistakeState();
  const state = createScoreCenterState({
    exam: examType,
    goal,
    tasks: mockTasks.filter((task) => task.examType === examType),
    reviewQueue: createSeedReviewQueue(examType),
    mistakeLogs: seed.mistakeLogs,
  });

  const fallbackState = {
    ...state,
    teacherMessages: [
      ...state.teacherMessages,
      {
        id: "teacher-fallback-db",
        role: "teacher" as const,
        kind: "replanning" as const,
        content:
          "当前数据库连接不可用，我先用本地演示状态继续调度；接入 DATABASE_URL 并完成迁移后会自动恢复正式持久化闭环。",
        createdAt: new Date().toISOString(),
      },
    ],
    decisionSummary: [
      ...state.decisionSummary,
      "数据库连接不可用，本轮使用内存 fallback 状态；正式环境需要配置可访问的 Postgres DATABASE_URL。",
    ],
  } satisfies ScoreCenterState;

  fallbackStates.set(sessionId, fallbackState);

  return {
    state: fallbackState,
    sessionId,
    userState: {
      targetExam: examType,
      targetScore: goal.targetScore,
      examDate: new Date(goal.examDate),
      dailyBudgetMinutes: fallbackState.budget.totalMinutes,
      mode: fallbackState.mode,
    },
  };
}

function saveFallbackState(sessionId: string, state: ScoreCenterState) {
  if (isFallbackSession(sessionId)) {
    fallbackStates.set(sessionId, state);
  }
}

function toGoal(
  userId: string,
  userState: {
    targetExam: ExamType;
    targetScore: number;
    examDate: Date;
    dailyBudgetMinutes: number;
    mode: string;
  },
): Goal {
  return {
    id: `goal-${userState.targetExam}`,
    userId,
    examType: userState.targetExam,
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
}

async function ensureSeedData(userId: string, examType: ExamType) {
  const mockGoal = createMockGoal(examType);

  await prisma.userState.upsert({
    where: { userId_targetExam: { userId, targetExam: examType } },
    update: {},
    create: {
      userId,
      targetExam: examType,
      targetScore: mockGoal.targetScore,
      examDate: new Date(mockGoal.examDate),
      dailyBudgetMinutes: mockGoal.dailyMinutes,
      mode: examType === "cet6" ? "strengthen" : "recovery",
      estimatedScore: examType === "cet6" ? 487 : 5.8,
      confidenceGlobal: 0.68,
    },
  });

  const existingTasks = await prisma.dailyTask.count({
    where: { userId },
  });

  if (existingTasks === 0) {
    await prisma.dailyTask.createMany({
      data: mockTasks
        .filter((task) => task.examType === examType)
        .map((task) => ({
          id: task.id,
          userId,
          taskType: task.taskType,
          status: task.status,
          title: task.title,
          subtitle: task.subtitle,
          estimatedMinutes: task.estimatedMinutes,
          scheduledAt: new Date(task.scheduledAt),
          sourceEntityType: task.sourceEntityType,
          sourceEntityId: task.sourceEntityId,
          priority: task.priority ?? 0,
        })),
    });
  }

  const existingReviewQueue = await prisma.reviewQueue.count({
    where: { userId },
  });

  if (existingReviewQueue === 0) {
    const seedQueue = createSeedReviewQueue(examType);
    await prisma.reviewQueue.createMany({
      data: seedQueue.map((entry) => ({
        userId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        reason: entry.reason,
        skillNodes: entry.systemTag ? [entry.systemTag] : [],
        nextReviewAt: new Date(),
        stability: 0.4,
        difficulty: 0.5,
        forgettingRisk: 0.72,
        priority: entry.priority,
      })),
    });
  }

  await prisma.scoreCenterSession.upsert({
    where: { sessionId: getTodaySessionId(examType) },
    update: {},
    create: {
      userId,
      sessionId: getTodaySessionId(examType),
      sessionDate: new Date(),
      budgetMinutes: mockGoal.dailyMinutes,
      mode: examType === "cet6" ? "strengthen" : "recovery",
    },
  });
}

async function getBaseScoreCenterInputs(userId: string, examType: ExamType) {
  await ensureSeedData(userId, examType);

  const userState = await prisma.userState.findUniqueOrThrow({
    where: { userId_targetExam: { userId, targetExam: examType } },
  });

  const tasks = await prisma.dailyTask.findMany({
    where: { userId },
    orderBy: { priority: "desc" },
  });

  const reviewQueueRecords = await prisma.reviewQueue.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { nextReviewAt: "asc" }],
    take: 5,
  });

  const diagnostics = await prisma.diagnosticRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const skillStates = await prisma.skillState.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 16,
  });

  const mistakeLogs = mapDiagnosticRecordsToMistakeLogs(
    diagnostics.map((diagnostic: DiagnosticRecordRow) => ({
      id: diagnostic.diagnosticId,
      userId: diagnostic.userId,
      primaryError: diagnostic.primaryError,
      evidence: Array.isArray(diagnostic.evidence) ? (diagnostic.evidence as string[]) : [],
    })),
  );

  const reviewQueue: ReviewQueueEntry[] = reviewQueueRecords.map((entry: ReviewQueueRow) => ({
    entityType: entry.entityType as ReviewQueueEntry["entityType"],
    entityId: entry.entityId,
    reason: entry.reason as ReviewQueueEntry["reason"],
    priority: entry.priority,
    nextReviewAt: entry.nextReviewAt.toISOString(),
    intervalDays: 1,
  }));

  return {
    sessionId: getTodaySessionId(examType),
    userState,
    goal: toGoal(userId, userState),
    tasks: tasks.map((task: { [key: string]: unknown; scheduledAt: Date }) => ({
      ...task,
      examType,
      scheduledAt: task.scheduledAt.toISOString(),
    })) as DailyTask[],
    reviewQueue,
    diagnostics,
    skillStates,
    mistakeLogs,
  };
}

async function persistScoreCenterCards(userId: string, sessionId: string, cards: ScoreCenterCard[]) {
  await prisma.taskCard.deleteMany({
    where: { userId, sessionId },
  });

  if (cards.length === 0) {
    return;
  }

  await prisma.taskCard.createMany({
    data: mapScoreCenterCardsToTaskCardRows(userId, sessionId, cards),
  });

  const policyRows = mapScoreCenterCardsToPolicyLogRows(userId, sessionId, cards);
  if (policyRows.length > 0) {
    await prisma.policyLog.createMany({
      data: policyRows,
    });
  }
}

async function persistTeacherMessages(
  userId: string,
  examType: ExamType,
  sessionId: string | undefined,
  messages: ScoreCenterState["teacherMessages"],
) {
  if (!messages || messages.length === 0) return;

  const recentMessages = messages.slice(-20);

  for (const msg of recentMessages) {
    await prisma.teacherMessage.upsert({
      where: { id: msg.id },
      create: {
        id: msg.id,
        userId,
        examType,
        sessionId: sessionId ?? null,
        role: msg.role,
        kind: msg.kind,
        content: msg.content,
        decisionSummary: msg.decisionSummary ?? null,
        evidenceUsed: msg.evidenceUsed ?? undefined,
        boundCards: msg.boundCards ?? undefined,
        userActionExpected: msg.userActionExpected ?? null,
        createdAt: new Date(msg.createdAt),
      },
      update: {
        decisionSummary: msg.decisionSummary ?? null,
        evidenceUsed: msg.evidenceUsed ?? undefined,
        boundCards: msg.boundCards ?? undefined,
        userActionExpected: msg.userActionExpected ?? null,
      },
    });
  }
}

async function loadTeacherMessages(
  userId: string,
  examType: ExamType,
): Promise<ScoreCenterState["teacherMessages"]> {
  try {
    const rows = await prisma.teacherMessage.findMany({
      where: { userId, examType },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    if (rows.length === 0) return [];

    return rows.map((row) => ({
      id: row.id,
      role: row.role as "teacher" | "user",
      kind: row.kind as ScoreCenterState["teacherMessages"][0]["kind"],
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      decisionSummary: row.decisionSummary ?? undefined,
      evidenceUsed: row.evidenceUsed as ScoreCenterState["teacherMessages"][0]["evidenceUsed"] ?? undefined,
      boundCards: row.boundCards as string[] ?? undefined,
      userActionExpected: row.userActionExpected ?? undefined,
    }));
  } catch {
    return [];
  }
}

async function buildOrLoadScoreCenterState(userId: string, examType: ExamType) {
  try {
    return await buildOrLoadScoreCenterStateInner(userId, examType);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return createFallbackScoreCenterResult(userId, examType);
    }
    throw error;
  }
}

async function buildOrLoadScoreCenterStateInner(userId: string, examType: ExamType) {
  const base = await getBaseScoreCenterInputs(userId, examType);

  const existingCards = await prisma.taskCard.findMany({
    where: { userId, sessionId: base.sessionId },
    orderBy: { sequence: "asc" },
  });

  if (existingCards.length === 0) {
    const freshState = createScoreCenterState({
      exam: examType,
      goal: base.goal,
      tasks: base.tasks,
      reviewQueue: base.reviewQueue,
      mistakeLogs: base.mistakeLogs,
      skillStates: base.skillStates.map((skillState: { skillNode: string; mastery: number; confidence: number; decayRisk: number; speedDeficit: number; recurrence: number; transferGain: number; stressDrop: number; evidenceCount: number }): SkillSignal => ({
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

    const aiBundle = await generateTeacherExplanationBundle({
      userId,
      exam: examType,
      state: freshState,
      evidenceSnippets: base.mistakeLogs.slice(0, 3).map((item) => item.evidence),
    });

    const stateWithAi = {
      ...freshState,
      teacherMessages: aiBundle.teacherMessages,
      decisionSummary: aiBundle.decisionSummary,
    } satisfies ScoreCenterState;

    await persistScoreCenterCards(userId, base.sessionId, stateWithAi.cards);
    await persistTeacherMessages(userId, examType, base.sessionId, stateWithAi.teacherMessages);
    return {
      state: stateWithAi,
      sessionId: base.sessionId,
      userState: base.userState,
    };
  }

  const mappedCards = hydrateTaskCardRows(existingCards);
  const latestCommandEvent = await prisma.learningEvent.findFirst({
    where: { userId, pageType: "score-center", action: "constraint_update" },
    orderBy: { timestamp: "desc" },
  });
  const latestSubmitEvent = await prisma.learningEvent.findFirst({
    where: { userId, action: "submit" },
    include: { diagnostic: true },
    orderBy: { timestamp: "desc" },
  });

  const latestCommand =
    latestCommandEvent && typeof latestCommandEvent.payload === "object"
      ? ((latestCommandEvent.payload as { command?: string }).command ?? undefined)
      : undefined;

  const latestSubmit = latestSubmitEvent
    ? {
        status:
          latestSubmitEvent.diagnostic && latestSubmitEvent.diagnostic.severity >= 0.65
            ? ("failed" as const)
            : ("completed" as const),
        primaryError: latestSubmitEvent.diagnostic?.primaryError,
      }
    : undefined;

  const baseState = createScoreCenterState({
    exam: examType,
    goal: base.goal,
    tasks: base.tasks,
    reviewQueue: base.reviewQueue,
    mistakeLogs: base.mistakeLogs,
    skillStates: base.skillStates.map((skillState: { skillNode: string; mastery: number; confidence: number; decayRisk: number; speedDeficit: number; recurrence: number; transferGain: number; stressDrop: number; evidenceCount: number }): SkillSignal => ({
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

  const hydratedState = {
    ...baseState,
    mode: base.userState.mode as ScoreCenterState["mode"],
    cards: mappedCards,
    budget: {
      totalMinutes: base.userState.dailyBudgetMinutes,
      remainingMinutes: deriveRemainingBudgetFromCards(base.userState.dailyBudgetMinutes, mappedCards),
    },
    teacherMessages: await loadTeacherMessages(userId, examType),
    lastUpdatedAt: new Date().toISOString(),
  } satisfies ScoreCenterState;

  const aiBundle = await generateTeacherExplanationBundle({
    userId,
    exam: examType,
    state: hydratedState,
    latestCommand,
    latestSubmit,
    evidenceSnippets: base.mistakeLogs.slice(0, 3).map((item) => item.evidence),
  });

  return {
    state: {
      ...hydratedState,
      teacherMessages: aiBundle.teacherMessages,
      decisionSummary: aiBundle.decisionSummary,
    } satisfies ScoreCenterState,
    sessionId: base.sessionId,
    userState: base.userState,
  };
}

async function logEvent(input: {
  userId: string;
  sessionId: string;
  cardId?: string;
  pageType: string;
  action: string;
  payload?: unknown;
}) {
  const eventId = `evt-${Math.random().toString(36).slice(2, 10)}`;

  await prisma.learningEvent.create({
    data: {
      eventId,
      userId: input.userId,
      sessionId: input.sessionId,
      cardId: input.cardId,
      pageType: input.pageType,
      action: input.action,
      payload: input.payload as object | undefined,
    },
  });

  return eventId;
}

async function markFirstTaskOfTypeDone(userId: string, taskType: string) {
  const task = await prisma.dailyTask.findFirst({
    where: { userId, taskType: taskType as DailyTask["taskType"], status: { not: "done" } },
    orderBy: { priority: "desc" },
  });

  if (!task) {
    return;
  }

  await prisma.dailyTask.update({
    where: { id: task.id },
    data: { status: "done" },
  });
}

function resolveReward(input: { status: "completed" | "failed"; accuracy?: number; score?: number }) {
  if (typeof input.accuracy === "number") {
    return Math.max(0, Math.min(1, input.accuracy));
  }

  if (typeof input.score === "number") {
    return Math.max(0, Math.min(1, input.score / 100));
  }

  return input.status === "completed" ? 1 : 0;
}

function inferTaskTypeFromCard(card?: ScoreCenterCard): TaskType {
  if (!card) {
    return "reading";
  }

  const candidates = [card.taskId, card.cardId, ...card.targetSkills].filter(Boolean).join(" ");
  const taskTypes: TaskType[] = ["reading", "listening", "vocab", "writing", "mock", "review"];
  return taskTypes.find((taskType) => candidates.includes(taskType)) ?? "review";
}

export async function getScoreCenterState(userId: string = DEFAULT_USER_ID, examType: ExamType) {
  const { state } = await buildOrLoadScoreCenterState(userId, examType);
  return state;
}

export async function submitCommand(
  userId: string = DEFAULT_USER_ID,
  examType: ExamType,
  command: string,
) {
  const { state, sessionId, userState } = await buildOrLoadScoreCenterState(userId, examType);

  const intent = await classifyUserIntent({
    userId,
    exam: examType,
    state,
    command,
  });

  let nextState = state;

  if (intent.intent === "adjust_budget" || intent.intent === "switch_mode" || intent.intent === "change_priority") {
    nextState = applyTeacherCommand(state, command);
  }

  const userMsg = {
    id: `user-msg-${Date.now()}`,
    role: "user" as const,
    kind: "negotiating" as const,
    content: command,
    createdAt: new Date().toISOString(),
  };

  if (isFallbackSession(sessionId)) {
    saveFallbackState(sessionId, {
      ...nextState,
      teacherMessages: [...nextState.teacherMessages, userMsg],
    });
    return nextState;
  }

  const modeChanged = nextState.mode !== state.mode;
  const budgetChanged = nextState.budget.totalMinutes !== state.budget.totalMinutes;
  const cardsChanged = nextState.cards.length !== state.cards.length || nextState.cards.some((nc, i) => nc.cardId !== state.cards[i]?.cardId || nc.cardType !== state.cards[i]?.cardType || nc.status !== state.cards[i]?.status);
  const hasReplan = modeChanged || budgetChanged || cardsChanged;

  if (hasReplan) {
    await prisma.userState.update({
      where: { userId_targetExam: { userId, targetExam: examType } },
      data: {
        dailyBudgetMinutes: nextState.budget.totalMinutes,
        mode: nextState.mode,
      },
    });

    await prisma.scoreCenterSession.update({
      where: { sessionId },
      data: {
        budgetMinutes: nextState.budget.totalMinutes,
        mode: nextState.mode,
      },
    });

    await logEvent({
      userId,
      sessionId,
      pageType: "score-center",
      action: "constraint_update",
      payload: {
        command,
        intent: intent.intent,
        previousBudget: userState.dailyBudgetMinutes,
        nextBudget: nextState.budget.totalMinutes,
        previousMode: userState.mode,
        nextMode: nextState.mode,
      },
    });

    await logEvent({
      userId,
      sessionId,
      pageType: "score-center",
      action: "replan",
      payload: createReplanAuditPayload({
        trigger: "constraint_update",
        reason: command,
        oldCards: state.cards,
        newCards: nextState.cards,
      }),
    });
  }

  const aiBundle = await generateTeacherExplanationBundle({
    userId,
    exam: examType,
    state: nextState,
    latestCommand: command,
    intent,
  });

  const enhancedState = {
    ...nextState,
    teacherMessages: [
      userMsg,
      ...aiBundle.teacherMessages,
    ],
    decisionSummary: aiBundle.decisionSummary,
  } satisfies ScoreCenterState;

  if (hasReplan) {
    await persistScoreCenterCards(userId, sessionId, enhancedState.cards);
  }
  await persistTeacherMessages(userId, examType, sessionId, enhancedState.teacherMessages);
  return enhancedState;
}

export async function startCard(
  userId: string = DEFAULT_USER_ID,
  examType: ExamType,
  cardId: string,
) {
  const { state, sessionId } = await buildOrLoadScoreCenterState(userId, examType);
  const nextState = startScoreCenterCard(state, cardId);
  const card = nextState.cards.find((item) => item.cardId === cardId);

  if (isFallbackSession(sessionId)) {
    saveFallbackState(sessionId, nextState);
    return nextState;
  }

  await logEvent({
    userId,
    sessionId,
    cardId,
    pageType: "score-center",
    action: "start",
    payload: card
      ? buildExecutionContext({
          sessionId,
          userId,
          card,
          mode: nextState.mode,
          userStateSnapshot: {
            target_exam: examType,
            target_score: nextState.panel.targetScore,
            daily_budget_minutes: nextState.budget.totalMinutes,
            estimated_score: nextState.panel.estimatedScore,
          },
        })
      : undefined,
  });

  await persistScoreCenterCards(userId, sessionId, nextState.cards);
  return nextState;
}

export async function postponeCard(
  userId: string = DEFAULT_USER_ID,
  examType: ExamType,
  cardId: string,
  reason: string,
) {
  const { state, sessionId } = await buildOrLoadScoreCenterState(userId, examType);
  const nextState = postponeScoreCenterCard(state, cardId, reason);

  if (isFallbackSession(sessionId)) {
    saveFallbackState(sessionId, nextState);
    return nextState;
  }

  await logEvent({
    userId,
    sessionId,
    cardId,
    pageType: "score-center",
    action: "postpone",
    payload: { reason },
  });

  await persistScoreCenterCards(userId, sessionId, nextState.cards);
  return nextState;
}

export async function skipCard(
  userId: string = DEFAULT_USER_ID,
  examType: ExamType,
  cardId: string,
  reason: string,
) {
  const { state, sessionId } = await buildOrLoadScoreCenterState(userId, examType);
  const nextState = skipScoreCenterCard(state, cardId, reason);

  if (isFallbackSession(sessionId)) {
    saveFallbackState(sessionId, nextState);
    return nextState;
  }

  await logEvent({
    userId,
    sessionId,
    cardId,
    pageType: "score-center",
    action: "skip",
    payload: { reason },
  });

  await persistScoreCenterCards(userId, sessionId, nextState.cards);
  return nextState;
}

export async function closeScoreCenterDay(userId: string = DEFAULT_USER_ID, examType: ExamType) {
  const { state, sessionId } = await buildOrLoadScoreCenterState(userId, examType);
  const nextState = completeScoreCenterDay(state);

  if (isFallbackSession(sessionId)) {
    saveFallbackState(sessionId, nextState);
    return nextState;
  }

  await logEvent({
    userId,
    sessionId,
    pageType: "score-center",
    action: "close_day",
    payload: {
      completed: nextState.cards.filter((card) => card.status === "completed").length,
      unfinished: nextState.cards.filter((card) => card.status !== "completed").length,
    },
  });

  await persistScoreCenterCards(userId, sessionId, nextState.cards);
  return nextState;
}

export async function submitTaskResult(
  userId: string = DEFAULT_USER_ID,
  examType: ExamType,
  result: ExecutionResult,
) {
  const parsedResult = executionResultSchema.parse(result) as ExecutionResult;
  const { state, sessionId } = await buildOrLoadScoreCenterState(userId, examType);
  const resolvedCardId = parsedResult.taskId;
  const card = state.cards.find(c => c.cardId === resolvedCardId);
  const taskType = inferTaskTypeFromCard(card);

  if (isFallbackSession(sessionId)) {
    const nextState = replanScoreCenterAfterTaskResult(state, {
      taskType,
      status: parsedResult.status === "failed" ? "failed" : "completed",
      accuracy: parsedResult.accuracy,
      timeSpentMinutes: parsedResult.timeSpentSec / 60,
      detectedErrors: parsedResult.detectedErrors,
    });
    saveFallbackState(sessionId, nextState);
    return nextState;
  }

  const eventId = await logEvent({
    userId,
    sessionId,
    cardId: resolvedCardId,
    pageType: taskType, // mapping taskType to pageType
    action: "submit",
    payload: parsedResult,
  });

  await processDiagnostic(eventId);
  await prisma.policyLog.updateMany({
    where: {
      userId,
      sessionId,
      selectedArm: taskType,
      reward: null,
    },
    data: {
      reward: resolveReward({ status: parsedResult.status === "failed" ? "failed" : "completed", accuracy: parsedResult.accuracy }),
      rewardSignal: typeof parsedResult.accuracy === "number" ? "accuracy" : parsedResult.status,
    },
  });
  await markFirstTaskOfTypeDone(userId, taskType);

  const nextState = replanScoreCenterAfterTaskResult(state, {
    taskType,
    status: parsedResult.status === "failed" ? "failed" : "completed",
    accuracy: parsedResult.accuracy,
    timeSpentMinutes: parsedResult.timeSpentSec / 60,
    detectedErrors: parsedResult.detectedErrors,
  });

  await logEvent({
    userId,
    sessionId,
    cardId: resolvedCardId,
    pageType: "score-center",
    action: "replan",
    payload: createReplanAuditPayload({
      trigger: "execution_result",
      reason: parsedResult.detectedErrors[0] ?? parsedResult.status,
      oldCards: state.cards,
      newCards: nextState.cards,
    }),
  });

  const aiBundle = await generateTeacherExplanationBundle({
    userId,
    exam: examType,
    state: nextState,
    latestSubmit: {
      status: parsedResult.status === "failed" ? "failed" : "completed",
      primaryError: parsedResult.detectedErrors[0],
    },
  });

  const enhancedState = {
    ...nextState,
    teacherMessages: aiBundle.teacherMessages,
    decisionSummary: aiBundle.decisionSummary,
  } satisfies ScoreCenterState;

  await persistScoreCenterCards(userId, sessionId, enhancedState.cards);
  await persistTeacherMessages(userId, examType, sessionId, enhancedState.teacherMessages);
  return enhancedState;
}

export async function getLatestWritingFeedback(userId: string = DEFAULT_USER_ID) {
  let latestEvent;

  try {
    latestEvent = await prisma.learningEvent.findFirst({
      where: { userId, pageType: "writing", action: "submit" },
      orderBy: { timestamp: "desc" },
    });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
  }

  if (!latestEvent || typeof latestEvent.payload !== "object" || latestEvent.payload === null) {
    return {
      draft: "",
      feedback: await requestMockEssayFeedback(),
    };
  }

  const payload = latestEvent.payload as {
    draft?: string;
    feedback?: Awaited<ReturnType<typeof requestMockEssayFeedback>>;
  };

  return {
    draft: payload.draft ?? "",
    feedback: payload.feedback ?? (await requestMockEssayFeedback()),
  };
}

export async function getMistakeBookData(userId: string = DEFAULT_USER_ID) {
  let diagnostics;

  try {
    diagnostics = await prisma.diagnosticRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return createSeedMistakeState().mistakeLogs;
    }

    throw error;
  }

  return mapDiagnosticRecordsToMistakeLogs(
    diagnostics.map((diagnostic: DiagnosticRecordRow) => ({
      id: diagnostic.diagnosticId,
      userId: diagnostic.userId,
      primaryError: diagnostic.primaryError,
      evidence: Array.isArray(diagnostic.evidence) ? (diagnostic.evidence as string[]) : [],
    })),
  );
}

export async function getReportOverviewData(
  userId: string = DEFAULT_USER_ID,
  examType: ExamType,
) {
  let base;
  let latestReadingEvent;

  try {
    base = await getBaseScoreCenterInputs(userId, examType);
    latestReadingEvent = await prisma.learningEvent.findFirst({
      where: { userId, pageType: "reading", action: "submit" },
      orderBy: { timestamp: "desc" },
    });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return {
      reportSnapshot: mockReport,
      completedTasks: 0,
      reviewQueueCount: createSeedReviewQueue(examType).length,
      mistakeLogs: createSeedMistakeState().mistakeLogs,
      completedReadingAccuracy: undefined,
    };
  }

  const latestReadingAccuracy =
    latestReadingEvent &&
    typeof latestReadingEvent.payload === "object" &&
    latestReadingEvent.payload !== null &&
    typeof (latestReadingEvent.payload as { accuracy?: unknown }).accuracy === "number"
      ? ((latestReadingEvent.payload as { accuracy: number }).accuracy ?? undefined)
      : undefined;

  return {
    reportSnapshot: mockReport,
    completedTasks: base.tasks.filter((task) => task.status === "done").length,
    reviewQueueCount: base.reviewQueue.length,
    mistakeLogs: base.mistakeLogs,
    completedReadingAccuracy: latestReadingAccuracy,
  };
}
