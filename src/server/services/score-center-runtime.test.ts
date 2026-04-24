import { describe, expect, it } from "vitest";

import {
  buildTeacherMessages,
  createReplanAuditPayload,
  deriveRemainingBudgetFromCards,
  hydrateTaskCardRows,
  mapScoreCenterCardsToTaskCardRows,
  mapDiagnosticRecordsToMistakeLogs,
} from "@/server/services/score-center-runtime";

describe("score center runtime helpers", () => {
  it("builds a diagnosing message when the latest event is a failed submit", () => {
    const messages = buildTeacherMessages({
      totalMinutes: 90,
      mode: "strengthen",
      latestCommand: undefined,
      latestSubmit: {
        status: "failed",
        primaryError: "定位错误",
      },
    });

    expect(messages[0]?.kind).toBe("briefing");
    expect(messages.at(-1)?.kind).toBe("diagnosing");
    expect(messages.at(-1)?.content).toContain("定位错误");
  });

  it("computes remaining budget from completed and failed cards", () => {
    const remaining = deriveRemainingBudgetFromCards(90, [
      { estimatedMinutes: 10, status: "completed" },
      { estimatedMinutes: 25, status: "failed" },
      { estimatedMinutes: 20, status: "surfaced" },
    ]);

    expect(remaining).toBe(55);
  });

  it("maps diagnostics into mistake logs for score center planning", () => {
    const logs = mapDiagnosticRecordsToMistakeLogs([
      {
        id: "diag-1",
        userId: "user-alex",
        primaryError: "定位错误",
        evidence: ["定位范围偏移"],
      },
    ]);

    expect(logs).toHaveLength(1);
    expect(logs[0]?.systemTag).toBe("定位错误");
    expect(logs[0]?.evidence).toContain("定位范围偏移");
  });
  it("maps score-center cards to persistence rows without dropping weight breakdowns", () => {
    const rows = mapScoreCenterCardsToTaskCardRows("user-alex", "session-1", [
      {
        cardId: "card-score-task-reading-1",
        taskId: "task-reading-1",
        cardType: "score_boost",
        title: "Reading drill",
        whyThisNow: "High utility",
        estimatedTime: 20,
        difficulty: "medium",
        expectedImpact: "Improve locating",
        targetSkills: ["reading.locating"],
        prerequisite: [],
        actionLabel: "Start",
        destinationPage: "/cet6/reading",
        successSignal: "Finish the drill",
        fallbackAction: "Postpone",
        expectedOutcome: "card-verify-reading-1",
        alternative: "card-recovery-reading-1",
        anchorTo: "paper-2019-12-set2",
        evidenceRefs: ["question-q1", "passage-p1"],
        relation: {
          kind: "conditional",
          nextIfSuccess: "card-verify-reading-1",
          nextIfFail: "card-repair-reading-1",
          alternative: ["card-recovery-reading-1"],
          expiresAt: "2026-04-25T00:00:00.000Z",
        },
        expiry: "2026-04-25T00:00:00.000Z",
        confidence: 0.82,
        utilityScore: 0.64,
        weightBreakdown: {
          summary: "Top drivers: weakness severity",
          terms: [
            {
              key: "weaknessSeverity",
              label: "Weakness severity",
              direction: "positive",
              weight: 0.17,
              value: 0.72,
              contribution: 0.122,
            },
          ],
        },
        originEngine: "score_center_domain",
        status: "surfaced",
        sequence: 0,
      },
    ]);

    expect(rows[0]?.priorityScore).toBe(0.64);
    expect(rows[0]?.weightBreakdown).toEqual(
      expect.objectContaining({
        summary: "Top drivers: weakness severity",
      }),
    );
    expect(rows[0]?.prerequisite).toEqual([]);
    expect(rows[0]?.actionLabel).toBe("Start");
    expect(rows[0]?.fallbackAction).toBe("Postpone");
    expect(rows[0]?.confidence).toBe(0.82);
    expect(rows[0]?.taskType).toBe("reading");
    expect(rows[0]?.taskId).toBe("task-reading-1");
    expect(rows[0]?.expectedOutcome).toBe("card-verify-reading-1");
    expect(rows[0]?.alternative).toBe("card-recovery-reading-1");
    expect(rows[0]?.anchorTo).toBe("paper-2019-12-set2");
    expect(rows[0]?.evidenceRefs).toEqual(["question-q1", "passage-p1"]);
    expect(rows[0]?.relation).toEqual(
      expect.objectContaining({
        nextIfFail: "card-repair-reading-1",
      }),
    );
  });

  it("hydrates persisted task-card rows without replacing orchestration fields with defaults", () => {
    const cards = hydrateTaskCardRows([
      {
        cardId: "card-score-task-reading-1",
        taskId: "task-reading-1",
        taskType: "reading",
        cardType: "score_boost",
        title: "Reading drill",
        whyThisNow: "High utility",
        estimatedMinutes: 20,
        difficulty: "medium",
        expectedImpact: "Improve locating",
        expectedOutcome: "card-verify-reading-1",
        targetSkills: ["reading.locating"],
        prerequisite: ["card-review-vocab"],
        actionLabel: "Start exact paper",
        destinationPage: "/cet6/reading/paper/section?taskId=card-score-task-reading-1",
        successSignal: "Finish the drill",
        fallbackAction: "card-repair-reading-1",
        alternative: "card-recovery-reading-1",
        anchorTo: "weekly-mock-1",
        expiry: new Date("2026-04-25T00:00:00.000Z"),
        confidence: 0.82,
        utilityScore: 0.64,
        priorityScore: 0.64,
        weightBreakdown: {
          summary: "Top drivers: weakness severity",
          terms: [
            {
              key: "weaknessSeverity",
              label: "Weakness severity",
              direction: "positive",
              weight: 0.17,
              value: 0.72,
              contribution: 0.122,
            },
          ],
        },
        relation: {
          kind: "conditional",
          nextIfSuccess: "card-verify-reading-1",
          nextIfFail: "card-repair-reading-1",
          alternative: ["card-recovery-reading-1"],
          expiresAt: "2026-04-25T00:00:00.000Z",
        },
        evidenceRefs: ["question-q1", "passage-p1"],
        status: "surfaced",
        sequence: 1,
        originEngine: "task_scheduler",
        createdAt: new Date("2026-04-24T08:00:00.000Z"),
      },
    ]);

    expect(cards[0]).toEqual(
      expect.objectContaining({
        cardId: "card-score-task-reading-1",
        taskId: "task-reading-1",
        actionLabel: "Start exact paper",
        expiry: "2026-04-25T00:00:00.000Z",
        confidence: 0.82,
        utilityScore: 0.64,
        fallbackAction: "card-repair-reading-1",
        alternative: "card-recovery-reading-1",
        anchorTo: "weekly-mock-1",
        evidenceRefs: ["question-q1", "passage-p1"],
      }),
    );
    expect(cards[0]?.relation).toEqual(
      expect.objectContaining({
        nextIfSuccess: "card-verify-reading-1",
        nextIfFail: "card-repair-reading-1",
      }),
    );
  });

  it("creates an auditable replan payload with old and new card order", () => {
    const audit = createReplanAuditPayload({
      trigger: "execution_result",
      oldCards: [
        { cardId: "card-review", cardType: "review", status: "completed", sequence: 0 },
        { cardId: "card-reading", cardType: "score_boost", status: "failed", sequence: 1 },
      ],
      newCards: [
        { cardId: "card-review", cardType: "review", status: "completed", sequence: 0 },
        { cardId: "card-repair", cardType: "repair", status: "surfaced", sequence: 1 },
        { cardId: "card-reading", cardType: "score_boost", status: "failed", sequence: 2 },
      ],
      reason: "Failed locating task",
    });

    expect(audit.oldSequence).toEqual(["card-review", "card-reading"]);
    expect(audit.newSequence).toEqual(["card-review", "card-repair", "card-reading"]);
    expect(audit.inserted).toEqual(["card-repair"]);
    expect(audit.trigger).toBe("execution_result");
  });
});
