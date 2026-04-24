import type { MistakeLog, ScoreCenterCard, TeacherMessage } from "@/types/domain";

const taskTypes = ["reading", "listening", "vocab", "writing", "mock", "review"] as const;

function inferTaskType(card: ScoreCenterCard) {
  const candidates = [card.taskId, card.cardId, ...card.targetSkills].filter(Boolean).join(" ");
  return taskTypes.find((taskType) => candidates.includes(taskType)) ?? "review";
}

export function deriveRemainingBudgetFromCards(
  totalMinutes: number,
  cards: Array<
    Pick<ScoreCenterCard, "status"> & {
      estimatedTime?: number;
      estimatedMinutes?: number;
    }
  >,
) {
  const used = cards
    .filter((card) => card.status === "completed" || card.status === "failed")
    .reduce((sum, card) => sum + (card.estimatedTime ?? card.estimatedMinutes ?? 0), 0);

  return Math.max(0, totalMinutes - used);
}

export function mapDiagnosticRecordsToMistakeLogs(
  diagnostics: Array<{
    id: string;
    userId: string;
    primaryError: string;
    evidence?: string[] | null;
  }>,
): MistakeLog[] {
  return diagnostics.map((diagnostic) => ({
    id: diagnostic.id,
    userId: diagnostic.userId,
    moduleType: "mistake",
    systemTag: diagnostic.primaryError as MistakeLog["systemTag"],
    evidence: diagnostic.evidence?.join("；") || "最近一次训练暴露出的高风险错因。",
    resolved: false,
  }));
}

export function mapScoreCenterCardsToTaskCardRows(
  userId: string,
  sessionId: string,
  cards: ScoreCenterCard[],
) {
  return cards.map((card) => ({
    sessionId,
    userId,
    cardId: card.cardId,
    taskId: card.taskId,
    taskType: inferTaskType(card),
    cardType: card.cardType,
    title: card.title,
    whyThisNow: card.whyThisNow,
    estimatedMinutes: card.estimatedTime,
    difficulty: card.difficulty,
    expectedImpact: card.expectedImpact,
    expectedOutcome: card.expectedOutcome,
    targetSkills: card.targetSkills,
    prerequisite: card.prerequisite,
    actionLabel: card.actionLabel,
    destinationPage: card.destinationPage,
    successSignal: card.successSignal,
    fallbackAction: card.fallbackAction,
    alternative: card.alternative,
    anchorTo: card.anchorTo,
    evidenceRefs: card.evidenceRefs,
    expiry: new Date(card.expiry),
    confidence: card.confidence,
    utilityScore: card.utilityScore,
    priorityScore: card.utilityScore ?? card.confidence,
    weightBreakdown: card.weightBreakdown,
    relation: card.relation,
    status: card.status,
    sequence: card.sequence,
    originEngine: card.originEngine,
  }));
}

type TaskCardHydrationRow = {
  cardId: string;
  taskId?: string | null;
  taskType: string;
  cardType: string;
  title: string;
  whyThisNow: string;
  estimatedMinutes: number;
  difficulty: string;
  expectedImpact: string;
  expectedOutcome?: string | null;
  targetSkills: unknown;
  prerequisite?: unknown;
  actionLabel?: string | null;
  destinationPage: string;
  successSignal: string;
  fallbackAction?: string | null;
  alternative?: string | null;
  anchorTo?: string | null;
  expiry?: Date | null;
  confidence: number;
  utilityScore?: number | null;
  priorityScore: number;
  weightBreakdown?: unknown;
  relation?: unknown;
  evidenceRefs?: unknown;
  status: string;
  sequence: number;
  originEngine: string;
  createdAt: Date;
};

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function hydrateTaskCardRows(records: TaskCardHydrationRow[]): ScoreCenterCard[] {
  const freshnessThreshold = Date.now() - 5 * 60 * 1000;

  return records.map((card) => ({
    cardId: card.cardId,
    taskId: card.taskId ?? undefined,
    cardType: card.cardType as ScoreCenterCard["cardType"],
    title: card.title,
    whyThisNow: card.whyThisNow,
    estimatedTime: card.estimatedMinutes,
    difficulty: card.difficulty as ScoreCenterCard["difficulty"],
    expectedImpact: card.expectedImpact,
    targetSkills: asStringArray(card.targetSkills),
    prerequisite: asStringArray(card.prerequisite),
    actionLabel: card.actionLabel ?? "进入执行页",
    destinationPage: card.destinationPage,
    successSignal: card.successSignal,
    fallbackAction: card.fallbackAction ?? "如果今天做不了，系统会重排并顺延处理。",
    expiry: card.expiry?.toISOString() ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    confidence: Math.max(0, Math.min(1, card.confidence)),
    utilityScore: card.utilityScore ?? undefined,
    weightBreakdown:
      card.weightBreakdown && typeof card.weightBreakdown === "object"
        ? (card.weightBreakdown as ScoreCenterCard["weightBreakdown"])
        : undefined,
    relation:
      card.relation && typeof card.relation === "object"
        ? (card.relation as ScoreCenterCard["relation"])
        : undefined,
    expectedOutcome: card.expectedOutcome ?? undefined,
    alternative: card.alternative ?? undefined,
    anchorTo: card.anchorTo ?? undefined,
    evidenceRefs: asStringArray(card.evidenceRefs),
    originEngine: card.originEngine,
    status: card.status as ScoreCenterCard["status"],
    sequence: card.sequence,
    isNew:
      card.createdAt.getTime() > freshnessThreshold &&
      (card.originEngine === "diagnostic_engine" || card.originEngine === "repair_support"),
  }));
}

