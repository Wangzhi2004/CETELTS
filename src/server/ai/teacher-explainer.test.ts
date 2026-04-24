import { describe, expect, it } from "vitest";

import {
  buildTeacherEvidenceInput,
  teacherBundleSchema,
} from "@/server/ai/teacher-explainer";

describe("teacher explainer structured evidence", () => {
  it("requires evidence items that bind a signal to an action", () => {
    const parsed = teacherBundleSchema.parse({
      briefing: "Start with the review card.",
      update: "Reading is first because locating weakness is active.",
      evidenceUsed: [
        {
          source: "weight_breakdown",
          cardId: "card-reading-1",
          signal: "weaknessSeverity",
          quote: "reading.locating mastery is low",
          confidence: 0.82,
          actionBinding: "Schedule reading drill before mock verification.",
        },
      ],
      decisionSummary: [
        "Reading drill is first.",
        "Verification stays after repair.",
      ],
    });

    expect(parsed.evidenceUsed[0]?.actionBinding).toContain("reading drill");
    expect(() =>
      teacherBundleSchema.parse({
        briefing: "Start.",
        update: "Continue.",
        evidenceUsed: [],
        decisionSummary: ["One", "Two"],
      }),
    ).toThrow();
  });

  it("builds compact evidence from cards and memory summaries", () => {
    const evidence = buildTeacherEvidenceInput({
      cards: [
        {
          cardId: "card-reading-1",
          cardType: "score_boost",
          title: "Reading drill",
          whyThisNow: "High utility",
          expectedImpact: "Improve locating",
          targetSkills: ["reading.locating"],
          status: "surfaced",
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
        },
      ],
      evidenceSnippets: ["Student missed locating evidence twice."],
      memorySummary: {
        summary: "Learner prefers reading first when time is short.",
        keyDecisions: ["Keep review card first."],
      },
    });

    expect(evidence.some((item) => item.source === "weight_breakdown")).toBe(true);
    expect(evidence.some((item) => item.source === "conversation_summary")).toBe(true);
  });
});
