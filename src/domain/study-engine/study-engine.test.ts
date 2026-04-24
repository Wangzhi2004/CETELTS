import { describe, expect, it } from "vitest";

import {
  buildDailyDashboardSummary,
  evaluateReadingAttempt,
  getReviewPriority,
} from "@/domain/study-engine";

describe("study engine", () => {
  it("computes reading accuracy and review queue entries from wrong answers", () => {
    const result = evaluateReadingAttempt({
      sectionId: "section-reading-2019-12-a",
      responses: [
        {
          questionId: "q-1",
          answer: "A",
          correctAnswer: "A",
          selfTag: "词汇不认识",
          elapsedSec: 35,
        },
        {
          questionId: "q-2",
          answer: "B",
          correctAnswer: "D",
          selfTag: "定位错误",
          elapsedSec: 52,
        },
        {
          questionId: "q-3",
          answer: "C",
          correctAnswer: "A",
          selfTag: "长难句没读懂",
          elapsedSec: 88,
        },
      ],
      sourceWeight: 1.2,
    });

    expect(result.accuracy).toBeCloseTo(0.33, 2);
    expect(result.mistakeLogs).toHaveLength(2);
    expect(result.reviewQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityId: "q-2",
          reason: "mistake",
          systemTag: "定位错误",
        }),
        expect.objectContaining({
          entityId: "q-3",
          reason: "mistake",
          systemTag: "长难句没读懂",
        }),
      ]),
    );
  });

  it("prioritizes overdue mistakes above normal vocab reviews", () => {
    expect(
      getReviewPriority({
        sourceWeight: 1.3,
        overdueDays: 3,
        reason: "mistake",
      }),
    ).toBeGreaterThan(
      getReviewPriority({
        sourceWeight: 1,
        overdueDays: 0,
        reason: "vocab",
      }),
    );
  });

  it("builds dashboard summary with next-action emphasis", () => {
    const summary = buildDailyDashboardSummary({
      completedTasks: 2,
      totalTasks: 5,
      overdueReviewCount: 8,
      weakestModule: "listening",
      streakDays: 7,
    });

    expect(summary.progressLabel).toBe("2 / 5 项已完成");
    expect(summary.nextAction).toContain("听力");
    expect(summary.reviewAlert).toContain("8");
  });
});