export function createReplanAuditPayload(input: {
  trigger: "execution_result" | "constraint_update" | "manual_override" | "daily_build";
  reason: string;
  oldCards: Array<Pick<ScoreCenterCard, "cardId" | "cardType" | "status" | "sequence">>;
  newCards: Array<Pick<ScoreCenterCard, "cardId" | "cardType" | "status" | "sequence">>;
}) {
  const oldSequence = input.oldCards
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((card) => card.cardId);
  const newSequence = input.newCards
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((card) => card.cardId);
  const oldSet = new Set(oldSequence);
  const newSet = new Set(newSequence);

  return {
    trigger: input.trigger,
    reason: input.reason,
    oldSequence,
    newSequence,
    inserted: newSequence.filter((cardId) => !oldSet.has(cardId)),
    removed: oldSequence.filter((cardId) => !newSet.has(cardId)),
    statusChanges: input.newCards
      .map((next) => {
        const previous = input.oldCards.find((card) => card.cardId === next.cardId);
        return previous && previous.status !== next.status
          ? { cardId: next.cardId, from: previous.status, to: next.status }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
    createdAt: new Date().toISOString(),
  };
}

export function mapScoreCenterCardsToPolicyLogRows(
  userId: string,
  sessionId: string,
  cards: ScoreCenterCard[],
  policyVersion = "score-center-v1",
) {
  return cards
    .filter((card) => card.weightBreakdown)
    .map((card) => {
      const weights: Record<string, number> = {};
      const featureVector: Record<string, number> = {};

      for (const term of card.weightBreakdown?.terms ?? []) {
        weights[term.key] = term.weight;
        featureVector[term.key] = term.value;
      }

      return {
        userId,
        sessionId,
        policyVersion,
        selectedArm: inferTaskType(card),
        utilityScore: card.utilityScore ?? card.confidence,
        weights,
        featureVector,
        propensityScore: Math.max(0.05, Math.min(0.95, card.confidence)),
      };
    });
}

export function buildTeacherMessages(input: {
  totalMinutes: number;
  mode: string;
  latestCommand?: string;
  latestSubmit?: {
    status: "completed" | "failed";
    primaryError?: string;
  };
}): TeacherMessage[] {
  const messages: TeacherMessage[] = [
    {
      id: "teacher-briefing",
      role: "teacher",
      kind: "briefing",
      content: `我已经按今天 ${input.totalMinutes} 分钟的预算整理好任务顺序。当前模式是 ${input.mode}。`,
      createdAt: new Date().toISOString(),
    },
  ];

  if (input.latestCommand) {
    messages.push({
      id: "teacher-command",
      role: "teacher",
      kind: "replanning",
      content: `我已经根据你刚刚的要求“${input.latestCommand}”完成重排，新的任务栈已经生效。`,
      createdAt: new Date().toISOString(),
    });
  }

  if (input.latestSubmit?.status === "failed") {
    messages.push({
      id: "teacher-diagnosing",
      role: "teacher",
      kind: "diagnosing",
      content: `你刚刚主要卡在“${input.latestSubmit.primaryError ?? "关键错因"}”，所以我先插入修补路径，再继续主任务。`,
      createdAt: new Date().toISOString(),
    });
  } else if (input.latestSubmit?.status === "completed") {
    messages.push({
      id: "teacher-replanning-after-complete",
      role: "teacher",
      kind: "replanning",
      content: "这张卡完成得不错，我已经根据最新结果刷新了后续任务顺序。",
      createdAt: new Date().toISOString(),
    });
  }

  return messages;
}
