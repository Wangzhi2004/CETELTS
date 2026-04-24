import { describe, expect, it } from "vitest";

import {
  buildMistakePracticePack,
  deriveStudyReportInsights,
} from "@/domain/review-insights";
import { createInitialStudyState } from "@/state/study-state";

describe("review insights", () => {
  it("builds a focused mistake practice pack from repeated tags", () => {
    const state = createInitialStudyState("cet6");

    const pack = buildMistakePracticePack(state.mistakeLogs, "定位错误");

    expect(pack.title).toContain("定位错误");
    expect(pack.items.every((item) => item.systemTag === "定位错误")).toBe(true);
  });

  it("derives next-week focus from study state and queue pressure", () => {
    const state = createInitialStudyState("cet6");
    const report = deriveStudyReportInsights(state);

    expect(report.weakestModule.length).toBeGreaterThan(0);
    expect(report.nextFocus.length).toBeGreaterThan(0);
  });
});
