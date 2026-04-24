import { describe, expect, it } from "vitest";

import { compactTeacherConversation } from "@/server/ai/teacher-memory";

describe("teacher memory compaction", () => {
  it("keeps recent turns and summarizes older decisions", () => {
    const result = compactTeacherConversation({
      maxRecentMessages: 2,
      messages: [
        {
          id: "m1",
          role: "teacher",
          kind: "briefing",
          content: "Start with review because forgetting risk is high.",
          createdAt: "2026-04-24T09:00:00.000Z",
        },
        {
          id: "m2",
          role: "user",
          kind: "negotiating",
          content: "I only have 25 minutes.",
          createdAt: "2026-04-24T09:01:00.000Z",
        },
        {
          id: "m3",
          role: "teacher",
          kind: "replanning",
          content: "Compressed to review plus reading drill.",
          createdAt: "2026-04-24T09:02:00.000Z",
        },
        {
          id: "m4",
          role: "teacher",
          kind: "diagnosing",
          content: "Locating error triggered repair.",
          createdAt: "2026-04-24T09:03:00.000Z",
        },
      ],
    });

    expect(result.compactedCount).toBe(2);
    expect(result.recentMessages.map((message) => message.id)).toEqual(["m3", "m4"]);
    expect(result.summary?.summary).toContain("25 minutes");
    expect(result.summary?.keyDecisions).toContain("Start with review because forgetting risk is high.");
  });
});
