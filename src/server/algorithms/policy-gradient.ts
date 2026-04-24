/**
 * Policy Gradient Optimization logic for Scheduling Utility Weights.
 * Computes gradients based on Doubly Robust offline policy evaluation.
 */

export interface PolicyLogData {
  weights: Record<string, number>;
  propensityScore: number;
  reward: number;
}

export interface OpeResult {
  ipsEstimate: number;
  drEstimate: number;
  gradients: Record<string, number>;
  confidence: number;
  sampleSize: number;
}

export const SCHEDULING_WEIGHT_KEYS = [
  "examWeight", "weaknessSeverity", "recurrence", 
  "forgettingRisk", "transferGain", "deadlinePressure", 
  "timeCost", "fatigueCost"
];

/**
 * Evaluates a batch of policy logs to calculate Doubly Robust estimates
 * and compute policy gradients for weight updates.
 */
export function evaluatePolicyGradients(logs: PolicyLogData[], learningRate = 0.05): OpeResult {
  const sampleSize = logs.length;
  if (sampleSize === 0) {
    return { ipsEstimate: 0, drEstimate: 0, gradients: {}, confidence: 0, sampleSize: 0 };
  }

  let ipsTotal = 0;
  let drTotal = 0;
  
  // 1. Calculate OPE Baseline Estimations
  for (const log of logs) {
    const propensity = Math.max(0.01, log.propensityScore); // Prevent division by zero
    const reward = log.reward;
    
    // Inverse Propensity Score
    ipsTotal += reward / propensity;
    
    // Doubly Robust Estimate (Baseline predicted reward assumed 0.5)
    const baselinePrediction = 0.5; 
    drTotal += baselinePrediction + ((reward - baselinePrediction) / propensity);
  }

  const ipsEstimate = ipsTotal / sampleSize;
  const drEstimate = drTotal / sampleSize;

  // 2. Compute Gradients via Advantage (Reward - Baseline)
  const gradients: Record<string, number> = {};
  SCHEDULING_WEIGHT_KEYS.forEach(k => gradients[k] = 0);

  let variance = 0;
  for (const log of logs) {
    const advantage = log.reward - drEstimate;
    const weights = log.weights;
    
    for (const key of SCHEDULING_WEIGHT_KEYS) {
      if (typeof weights[key] === "number") {
        gradients[key] += advantage * weights[key];
      }
    }
    variance += advantage * advantage;
  }

  // Normalize and apply learning rate
  for (const key of Object.keys(gradients)) {
    gradients[key] = (gradients[key] / sampleSize) * learningRate;
  }

  // Rough confidence score: Lower variance = higher confidence
  const stdDev = Math.sqrt(variance / sampleSize);
  const confidence = Math.max(0, 1.0 - stdDev);

  return {
    ipsEstimate,
    drEstimate,
    gradients,
    confidence,
    sampleSize
  };
}

/**
 * Safely applies gradients to current weights with boundary enforcement.
 */
export function applyGradientsToWeights(
  currentWeights: Record<string, number>, 
  gradients: Record<string, number>,
  minWeight = 0.01,
  maxWeight = 0.40
): Record<string, number> {
  const newWeights = { ...currentWeights };
  
  for (const key of SCHEDULING_WEIGHT_KEYS) {
    if (gradients[key] !== undefined && currentWeights[key] !== undefined) {
      const updated = currentWeights[key] + gradients[key];
      // Bound the weights to prevent extreme policies
      newWeights[key] = Math.max(minWeight, Math.min(maxWeight, Number(updated.toFixed(4))));
    }
  }
  
  return newWeights;
}
