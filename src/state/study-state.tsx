"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

import {
  applyTeacherCommand,
  createScoreCenterState,
  replanScoreCenterAfterTaskResult,
  startScoreCenterCard,
} from "@/domain/score-center";
import {
  createMockGoal,
  createSeedMistakeState,
  createSeedReviewQueue,
  getStudentAppBootstrap,
  updateVocabMastery,
} from "@/server/services/student-app-service";
import {
  DailyTask,
  EssayFeedback,
  ExamType,
  Goal,
  MistakeLog,
  ReadingAttemptSummary,
  ReviewQueueEntry,
  ScoreCenterState,
  VocabItem,
} from "@/types/domain";

export interface StudyState {
  exam: ExamType;
  goal: Goal;
  tasks: DailyTask[];
  reviewQueue: ReviewQueueEntry[];
  mistakeLogs: MistakeLog[];
  vocabItems: VocabItem[];
  scoreCenter: ScoreCenterState;
  essayFeedback?: EssayFeedback;
  essayDraft: string;
  latestSubmissionId?: string;
  completedReadingAccuracy?: number;
  listeningSubmitted: boolean;
  mockCompletedPaperIds: string[];
}

type StudyAction =
  | { type: "syncExam"; payload: { exam: ExamType } }
  | { type: "completeReadingAttempt"; payload: { taskId: string; summary: ReadingAttemptSummary } }
  | { type: "completeListeningAttempt"; payload: { taskId?: string } }
  | { type: "completeVocabReview"; payload: { itemId: string; result: "mastered" | "again" } }
  | { type: "setEssayDraft"; payload: { draft: string } }
  | { type: "applyTeacherCommand"; payload: { input: string } }
  | { type: "startScoreCenterCard"; payload: { cardId: string } }
  | {
      type: "receiveEssayFeedback";
      payload: { feedback: EssayFeedback; submissionId: string; taskId?: string; draft: string };
    }
  | { type: "completeMock"; payload: { paperId: string; taskId?: string } };

