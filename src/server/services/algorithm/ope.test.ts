import { describe, expect, it } from "vitest";

import { estimatePolicyOpe } from "@/server/services/algorithm/ope";

describe("offline policy evaluation", () => {
  it("computes direct, IPS, and doubly robust estimates with weight attribution", () => {
    const report = estimatePolicyOpe({
      policyVersion: "score-center-v1",
      evaluationWindow: "7d",
      rows: [
        {
          selectedArm: "reading",
          utilityScore: 0.62,
          propensityScore: 0.5,
          reward: 0.8,
          weights: { weaknessSeverity: 0.17, timeCost: 0.05 },
          featureVector: { weaknessSeverity: 0.7, timeCost: 0.4 },
        },
        {
          selectedArm: "listening",
          utilityScore: 0.4,
          propensityScore: 0.25,
          reward: 0.2,
          weights: { weaknessSeverity: 0.17, timeCost: 0.05 },
          featureVector: { weaknessSeverity: 0.3, timeCost: 0.8 },
        },
      ],
    });

    expect(report.sampleSize).toBe(2);
    expect(report.dmEstimate).toBeCloseTo(0.51, 2);
    expect(report.ipsEstimate).toBeCloseTo(1.2, 2);
    expect(report.drEstimate).toBeCloseTo(0.29, 2);
    expect(report.weightAttribution.weaknessSeverity).toBeGreaterThan(0);
    expect(report.weightAttribution.timeCost).toBeLessThan(0);
  });
});
