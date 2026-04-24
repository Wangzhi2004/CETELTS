/**
 * Bayesian Knowledge Tracing (BKT)
 *
 * Standard 4-parameter model:
 *   P(L₀) = pInit   — prior probability of knowing the skill
 *   P(T)  = pLearn  — probability of learning after an opportunity
 *   P(S)  = pSlip   — probability of incorrect response despite mastery
 *   P(G)  = pGuess  — probability of correct response despite non-mastery
 *
 * After observing a response (correct/incorrect), we compute the posterior
 * P(Lₙ | obs) and then apply the learning transition P(Lₙ₊₁).
 */

export type BKTParams = {
  pInit: number;
  pLearn: number;
  pSlip: number;
  pGuess: number;
};

export type BKTState = {
  mastery: number; // P(Lₙ) — current posterior probability of mastery
};

export type BKTUpdateResult = {
  /** Updated mastery posterior P(Lₙ₊₁) after observation + learning transition */
  mastery: number;
  /** P(correct) under the model before the observation */
  pCorrect: number;
  /** Confidence: how far mastery is from 0.5 (uncertainty peak) */
  confidence: number;
};

const DEFAULT_PARAMS: BKTParams = {
  pInit: 0.3,
  pLearn: 0.1,
  pSlip: 0.1,
  pGuess: 0.2,
};

/**
 * Clamp a probability to [ε, 1-ε] to avoid degenerate posteriors.
 */
function clamp(p: number, eps = 0.001): number {
  return Math.max(eps, Math.min(1 - eps, p));
}

/**
 * Compute P(correct) given current mastery and BKT params.
 *
 *   P(correct) = P(L) * (1 - P(S)) + (1 - P(L)) * P(G)
 */
export function predictCorrect(mastery: number, params: BKTParams = DEFAULT_PARAMS): number {
  return mastery * (1 - params.pSlip) + (1 - mastery) * params.pGuess;
}

/**
 * Run one BKT update step.
 *
 * 1. Compute P(correct) from current mastery
 * 2. Compute posterior P(Lₙ | obs) via Bayes' rule
 * 3. Apply learning transition: P(Lₙ₊₁) = P(Lₙ|obs) + (1 - P(Lₙ|obs)) * P(T)
 */
export function updateBKT(
  currentMastery: number,
  isCorrect: boolean,
  params: BKTParams = DEFAULT_PARAMS,
): BKTUpdateResult {
  const pL = clamp(currentMastery);
  const pS = clamp(params.pSlip);
  const pG = clamp(params.pGuess);
  const pT = clamp(params.pLearn);

  // P(correct)
  const pCorrect = pL * (1 - pS) + (1 - pL) * pG;

  // Posterior: P(Lₙ | observation)
  let posteriorLn: number;

  if (isCorrect) {
    // P(L | correct) = P(correct | L) * P(L) / P(correct)
    //                = (1 - pS) * pL / pCorrect
    posteriorLn = ((1 - pS) * pL) / pCorrect;
  } else {
    // P(L | incorrect) = P(incorrect | L) * P(L) / P(incorrect)
    //                  = pS * pL / (1 - pCorrect)
    posteriorLn = (pS * pL) / (1 - pCorrect);
  }

  // Learning transition: P(Lₙ₊₁) = P(Lₙ|obs) + (1 - P(Lₙ|obs)) * P(T)
  const mastery = clamp(posteriorLn + (1 - posteriorLn) * pT);

  // Confidence: distance from maximum uncertainty (0.5)
  const confidence = clamp(Math.abs(mastery - 0.5) * 2);

  return { mastery, pCorrect, confidence };
}

/**
 * Compute the number of additional correct responses needed
 * to push mastery above a threshold (used for review scheduling).
 */
export function estimateTrialsToMastery(
  currentMastery: number,
  targetMastery: number = 0.85,
  params: BKTParams = DEFAULT_PARAMS,
): number {
  let m = currentMastery;
  let trials = 0;
  const maxTrials = 100;

  while (m < targetMastery && trials < maxTrials) {
    const result = updateBKT(m, true, params);
    m = result.mastery;
    trials++;
  }

  return trials;
}

/**
 * Determine appropriate BKT parameters for a skill node based on its
 * historical characteristics. Skills with high recurrence get lower pLearn,
 * skills with high guessability get higher pGuess.
 */
export function calibrateBKTParams(stats: {
  recurrence: number;
  evidenceCount: number;
  historicalAccuracy?: number;
}): BKTParams {
  // Low evidence → stay near priors
  if (stats.evidenceCount < 3) {
    return DEFAULT_PARAMS;
  }

  // pLearn decreases with recurrence (harder to learn if keeps recurring)
  const pLearn = clamp(0.15 - stats.recurrence * 0.08, 0.02);

  // pGuess increases if historical accuracy is suspiciously high relative to mastery
  const pGuess = clamp(
    stats.historicalAccuracy !== undefined
      ? Math.min(0.4, stats.historicalAccuracy * 0.35)
      : 0.2,
    0.05,
  );

  // pSlip increases slightly with fatigue/recurrence
  const pSlip = clamp(0.08 + stats.recurrence * 0.06, 0.02);

  return {
    pInit: DEFAULT_PARAMS.pInit,
    pLearn,
    pSlip,
    pGuess,
  };
}