function markTaskDone(tasks: DailyTask[], taskId?: string) {
  if (!taskId) {
    return tasks;
  }

  return tasks.map((task) =>
    task.id === taskId ? { ...task, status: "done" as const } : task,
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGoal(value: unknown): value is Goal {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.userId === "string" &&
    (value.examType === "cet6" || value.examType === "ielts") &&
    typeof value.targetScore === "number" &&
    typeof value.examDate === "string" &&
    typeof value.dailyMinutes === "number" &&
    (value.phase === "recovery" || value.phase === "intensive" || value.phase === "sprint")
  );
}

export function createInitialStudyState(exam: ExamType): StudyState {
  const bootstrap = getStudentAppBootstrap(exam);
  const seed = createSeedMistakeState();
  const goal = createMockGoal(exam);
  const reviewQueue = [...createSeedReviewQueue(exam), ...seed.reviewQueue];
  const tasks = bootstrap.tasks;
  const mistakeLogs = seed.mistakeLogs;

  return {
    exam,
    goal,
    tasks,
    reviewQueue,
    mistakeLogs,
    vocabItems: bootstrap.vocabItems,
    scoreCenter: createScoreCenterState({
      exam,
      goal,
      tasks,
      reviewQueue,
      mistakeLogs,
    }),
    essayDraft: bootstrap.essayDraft,
    essayFeedback: undefined,
    latestSubmissionId: undefined,
    completedReadingAccuracy: undefined,
    listeningSubmitted: false,
    mockCompletedPaperIds: [],
  };
}

export function hydrateStudyState(exam: ExamType, cached: unknown): StudyState {
  const base = createInitialStudyState(exam);

  if (!isPlainObject(cached)) {
    return base;
  }

  const tasks = Array.isArray(cached.tasks) ? (cached.tasks as DailyTask[]) : base.tasks;
  const reviewQueue = Array.isArray(cached.reviewQueue)
    ? (cached.reviewQueue as ReviewQueueEntry[])
    : base.reviewQueue;
  const mistakeLogs = Array.isArray(cached.mistakeLogs)
    ? (cached.mistakeLogs as MistakeLog[])
    : base.mistakeLogs;
  const vocabItems = Array.isArray(cached.vocabItems)
    ? (cached.vocabItems as VocabItem[])
    : base.vocabItems;
  const goal = isGoal(cached.goal) ? cached.goal : base.goal;

  const fallbackScoreCenter = createScoreCenterState({
    exam,
    goal,
    tasks,
    reviewQueue,
    mistakeLogs,
  });
  const cachedScoreCenter = isPlainObject(cached.scoreCenter)
    ? (cached.scoreCenter as unknown as Partial<ScoreCenterState>)
    : null;

  const scoreCenter = cachedScoreCenter
    ? {
        ...fallbackScoreCenter,
        ...cachedScoreCenter,
      }
    : fallbackScoreCenter;

  return {
    ...base,
    ...(cached as Partial<StudyState>),
    exam,
    goal,
    tasks,
    reviewQueue,
    mistakeLogs,
    vocabItems,
    scoreCenter,
    essayDraft: typeof cached.essayDraft === "string" ? cached.essayDraft : base.essayDraft,
    latestSubmissionId:
      typeof cached.latestSubmissionId === "string" ? cached.latestSubmissionId : undefined,
    completedReadingAccuracy:
      typeof cached.completedReadingAccuracy === "number"
        ? cached.completedReadingAccuracy
        : undefined,
    listeningSubmitted:
      typeof cached.listeningSubmitted === "boolean"
        ? cached.listeningSubmitted
        : base.listeningSubmitted,
    mockCompletedPaperIds: Array.isArray(cached.mockCompletedPaperIds)
      ? (cached.mockCompletedPaperIds as string[])
      : base.mockCompletedPaperIds,
  };
}

export function studyStateReducer(state: StudyState, action: StudyAction): StudyState {
  switch (action.type) {
    case "syncExam":
      return createInitialStudyState(action.payload.exam);
    case "completeReadingAttempt": {
      const nextState = {
        ...state,
        tasks: markTaskDone(state.tasks, action.payload.taskId),
        mistakeLogs: [...action.payload.summary.mistakeLogs, ...state.mistakeLogs],
        reviewQueue: [...action.payload.summary.reviewQueue, ...state.reviewQueue],
        completedReadingAccuracy: action.payload.summary.accuracy,
      };
      return {
        ...nextState,
        scoreCenter: replanScoreCenterAfterTaskResult(nextState.scoreCenter, {
          taskType: "reading",
          status: action.payload.summary.accuracy >= 0.7 ? "completed" : "failed",
          accuracy: action.payload.summary.accuracy,
          timeSpentMinutes:
            state.tasks.find((task) => task.id === action.payload.taskId)?.estimatedMinutes ?? 12,
          detectedErrors: action.payload.summary.mistakeLogs.map((item) => item.systemTag),
        }),
      };
    }
    case "completeListeningAttempt":
      return {
        ...state,
        tasks: markTaskDone(state.tasks, action.payload.taskId),
        listeningSubmitted: true,
        scoreCenter: replanScoreCenterAfterTaskResult(state.scoreCenter, {
          taskType: "listening",
          status: "completed",
          timeSpentMinutes:
            state.tasks.find((task) => task.id === action.payload.taskId)?.estimatedMinutes ?? 10,
          detectedErrors: ["听力定位"],
        }),
        reviewQueue: [
          {
            entityType: "vocab",
            entityId: "vocab-diversion",
            reason: "vocab",
            priority: 75,
            nextReviewAt: new Date().toISOString(),
            intervalDays: 1,
          },
          ...state.reviewQueue,
        ],
      };
    case "completeVocabReview":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.taskType === "vocab" ? { ...task, status: "done" as const } : task,
        ),
        vocabItems: updateVocabMastery(
          state.vocabItems,
          action.payload.itemId,
          action.payload.result,
        ),
        scoreCenter: replanScoreCenterAfterTaskResult(state.scoreCenter, {
          taskType: "vocab",
          status: action.payload.result === "mastered" ? "completed" : "failed",
          timeSpentMinutes: 6,
          detectedErrors: action.payload.result === "mastered" ? [] : ["词汇回忆"],
        }),
      };
    case "setEssayDraft":
      return {
        ...state,
        essayDraft: action.payload.draft,
      };
    case "applyTeacherCommand":
      return {
        ...state,
        scoreCenter: applyTeacherCommand(state.scoreCenter, action.payload.input),
      };
    case "startScoreCenterCard":
      return {
        ...state,
        scoreCenter: startScoreCenterCard(state.scoreCenter, action.payload.cardId),
      };
    case "receiveEssayFeedback":
      return {
        ...state,
        tasks: markTaskDone(state.tasks, action.payload.taskId),
        essayDraft: action.payload.draft,
        essayFeedback: action.payload.feedback,
        latestSubmissionId: action.payload.submissionId,
        reviewQueue: [
          {
            entityType: "essay",
            entityId: action.payload.submissionId,
            reason: "rewrite",
            priority: 82,
            nextReviewAt: new Date().toISOString(),
            intervalDays: 1,
          },
          ...state.reviewQueue,
        ],
        scoreCenter: replanScoreCenterAfterTaskResult(state.scoreCenter, {
          taskType: "writing",
          status: "completed",
          timeSpentMinutes:
            state.tasks.find((task) => task.id === action.payload.taskId)?.estimatedMinutes ?? 20,
          detectedErrors: action.payload.feedback.mistakes.map((item) => item.title),
        }),
      };
    case "completeMock":
      return {
        ...state,
        tasks: markTaskDone(state.tasks, action.payload.taskId),
        mockCompletedPaperIds: [...state.mockCompletedPaperIds, action.payload.paperId],
        scoreCenter: replanScoreCenterAfterTaskResult(state.scoreCenter, {
          taskType: "mock",
          status: "completed",
          timeSpentMinutes:
            state.tasks.find((task) => task.id === action.payload.taskId)?.estimatedMinutes ?? 60,
          detectedErrors: [],
        }),
      };
    default:
      return state;
  }
}

