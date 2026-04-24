type PolicyEvaluationRow = {
  selectedArm: string;
  utilityScore: number;
  propensityScore: number;
  reward?: number | null;
  weights: Record<string, number>;
  featureVector: Record<string, number>;
};

export function estimatePolicyOpe(input: {
  policyVersion: string;
  evaluationWindow: string;
  rows: PolicyEvaluationRow[];
}) {
  const observed = input.rows.filter((row) => typeof row.reward === "number");
  const sampleSize = observed.length;

  if (sampleSize === 0) {
    return {
      policyVersion: input.policyVersion,
      evaluationWindow: input.evaluationWindow,
      sampleSize: 0,
      drEstimate: 0,
      ipsEstimate: 0,
      dmEstimate: 0,
      weightAttribution: {} as Record<string, number>,
      confidence: 0,
    };
  }

  const dmEstimate = average(observed.map((row) => row.utilityScore));
  const ipsEstimate = average(
    observed.map((row) => (row.reward ?? 0) / Math.max(0.01, row.propensityScore)),
  );
  const drEstimate = average(
    observed.map((row) => {
      const reward = row.reward ?? 0;
      const propensity = Math.max(0.01, row.propensityScore);
      return row.utilityScore + (reward - row.utilityScore) / propensity;
    }),
  );
  const weightAttribution = observed.reduce<Record<string, number>>((acc, row) => {
    for (const [key, weight] of Object.entries(row.weights)) {
      const feature = row.featureVector[key] ?? 0;
      const sign = key.toLowerCase().includes("cost") || key.toLowerCase().includes("penalty") ? -1 : 1;
      acc[key] = round((acc[key] ?? 0) + sign * weight * feature);
    }
    return acc;
  }, {});

  for (const key of Object.keys(weightAttribution)) {
    weightAttribution[key] = round(weightAttribution[key] / sampleSize);
  }

  return {
    policyVersion: input.policyVersion,
    evaluationWindow: input.evaluationWindow,
    sampleSize,
    drEstimate: round(drEstimate),
    ipsEstimate: round(ipsEstimate),
    dmEstimate: round(dmEstimate),
    weightAttribution,
    confidence: round(1 / Math.sqrt(sampleSize)),
  };
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number) {
  return Number(value.toFixed(4));
}
