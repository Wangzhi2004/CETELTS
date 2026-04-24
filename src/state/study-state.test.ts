import { describe, expect, it } from "vitest";

import {
  createInitialStudyState,
  deriveDashboardView,
  hydrateStudyState,
  studyStateReducer,
} from "@/state/study-state";
import { evaluateReadingAttempt } from "@/domain/study-engine";

describe("study state", () => {
  it("records reading completion and pushes mistakes into the shared review flow", () => {
    const initial = createInitialStudyState("cet6");
    const readingTask = initial.tasks.find((task) => task.taskType === "reading");
    const initialMistakeCount = initial.mistakeLogs.length;

    expect(readingTask?.status).toBe("in_progress");
    expect(initial.scoreCenter.cards[0]?.cardType).toBe("review");

    const summary = evaluateReadingAttempt({
      sectionId: "section-reading-2019-12-a",
      sourceWeight: 1.2,
      responses: [
        {
          questionId: "q-1",
          answer: "A",
          correctAnswer: "A",
          selfTag: "词汇不认识",
          elapsedSec: 32,
        },
        {
          questionId: "q-2",
          answer: "B",
          correctAnswer: "D",
          selfTag: "定位错误",
          elapsedSec: 49,
        },
      ],
    });

    const next = studyStateReducer(initial, {
      type: "completeReadingAttempt",
      payload: {
        taskId: readingTask!.id,
        summary,
      },
    });

    expect(next.tasks.find((task) => task.id === readingTask!.id)?.status).toBe("done");
    expect(next.mistakeLogs).toHaveLength(initialMistakeCount + summary.mistakeLogs.length);
    expect(next.reviewQueue[0].entityId).toBe("q-2");
    expect(next.scoreCenter.pageStatus).toBe("replanned");
    expect(next.scoreCenter.cards.some((card) => card.cardType === "repair")).toBe(true);
  });

  it("derives dashboard next action and counts from persisted study state", () => {
    const initial = createInitialStudyState("cet6");
    const next = studyStateReducer(initial, {
      type: "completeVocabReview",
      payload: {
        itemId: "vocab-diversion",
        result: "mastered",
      },
    });

    const derived = deriveDashboardView(next);

    expect(derived.completedTaskCount).toBeGreaterThanOrEqual(1);
    expect(derived.queueCount).toBeGreaterThan(0);
    expect(derived.nextAction.length).toBeGreaterThan(0);
  });

  it("replans the score center when the learner reduces today's budget", () => {
    const initial = createInitialStudyState("cet6");

    const next = studyStateReducer(initial, {
      type: "applyTeacherCommand",
      payload: {
        input: "我今天只有25分钟",
      },
    });

    expect(next.scoreCenter.budget.totalMinutes).toBe(25);
    expect(next.scoreCenter.cards).toHaveLength(2);
    expect(next.scoreCenter.teacherMessages.at(-1)?.content).toContain("25 分钟");
  });

  it("hydrates legacy cached state by backfilling score center fields", () => {
    const initial = createInitialStudyState("cet6");
    const legacyState = {
      exam: initial.exam,
      tasks: initial.tasks,
      reviewQueue: initial.reviewQueue,
      mistakeLogs: initial.mistakeLogs,
      vocabItems: initial.vocabItems,
      essayDraft: initial.essayDraft,
      listeningSubmitted: false,
      mockCompletedPaperIds: [],
    };

    const hydrated = hydrateStudyState("cet6", legacyState);

    expect(hydrated.scoreCenter).toBeDefined();
    expect(hydrated.scoreCenter.cards.length).toBeGreaterThan(0);
    expect(hydrated.goal.targetScore).toBeGreaterThan(0);
  });
});
