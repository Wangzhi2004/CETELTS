import { describe, expect, it } from "vitest";

import {
  buildExecutionContext,
  executionResultSchema,
} from "@/server/services/score-center-protocol";

describe("score center execution protocol", () => {
  it("builds the execution-page context with scheduler-owned fields", () => {
    const context = buildExecutionContext({
      sessionId: "session-1",
      userId: "user-alex",
      mode: "strengthen",
      card: {
        cardId: "card-score-task-reading",
        taskId: "task-reading",
        cardType: "score_boost",
        title: "Reading locating drill",
        whyThisNow: "Highest score utility",
        estimatedTime: 20,
        difficulty: "medium",
        expectedImpact: "Improve reading locating",
        targetSkills: ["reading.locating"],
        prerequisite: ["review-vocab"],
        actionLabel: "Start",
        destinationPage: "/cet6/reading",
        successSignal: "Accuracy >= 80%",
        fallbackAction: "Postpone to tomorrow",
        expiry: "2026-04-25T00:00:00.000Z",
        confidence: 0.82,
        utilityScore: 0.61,
        originEngine: "score_center_domain",
        status: "surfaced",
        sequence: 1,
      },
      userStateSnapshot: {
        target_exam: "cet6",
        target_score: 550,
        daily_budget_minutes: 90,
        estimated_score: 487,
      },
    });

    expect(context).toEqual(
      expect.objectContaining({
        taskId: "card-score-task-reading",
        userId: "user-alex",
        moduleType: "reading",
        sourceRef: "/cet6/reading",
        timeBudgetSec: 1200,
        mode: "strengthen",
        priority: 0.61,
      }),
    );
    expect(context.expectedSignals).toContain("Accuracy >= 80%");
    expect(context.prerequisiteState).toEqual(
      expect.objectContaining({
        prerequisite: ["review-vocab"],
      }),
    );
  });

  it("validates the unified execution result payload before it can trigger replan", () => {
    const parsed = executionResultSchema.parse({
      taskId: "card-score-task-reading",
      status: "failed",
      accuracy: 0.58,
      timeSpentSec: 16 * 60,
      completionRate: 1,
      confidence: 0.42,
      selfAssessment: "I understood the passage but missed locating.",
      detectedErrors: ["evidence_location_failure"],
      subSkillSignals: [
        {
          skill: "reading.locating",
          value: -0.08,
        },
      ],
      reviewQueueDelta: [],
      artifacts: [],
      rawTelemetry: {
        evidenceLocateLatency: 42,
      },
    });

    expect(parsed.detectedErrors).toEqual(["evidence_location_failure"]);
    expect(() =>
      executionResultSchema.parse({
        taskId: "card-score-task-reading",
        status: "done",
        accuracy: 1.2,
        timeSpentSec: -1,
        completionRate: 1,
        confidence: 0.9,
        detectedErrors: [],
        subSkillSignals: [],
        reviewQueueDelta: [],
        artifacts: [],
      }),
    ).toThrow();
  });
});
