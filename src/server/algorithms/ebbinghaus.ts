/**
 * Ebbinghaus Forgetting Curve implementation.
 * Pure mathematical functions for decay and retention calculation.
 */

export interface BktPriors {
  pInit: number;
  pLearn: number;
  mastery: number;
  evidenceCount: number;
}

/**
 * Calculates the relative memory strength (S) based on Bayesian Knowledge Tracing priors
 * and current mastery evidence.
 */
export function calculateMemoryStrength(priors: BktPriors): number {
  // Base strength guaranteed to avoid division by zero
  const baseStrength = 0.5;
  // Mastery heavily impacts retention
  const masteryFactor = Math.max(0, priors.mastery) * 5.0;
  // Prior knowledge (pInit) gives a slight structural advantage
  const structuralAdvantage = priors.pInit * 2.0;
  // High evidence count solidifies memory (diminishing returns)
  const practiceVolume = Math.min(2.0, priors.evidenceCount * 0.1);

  return baseStrength + masteryFactor + structuralAdvantage + practiceVolume;
}

/**
 * Calculates the exact retention rate [0, 1] given time elapsed and memory strength.
 * R = e^(-t/S)
 */
export function calculateRetention(daysElapsed: number, memoryStrength: number): number {
  if (daysElapsed < 0) return 1.0;
  if (memoryStrength <= 0) return 0.0;
  return Math.exp(-daysElapsed / memoryStrength);
}

/**
 * Convenience function to compute decay risk (1 - Retention)
 */
export function calculateDecayRisk(daysElapsed: number, priors: BktPriors): number {
  const strength = calculateMemoryStrength(priors);
  const retention = calculateRetention(daysElapsed, strength);
  return Number((1.0 - retention).toFixed(4));
}