export function deriveDashboardView(state: StudyState) {
  const completedTaskCount = state.tasks.filter((task) => task.status === "done").length;
  const queueCount = state.reviewQueue.length;
  const nextAction =
    state.reviewQueue[0]?.reason === "mistake"
      ? "优先清理阅读错题与定位问题"
      : state.listeningSubmitted
        ? "继续处理听力漏听词汇"
        : "先完成未提交的训练任务";

  return {
    completedTaskCount,
    queueCount,
    nextAction,
  };
}

const StudyStateContext = createContext<{
  state: StudyState;
  dispatch: React.Dispatch<StudyAction>;
} | null>(null);

export function StudyStateProvider({
  exam,
  children,
}: {
  exam: ExamType;
  children: React.ReactNode;
}) {
  const storageKey = `cetelts-study-state:${exam}`;
  const [state, dispatch] = useReducer(studyStateReducer, exam, (examType) => {
    if (typeof window === "undefined") {
      return createInitialStudyState(examType);
    }

    const cached = window.localStorage.getItem(storageKey);
    if (!cached) {
      return createInitialStudyState(examType);
    }

    try {
      return hydrateStudyState(examType, JSON.parse(cached));
    } catch {
      return createInitialStudyState(examType);
    }
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  useEffect(() => {
    if (state.exam !== exam) {
      dispatch({ type: "syncExam", payload: { exam } });
    }
  }, [exam, state.exam]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <StudyStateContext.Provider value={value}>{children}</StudyStateContext.Provider>;
}

export function useStudyState() {
  const context = useContext(StudyStateContext);

  if (!context) {
    throw new Error("useStudyState must be used within StudyStateProvider");
  }

  return context;
}
