import { describe, expect, it } from "vitest";

import {
  applyTeacherCommand,
  completeScoreCenterDay,
  createScoreCenterState,
  postponeScoreCenterCard,
  replanScoreCenterAfterTaskResult,
  skipScoreCenterCard,
  startScoreCenterCard,
} from "@/domain/score-center";
import { mockTasks } from "@/mocks/student-data";
import {
  createMockGoal,
  createSeedMistakeState,
  createSeedReviewQueue,
} from "@/server/services/student-app-service";
import { MistakeLog } from "@/types/domain";

function createRepeatedLocatingMistakes(): MistakeLog[] {
  return [
    {
      id: "mistake-locating-1",
      userId: "mock-user",
      moduleType: "reading",
      questionId: "q-2",
      systemTag: "定位错误",
      evidence: "定位范围偏移",
      resolved: false,
    },
    {
      id: "mistake-locating-2",
      userId: "mock-user",
      moduleType: "reading",
      questionId: "q-4",
      systemTag: "定位错误",
      evidence: "题干同义替换未命中",
      resolved: false,
    },
  ];
}

describe("score center domain", () => {
  it("starts the day with a review card before score-boost cards", () => {
    const seed = createSeedMistakeState();
    const scoreCenter = createScoreCenterState({
      exam: "cet6",
      goal: createMockGoal("cet6"),
      tasks: mockTasks.filter((task) => task.examType === "cet6"),
      reviewQueue: createSeedReviewQueue("cet6"),
      mistakeLogs: seed.mistakeLogs,
    });

    expect(scoreCenter.pageStatus).toBe("ready");
    expect(scoreCenter.cards[0]?.cardType).toBe("review");
    expect(scoreCenter.cards[0]?.whyThisNow).toContain("遗忘");
    expect(scoreCenter.cards[1]?.cardType).toBe("score_boost");
    expect(scoreCenter.cards.length).toBeGreaterThanOrEqual(3);
    expect(scoreCenter.cards.length).toBeLessThanOrEqual(7);
    expect(scoreCenter.teacherMessages[0]?.kind).toBe("briefing");
  });

  it("raises reading score-boost priority when reading skill weakness is more severe", () => {
    const seed = createSeedMistakeState();
    const scoreCenter = createScoreCenterState({
      exam: "cet6",
      goal: createMockGoal("cet6"),
      tasks: mockTasks.filter((task) => task.examType === "cet6"),
      reviewQueue: createSeedReviewQueue("cet6"),
      mistakeLogs: seed.mistakeLogs,
      skillStates: [
        {
          skillNode: "reading.locating",
          mastery: 0.28,
          confidence: 0.72,
          decayRisk: 0.61,
          speedDeficit: 0.52,
          recurrence: 0.74,
          transferGain: 0.48,
          stressDrop: 0.34,
          evidenceCount: 6,
        },
        {
          skillNode: "listening.transition",
          mastery: 0.58,
          confidence: 0.74,
          decayRisk: 0.45,
          speedDeficit: 0.33,
          recurrence: 0.32,
          transferGain: 0.29,
          stressDrop: 0.21,
          evidenceCount: 6,
        },
      ],
    });

    expect(scoreCenter.cards[1]?.targetSkills[0]).toContain("reading");
  });

  it("attaches a visible utility weight breakdown to score-boost cards", () => {
    const seed = createSeedMistakeState();
    const scoreCenter = createScoreCenterState({
      exam: "cet6",
      goal: createMockGoal("cet6"),
      tasks: mockTasks.filter((task) => task.examType === "cet6"),
      reviewQueue: createSeedReviewQueue("cet6"),
      mistakeLogs: seed.mistakeLogs,
      skillStates: [
        {
          skillNode: "reading.locating",
          mastery: 0.28,
          confidence: 0.72,
          decayRisk: 0.61,
          speedDeficit: 0.52,
          recurrence: 0.74,
          transferGain: 0.48,
          stressDrop: 0.34,
          evidenceCount: 6,
        },
      ],
    });

    const boostCard = scoreCenter.cards.find((card) => card.cardType === "score_boost");

    expect(boostCard?.utilityScore).toBeGreaterThan(0);
    expect(boostCard?.weightBreakdown?.terms.length).toBeGreaterThanOrEqual(5);
    expect(boostCard?.weightBreakdown?.terms[0]).toEqual(
      expect.objectContaining({
        key: expect.any(String),
        label: expect.any(String),
        weight: expect.any(Number),
        value: expect.any(Number),
        contribution: expect.any(Number),
      }),
    );
    expect(boostCard?.weightBreakdown?.summary).toContain("Top drivers");
  });

  it("adds a verification tail card in sprint mode", () => {
    const seed = createSeedMistakeState();
    const sprintGoal = {
      ...createMockGoal("cet6"),
      examDate: "2026-04-30",
    };

    const scoreCenter = createScoreCenterState({
      exam: "cet6",
      goal: sprintGoal,
      tasks: mockTasks.filter((task) => task.examType === "cet6"),
      reviewQueue: createSeedReviewQueue("cet6"),
      mistakeLogs: seed.mistakeLogs,
    });

    expect(scoreCenter.mode).toBe("sprint");
    expect(scoreCenter.cards.some((card) => card.cardType === "verification")).toBe(true);
  });

  it("compresses the stack and explains tradeoffs when the budget shrinks to 25 minutes", () => {
    const seed = createSeedMistakeState();
    const initial = createScoreCenterState({
      exam: "cet6",
      goal: createMockGoal("cet6"),
      tasks: mockTasks.filter((task) => task.examType === "cet6"),
      reviewQueue: createSeedReviewQueue("cet6"),
      mistakeLogs: seed.mistakeLogs,
    });

    const updated = applyTeacherCommand(initial, "我今天只有25分钟");

    expect(updated.budget.totalMinutes).toBe(25);
    expect(updated.cards).toHaveLength(2);
    expect(updated.teacherMessages.at(-1)?.kind).toBe("replanning");
    expect(updated.teacherMessages.at(-1)?.content).toContain("25 分钟");
  });

  it("inserts a repair path after a failed reading task exposes repeated locating errors", () => {
    const initial = createScoreCenterState({
      exam: "cet6",
      goal: createMockGoal("cet6"),
      tasks: mockTasks.filter((task) => task.examType === "cet6"),
      reviewQueue: createSeedReviewQueue("cet6"),
      mistakeLogs: createRepeatedLocatingMistakes(),
    });

    const updated = replanScoreCenterAfterTaskResult(initial, {
      taskType: "reading",
      status: "failed",
      accuracy: 0.42,
      timeSpentMinutes: 14,
      detectedErrors: ["定位错误"],
    });

    expect(updated.pageStatus).toBe("replanned");
    expect(updated.cards.some((card) => card.cardType === "repair")).toBe(true);
    expect(updated.cards.some((card) => card.cardType === "verification")).toBe(true);
    expect(updated.cards[1]?.title).toContain("定位");
    expect(updated.cards[1]?.relation?.nextIfSuccess).toBe(updated.cards[2]?.cardId);
    expect(updated.cards[1]?.relation?.nextIfFail).toBe(updated.cards[1]?.cardId);
    expect(updated.cards[2]?.relation?.dependsOn).toContain(updated.cards[1]?.cardId);
    expect(updated.cards[2]?.relation?.kind).toBe("conditional");
    expect(updated.teacherMessages.at(-1)?.kind).toBe("diagnosing");
  });

  it("supports explicit card state transitions for start, postpone, skip, and day closing", () => {
    const initial = createScoreCenterState({
      exam: "cet6",
      goal: createMockGoal("cet6"),
      tasks: mockTasks.filter((task) => task.examType === "cet6"),
      reviewQueue: createSeedReviewQueue("cet6"),
      mistakeLogs: createRepeatedLocatingMistakes(),
    });
    const firstCardId = initial.cards[0]?.cardId ?? "";
    const secondCardId = initial.cards[1]?.cardId ?? "";

    const started = startScoreCenterCard(initial, firstCardId);
    expect(started.pageStatus).toBe("executing");
    expect(started.cards[0]?.status).toBe("started");

    const postponed = postponeScoreCenterCard(started, secondCardId, "Move to tomorrow");
    expect(postponed.cards.find((card) => card.cardId === secondCardId)?.status).toBe(
      "postponed",
    );
    expect(postponed.decisionSummary.at(-1)).toContain("Move to tomorrow");

    const skipped = skipScoreCenterCard(postponed, secondCardId, "Too tired today");
    expect(skipped.cards.find((card) => card.cardId === secondCardId)?.status).toBe("skipped");
    expect(skipped.teacherMessages.at(-1)?.kind).toBe("negotiating");

    const closed = completeScoreCenterDay({
      ...skipped,
      cards: skipped.cards.map((card, index) =>
        index === 0 ? { ...card, status: "completed" as const } : card,
      ),
    });
    expect(closed.pageStatus).toBe("completed");
    expect(closed.conversationState).toBe("closing");
    expect(closed.teacherMessages.at(-1)?.kind).toBe("closing");
  });
});
