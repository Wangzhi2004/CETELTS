import { differenceInCalendarDays } from "date-fns";

import type {
  DailyTask,
  ExamType,
  Goal,
  MistakeLog,
  ReviewQueueEntry,
  ScoreCenterCard,
  ScoreCenterMode,
  ScoreCenterState,
  TaskType,
  TeacherMessage,
} from "@/types/domain";

const taskRoutes: Record<Exclude<TaskType, "review">, string> = {
  reading: "/reading/paper-2019-12-set2/section-reading-2019-12-a",
  listening: "/listening/paper-2020-06-set1/section-listening-2020-06-a",
  vocab: "/vocab",
  writing: "/writing",
  mock: "/mock",
};

const taskSkillMap: Record<TaskType, string[]> = {
  review: ["memory.recall", "mistake.repair"],
  reading: ["reading.locating", "reading.paraphrase"],
  listening: ["listening.transition", "listening.number"],
  vocab: ["vocab.recall", "vocab.precision"],
  writing: ["writing.outline", "writing.argument"],
  mock: ["exam.stability", "time.management"],
};

type SkillSignal = {
  skillNode: string;
  mastery: number;
  confidence: number;
  decayRisk: number;
  speedDeficit: number;
  recurrence: number;
  transferGain: number;
  stressDrop: number;
  evidenceCount: number;
};

const utilityWeights = {
  examWeight: 0.2,
  weaknessSeverity: 0.17,
  recurrence: 0.12,
  forgettingRisk: 0.12,
  transferGain: 0.09,
  deadlinePressure: 0.08,
  confidenceAdjustment: 0.06,
  irtAlignment: 0.06,
  timeCost: 0.05,
  fatigueCost: 0.03,
  modalityRepetitionPenalty: 0.02,
};

type UtilityBreakdown = NonNullable<ScoreCenterCard["weightBreakdown"]>;

type ScoredTask = {
  task: DailyTask;
  utility: {
    score: number;
    breakdown: UtilityBreakdown;
  };
};

function nowIso() {
  return new Date().toISOString();
}

function daysToExam(goal: Goal) {
  return Math.max(0, differenceInCalendarDays(new Date(goal.examDate), new Date()));
}

function resolveMode(goal: Goal, budgetMinutes: number, energy: "normal" | "low"): ScoreCenterMode {
  const days = daysToExam(goal);

  if (energy === "low" || budgetMinutes <= 30) {
    return "light";
  }

  if (days <= 14) {
    return "sprint";
  }

  if (goal.phase === "recovery") {
    return "recovery";
  }

  return "strengthen";
}

function createTeacherMessage(
  kind: TeacherMessage["kind"],
  content: string,
  role: TeacherMessage["role"] = "teacher",
  extra?: { decisionSummary?: string; evidenceUsed?: TeacherMessage["evidenceUsed"]; boundCards?: string[]; userActionExpected?: string },
): TeacherMessage {
  return {
    id: `msg-${kind}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    kind,
    content,
    createdAt: nowIso(),
    decisionSummary: extra?.decisionSummary,
    evidenceUsed: extra?.evidenceUsed,
    boundCards: extra?.boundCards,
    userActionExpected: extra?.userActionExpected,
  };
}

function createCard(
  partial: Omit<ScoreCenterCard, "sequence" | "status" | "confidence" | "originEngine"> & {
    confidence?: number;
    originEngine?: string;
    status?: ScoreCenterCard["status"];
    sequence?: number;
  },
): ScoreCenterCard {
  return {
    sequence: partial.sequence ?? 0,
    status: partial.status ?? "surfaced",
    confidence: partial.confidence ?? 0.8,
    originEngine: partial.originEngine ?? "scheduler",
    ...partial,
  };
}

function findReviewDestination(exam: ExamType, entry: ReviewQueueEntry) {
  if (entry.entityType === "vocab") {
    return `/${exam}/vocab`;
  }

  if (entry.entityType === "essay") {
    return `/${exam}/writing`;
  }

  return `/${exam}/mistakes`;
}

function buildReviewCard(exam: ExamType, reviewQueue: ReviewQueueEntry[]): ScoreCenterCard | null {
  const top = reviewQueue[0];

  if (!top) {
    return null;
  }

  const title =
    top.entityType === "vocab" ? "必修复习：高频错词快速回忆" : "必修复习：昨日错因短复盘";

  return createCard({
    cardId: `card-review-${top.entityId}`,
    cardType: "review",
    title,
    whyThisNow: "这是今天的前置卡。先处理遗忘风险和复发风险，再做主任务，后面的收益才不会被前面的漏洞吃掉。",
    estimatedTime: top.entityType === "vocab" ? 8 : 10,
    difficulty: "low",
    expectedImpact: "先止损，降低今天的重复犯错概率。",
    targetSkills: top.entityType === "vocab" ? ["vocab.recall"] : ["mistake.repair"],
    prerequisite: [],
    actionLabel: "先完成这张",
    destinationPage: findReviewDestination(exam, top),
    successSignal: "完成一次短复盘并确认关键错因。",
    fallbackAction: "如果今天时间被压缩，系统优先保留这张卡，不会先砍它。",
    expiry: top.nextReviewAt,
    confidence: 0.9,
    originEngine: "review_queue",
  });
}

function buildTaskCard(
  exam: ExamType,
  task: DailyTask,
  cardType: ScoreCenterCard["cardType"] = "score_boost",
  utility?: ScoredTask["utility"],
): ScoreCenterCard {
  const difficulty =
    task.estimatedMinutes >= 40 ? "high" : task.estimatedMinutes >= 20 ? "medium" : "low";
  const cardId = `card-${cardType}-${task.id}`;
  const destination =
    task.taskType === "review" ? `/${exam}/mistakes` : `/${exam}${taskRoutes[task.taskType]}`;
  const destinationPage = `${destination}${destination.includes("?") ? "&" : "?"}taskId=${encodeURIComponent(cardId)}`;

  const titleMap: Partial<Record<ScoreCenterCard["cardType"], string>> = {
    verification: `模考验证：${task.title}`,
    recovery: `低负荷恢复：${task.title}`,
  };

  return createCard({
    cardId,
    taskId: task.id,
    cardType,
    title: titleMap[cardType] ?? task.title,
    whyThisNow:
      cardType === "verification"
        ? "这张卡用来验证前面的修补是否真的转化成了考试表现，避免只做练习、不看迁移。"
        : cardType === "recovery"
          ? "今天需要维持节奏，但不应该继续增加高负荷。先用低负荷任务保证不断线。"
          : "这是当前单位时间最值钱的主任务之一，优先覆盖高权重模块里的薄弱项。",
    estimatedTime: task.estimatedMinutes,
    difficulty,
    expectedImpact:
      task.taskType === "mock" ? "校准真实考试表现与压力衰减。" : "直接拉动关键能力节点和分数收益。",
    targetSkills: taskSkillMap[task.taskType],
    prerequisite: [],
    actionLabel: cardType === "verification" ? "开始验证" : "进入执行页",
    destinationPage,
    successSignal: `完成 ${task.title} 并把结果回流给提分中心。`,
    fallbackAction: "如果今天做不完，系统会将它降级或顺延，而不是静默丢失。",
    expiry: task.scheduledAt,
    confidence: Number((0.72 + task.priority / 500).toFixed(2)),
    utilityScore: utility?.score,
    weightBreakdown: utility?.breakdown,
    evidenceRefs: task.sourceEntityId ? [task.sourceEntityId] : [],
    originEngine: "task_scheduler",
    status:
      task.status === "done"
        ? "completed"
        : task.status === "in_progress"
          ? "in_progress"
          : "surfaced",
  });
}

function buildPitfallCard(exam: ExamType, mistakeLogs: MistakeLog[]): ScoreCenterCard | null {
  const recurrence = new Map<string, number>();

  for (const mistake of mistakeLogs) {
    recurrence.set(mistake.systemTag, (recurrence.get(mistake.systemTag) ?? 0) + 1);
  }

  const [topLabel, count] = [...recurrence.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  if (!topLabel || !count || count < 2) {
    return null;
  }

  return createCard({
    cardId: `card-pitfall-${topLabel}`,
    cardType: "pitfall",
    title: `高频坑位：${topLabel} 微修补`,
    whyThisNow: `这个错因最近已经连续出现 ${count} 次，不先拆掉这个坑，后面的主任务仍会继续漏分。`,
    estimatedTime: 10,
    difficulty: "medium",
    expectedImpact: "降低同类错误 7 天内的复发率。",
    targetSkills: ["error.pattern", topLabel],
    prerequisite: [],
    actionLabel: "先补这个洞",
    destinationPage: `/${exam}/mistakes`,
    successSignal: "识别这个高频坑位，并完成一次针对性修补。",
    fallbackAction: "如果今天预算不足，它会顺延到明天并维持高优先级。",
    expiry: nowIso(),
    confidence: 0.84,
    evidenceRefs: mistakeLogs.filter(m => m.systemTag === topLabel).map(m => m.id).slice(0, 3),
    originEngine: "mistake_recurrence",
  });
}

function buildRecoveryTail(exam: ExamType, sourceTask?: DailyTask): ScoreCenterCard {
  const fallbackTask =
    sourceTask ??
    ({
      id: "task-recovery-fallback",
      title: "轻量巩固：高频错因回忆",
      subtitle: "短复盘",
      examType: exam,
      taskType: "vocab",
      status: "todo",
      estimatedMinutes: 8,
      scheduledAt: nowIso(),
      priority: 40,
      sourceEntityType: "score_center",
      sourceEntityId: "recovery-fallback",
    } as DailyTask);

  return createCard({
    ...buildTaskCard(exam, fallbackTask, "recovery"),
    cardId: `card-recovery-${fallbackTask.id}`,
  });
}

function buildVerificationTail(exam: ExamType, mockTask?: DailyTask): ScoreCenterCard {
  const fallbackTask = {
    id: mockTask?.id ?? "task-verification-fallback",
    title: "半套限时验证",
    subtitle: mockTask ? `${mockTask.title} 的短验证版` : "验证修补是否生效",
    examType: exam,
    taskType: "mock" as const,
    status: "todo" as const,
    estimatedMinutes: Math.min(mockTask?.estimatedMinutes ?? 20, 20),
    scheduledAt: mockTask?.scheduledAt ?? nowIso(),
    priority: Math.max(mockTask?.priority ?? 65, 65),
    sourceEntityType: mockTask?.sourceEntityType ?? "score_center",
    sourceEntityId: mockTask?.sourceEntityId ?? "verification-fallback",
  } satisfies DailyTask;

  return createCard({
    ...buildTaskCard(exam, fallbackTask, "verification"),
    cardId: `card-verification-${fallbackTask.id}`,
  });
}

function reorderSequences(cards: ScoreCenterCard[]) {
  return cards.map((card, index) => ({
    ...card,
    sequence: index,
  }));
}

function clampCardsToBudget(cards: ScoreCenterCard[], budgetMinutes: number) {
  const selected: ScoreCenterCard[] = [];
  let used = 0;

  for (const card of cards) {
    if (selected.length === 0) {
      selected.push(card);
      used += card.estimatedTime;
      continue;
    }

    if (used + card.estimatedTime <= budgetMinutes || selected.length < 2) {
      selected.push(card);
      used += card.estimatedTime;
    }
  }

  return reorderSequences(selected);
}

function getExamWeight(taskType: TaskType) {
  switch (taskType) {
    case "reading":
      return 0.92;
    case "listening":
      return 0.86;
    case "writing":
      return 0.78;
    case "mock":
      return 0.82;
    case "vocab":
      return 0.66;
    default:
      return 0.58;
  }
}

function getTaskDifficultyValue(task: DailyTask) {
  if (task.estimatedMinutes >= 40) return 0.78;
  if (task.estimatedMinutes >= 20) return 0.58;
  return 0.38;
}

function findRelevantSkillSignals(task: DailyTask, skillStates: SkillSignal[]) {
  return skillStates.filter((skillState) =>
    taskSkillMap[task.taskType].some((skill) =>
      skillState.skillNode.startsWith(skill.split(".")[0]) || skillState.skillNode === skill,
    ),
  );
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundMetric(value: number) {
  return Number(value.toFixed(3));
}

function buildUtilityBreakdown(
  terms: Array<{
    key: string;
    label: string;
    direction: "positive" | "negative";
    weight: number;
    value: number;
  }>,
): UtilityBreakdown {
  const resolvedTerms = terms.map((term) => ({
    ...term,
    weight: roundMetric(term.weight),
    value: roundMetric(term.value),
    contribution: roundMetric(
      term.direction === "negative" ? -term.weight * term.value : term.weight * term.value,
    ),
  }));
  const topDrivers = [...resolvedTerms]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3)
    .map((term) => term.label.toLowerCase());

  return {
    summary: `主要驱动：${topDrivers.join("、")}`,
    terms: resolvedTerms,
  };
}

function scoreTaskUtility(input: {
  task: DailyTask;
  goal: Goal;
  mode: ScoreCenterMode;
  preferredFocus?: TaskType;
  reviewQueue: ReviewQueueEntry[];
  mistakeLogs: MistakeLog[];
  skillStates: SkillSignal[];
  previousTaskType?: TaskType;
}) {
  const relevantSkills = findRelevantSkillSignals(input.task, input.skillStates);
  const weaknessSeverity =
    relevantSkills.length > 0 ? average(relevantSkills.map((skill) => 1 - skill.mastery)) : 0.45;
  const recurrence =
    relevantSkills.length > 0
      ? average(relevantSkills.map((skill) => skill.recurrence))
      : input.mistakeLogs.some((mistake) =>
            taskSkillMap[input.task.taskType].some((skill) =>
              mistake.systemTag.toLowerCase().includes(skill.split(".")[1] ?? ""),
            ),
          )
        ? 0.7
        : 0.35;
  const forgettingRisk =
    relevantSkills.length > 0
      ? average(relevantSkills.map((skill) => skill.decayRisk))
      : input.reviewQueue.some((entry) =>
            taskSkillMap[input.task.taskType].some((skill) =>
              entry.entityId.toLowerCase().includes(skill.split(".")[0]),
            ),
          )
        ? 0.68
        : 0.28;
  const transferGain =
    relevantSkills.length > 0 ? average(relevantSkills.map((skill) => skill.transferGain)) : 0.4;
  const confidenceAdjustment =
    relevantSkills.length > 0
      ? average(
          relevantSkills.map((skill) => {
            const evidencePenalty = skill.evidenceCount < 4 ? 0.18 : 0;
            return Math.max(0, 1 - skill.confidence + evidencePenalty);
          }),
        )
      : 0.24;
  const deadlinePressure = Math.min(1, Math.max(0, (14 - daysToExam(input.goal)) / 14));
  const taskDifficulty = getTaskDifficultyValue(input.task);
  const irtAlignment =
    relevantSkills.length > 0
      ? average(relevantSkills.map((skill) => 1 - Math.abs(skill.mastery - taskDifficulty)))
      : 0.5;
  const timeCost = Math.min(1, input.task.estimatedMinutes / Math.max(30, input.goal.dailyMinutes));
  const fatigueCost =
    relevantSkills.length > 0
      ? average(relevantSkills.map((skill) => (skill.speedDeficit + skill.stressDrop) / 2))
      : input.mode === "light"
        ? 0.55
        : 0.35;
  const modalityPenalty = input.previousTaskType === input.task.taskType ? 0.4 : 0;
  const preferredBoost = input.preferredFocus === input.task.taskType ? 0.06 : 0;
  const sprintBoost = input.mode === "sprint" && input.task.taskType === "mock" ? 0.1 : 0;

  const breakdown = buildUtilityBreakdown([
    {
      key: "examWeight",
      label: "考试权重",
      direction: "positive",
      weight: utilityWeights.examWeight,
      value: getExamWeight(input.task.taskType),
    },
    {
      key: "weaknessSeverity",
      label: "薄弱严重度",
      direction: "positive",
      weight: utilityWeights.weaknessSeverity,
      value: weaknessSeverity,
    },
    {
      key: "recurrence",
      label: "复发频率",
      direction: "positive",
      weight: utilityWeights.recurrence,
      value: recurrence,
    },
    {
      key: "forgettingRisk",
      label: "遗忘风险",
      direction: "positive",
      weight: utilityWeights.forgettingRisk,
      value: forgettingRisk,
    },
    {
      key: "transferGain",
      label: "迁移收益",
      direction: "positive",
      weight: utilityWeights.transferGain,
      value: transferGain,
    },
    {
      key: "deadlinePressure",
      label: "截止压力",
      direction: "positive",
      weight: utilityWeights.deadlinePressure,
      value: deadlinePressure,
    },
    {
      key: "confidenceAdjustment",
      label: "置信度修正",
      direction: "positive",
      weight: utilityWeights.confidenceAdjustment,
      value: confidenceAdjustment,
    },
    {
      key: "irtAlignment",
      label: "IRT 对齐度",
      direction: "positive",
      weight: utilityWeights.irtAlignment,
      value: irtAlignment,
    },
    {
      key: "timeCost",
      label: "时间成本",
      direction: "negative",
      weight: utilityWeights.timeCost,
      value: timeCost,
    },
    {
      key: "fatigueCost",
      label: "疲劳成本",
      direction: "negative",
      weight: utilityWeights.fatigueCost,
      value: fatigueCost,
    },
    {
      key: "modalityRepetitionPenalty",
      label: "模态重复惩罚",
      direction: "negative",
      weight: utilityWeights.modalityRepetitionPenalty,
      value: modalityPenalty,
    },
    {
      key: "preferredFocus",
      label: "偏好聚焦",
      direction: "positive",
      weight: 1,
      value: preferredBoost,
    },
    {
      key: "sprintBoost",
      label: "冲刺加成",
      direction: "positive",
      weight: 1,
      value: sprintBoost,
    },
  ]);

  const score = roundMetric(
    breakdown.terms.reduce((sum, term) => sum + term.contribution, 0),
  );

  return {
    score,
    breakdown,
  };
}

function rankTasks(input: {
  tasks: DailyTask[];
  goal: Goal;
  mode: ScoreCenterMode;
  preferredFocus?: TaskType;
  reviewQueue: ReviewQueueEntry[];
  mistakeLogs: MistakeLog[];
  skillStates: SkillSignal[];
}) {
  return [...input.tasks]
    .filter((task) => task.status !== "done")
    .map((task) => ({
      task,
      utility: scoreTaskUtility({
        task,
        goal: input.goal,
        mode: input.mode,
        preferredFocus: input.preferredFocus,
        reviewQueue: input.reviewQueue,
        mistakeLogs: input.mistakeLogs,
        skillStates: input.skillStates,
      }),
    }))
    .sort((a, b) => b.utility.score - a.utility.score);
}

function buildCards(input: {
  exam: ExamType;
  goal: Goal;
  tasks: DailyTask[];
  reviewQueue: ReviewQueueEntry[];
  mistakeLogs: MistakeLog[];
  budgetMinutes: number;
  mode: ScoreCenterMode;
  preferredFocus?: TaskType;
  skillStates: SkillSignal[];
}) {
  const cards: ScoreCenterCard[] = [];
  const rankedItems = rankTasks({
    tasks: input.tasks,
    goal: input.goal,
    mode: input.mode,
    preferredFocus: input.preferredFocus,
    reviewQueue: input.reviewQueue,
    mistakeLogs: input.mistakeLogs,
    skillStates: input.skillStates,
  });
  const rankedTasks = rankedItems.map((item) => item.task);
  const utilityByTaskId = new Map(rankedItems.map((item) => [item.task.id, item.utility]));
  const reviewCard = buildReviewCard(input.exam, input.reviewQueue);
  const mainTasks = rankedTasks.filter((task) => task.taskType !== "mock").slice(0, 2);
  const pitfallCard = buildPitfallCard(input.exam, input.mistakeLogs);
  const mockTask = rankedTasks.find((task) => task.taskType === "mock");
  const lowLoadTask = rankedTasks
    .filter((task) => !mainTasks.some((mainTask) => mainTask.id === task.id))
    .sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)[0];

  if (reviewCard) {
    cards.push(reviewCard);
  }

  if (input.mode === "sprint") {
    if (mainTasks[0]) {
      cards.push(buildTaskCard(input.exam, mainTasks[0], "score_boost", utilityByTaskId.get(mainTasks[0].id)));
    }
    cards.push(buildVerificationTail(input.exam, mockTask));
    if (pitfallCard) {
      cards.push(pitfallCard);
    }
    if (mainTasks[1]) {
      cards.push(buildTaskCard(input.exam, mainTasks[1], "score_boost", utilityByTaskId.get(mainTasks[1].id)));
    }
  } else {
    for (const task of mainTasks) {
      cards.push(buildTaskCard(input.exam, task, "score_boost", utilityByTaskId.get(task.id)));
    }
    if (pitfallCard) {
      cards.push(pitfallCard);
    }
    cards.push(buildRecoveryTail(input.exam, lowLoadTask));
  }

  const clamped = clampCardsToBudget(reorderSequences(cards), input.budgetMinutes);

  for (let i = 0; i < clamped.length; i++) {
    const card = clamped[i];
    const prevCard = i > 0 ? clamped[i - 1] : undefined;
    const nextCard = clamped[i + 1];

    if (prevCard && (card.cardType === "score_boost" || card.cardType === "verification" || card.cardType === "pitfall")) {
      card.relation = {
        ...card.relation,
        kind: card.relation?.kind ?? "sequence",
        dependsOn: [prevCard.cardId],
        expiresAt: card.expiry,
        anchorTo: card.anchorTo,
      };
      card.prerequisite = [prevCard.cardId];
    }

    if (card.cardType === "score_boost") {
      const fallback = clamped.find(c => c.cardType === "repair" || c.cardType === "pitfall" || c.cardType === "recovery");
      if (fallback && fallback.cardId !== card.cardId && card.sequence < fallback.sequence) {
        card.fallbackAction = fallback.cardId;
        card.relation = {
          ...card.relation,
          kind: "conditional",
          nextIfSuccess: nextCard?.cardId,
          nextIfFail: fallback.cardId,
          expiresAt: card.expiry,
          anchorTo: card.anchorTo,
        };
      }
    }

    if (card.cardType === "repair" || card.cardType === "pitfall") {
       const verify = clamped.find(c => c.cardType === "verification" || c.cardType === "score_boost");
       if (verify && verify.cardId !== card.cardId && card.sequence < verify.sequence) {
          card.expectedOutcome = verify.cardId;
          card.relation = {
            ...card.relation,
            kind: "conditional",
            nextIfSuccess: verify.cardId,
            nextIfFail: card.cardId,
            expiresAt: card.expiry,
          };
       }
    }

    if (card.cardType === "recovery") {
       const alt = clamped.find(c => c.cardType === "score_boost");
       if (alt && alt.cardId !== card.cardId) {
          card.alternative = alt.cardId;
          card.relation = {
             ...card.relation,
             kind: "alternative",
             alternativeTo: alt.cardId,
             alternative: [alt.cardId],
             expiresAt: card.expiry,
          };
       }
    }
    
    if (card.cardType === "verification") {
       card.anchorTo = "weekly_mock";
       card.relation = {
          ...card.relation,
          kind: card.relation?.kind ?? "conditional",
          expiresAt: card.expiry,
          anchorTo: "weekly_mock",
       };
    }
  }

  return clamped;
}

function buildPanel(
  exam: ExamType,
  goal: Goal,
  budgetMinutes: number,
  mode: ScoreCenterMode,
  mistakeLogs: MistakeLog[],
) {
  const recurrence = new Map<string, number>();

  for (const mistake of mistakeLogs) {
    recurrence.set(mistake.systemTag, (recurrence.get(mistake.systemTag) ?? 0) + 1);
  }

  const topMistakes = [...recurrence.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  const estimatedScore =
    exam === "cet6" ? goal.targetScore - 63 : Number((goal.targetScore - 0.8).toFixed(1));

  return {
    targetExam: exam,
    targetScore: goal.targetScore,
    estimatedScore,
    daysToExam: daysToExam(goal),
    scoreTrend: exam === "cet6" ? [458, 472, 479, 487, 495] : [5.5, 5.7, 5.8, 6, 6.1],
    topMistakes:
      topMistakes.length > 0 ? topMistakes : ["定位错误", "词汇不认识", "时间压力"],
    weakestSkills:
      exam === "cet6"
        ? ["reading.locating", "listening.transition", "writing.argument"]
        : ["reading.paraphrase", "listening.number", "writing.cohesion"],
    remainingBudgetMinutes: budgetMinutes,
    mode,
    expectedGain:
      exam === "cet6" ? "预计修复 2 个高频失分点" : "预计提升 0.2 band 的稳定输出",
    nextMockWindow: mode === "sprint" ? "48 小时内" : "本周末",
  };
}

export function createScoreCenterState(input: {
  exam: ExamType;
  goal: Goal;
  tasks: DailyTask[];
  reviewQueue: ReviewQueueEntry[];
  mistakeLogs: MistakeLog[];
  preferredFocus?: TaskType;
  energy?: "normal" | "low";
  totalMinutes?: number;
  skillStates?: SkillSignal[];
}): ScoreCenterState {
  const totalMinutes = input.totalMinutes ?? input.goal.dailyMinutes;
  const energy = input.energy ?? "normal";
  const mode = resolveMode(input.goal, totalMinutes, energy);
  const cards = buildCards({
    exam: input.exam,
    goal: input.goal,
    tasks: input.tasks,
    reviewQueue: input.reviewQueue,
    mistakeLogs: input.mistakeLogs,
    budgetMinutes: totalMinutes,
    mode,
    preferredFocus: input.preferredFocus,
    skillStates: input.skillStates ?? [],
  });

  return {
    pageStatus: "ready",
    conversationState: "briefing",
    mode,
    budget: {
      totalMinutes,
      remainingMinutes: totalMinutes,
    },
    cards,
    teacherMessages: [
      createTeacherMessage(
        "opening_strategy",
        `今天我先给你排好任务顺序：先复习校准，再做最值钱的主任务，尾部留验证或恢复卡收口。当前总预算 ${totalMinutes} 分钟，模式 ${mode}。`,
        "teacher",
        {
          decisionSummary: `当前预算 ${totalMinutes} 分钟，模式 ${mode}，已按效用排序生成任务栈。`,
          evidenceUsed: [
            { source: "review_queue", signal: "forgetting_risk", quote: `复习队列中有到期条目，先处理可降低今天重复犯错概率`, confidence: 0.85 },
          ],
          boundCards: cards.slice(0, 2).map((c) => c.cardId),
          userActionExpected: "查看任务栈并开始第一张卡",
        },
      ),
    ],
    decisionSummary: [
      "第一张卡优先处理遗忘和复发风险，避免今天继续在旧坑里掉分。",
      "中段只保留 1 到 2 张最值钱的主卡，直接打高权重薄弱项。",
      "尾部安排验证或恢复，不让今天的训练只推进、不验收。",
    ],
    panel: buildPanel(input.exam, input.goal, totalMinutes, mode, input.mistakeLogs),
    constraints: {
      preferredFocus: input.preferredFocus,
      energy,
    },
    lastUpdatedAt: nowIso(),
  };
}

function explainBudgetReplan(totalMinutes: number, keptCards: number, removedCards: number) {
  return `已按 ${totalMinutes} 分钟重排，只保留最关键的 ${keptCards} 张卡，砍掉了 ${removedCards} 张低收益卡。`;
}

function withBudgetReplan(state: ScoreCenterState, totalMinutes: number, input: string) {
  const cards = clampCardsToBudget(state.cards, totalMinutes);
  const removedCount = Math.max(0, state.cards.length - cards.length);

  return {
    ...state,
    pageStatus: "replanned" as const,
    conversationState: "replanning" as const,
    mode: totalMinutes <= 30 ? "light" : state.mode,
    budget: {
      totalMinutes,
      remainingMinutes: totalMinutes,
    },
    cards,
    panel: {
      ...state.panel,
      remainingBudgetMinutes: totalMinutes,
      mode: totalMinutes <= 30 ? "light" : state.mode,
    },
    teacherMessages: [
      ...state.teacherMessages,
      createTeacherMessage("negotiating", input, "user"),
      createTeacherMessage(
        "replan_explanation",
        explainBudgetReplan(totalMinutes, cards.length, removedCount),
        "teacher",
        {
          evidenceUsed: [
            { source: "weight_breakdown", signal: "budget_constraint", quote: `预算压缩到 ${totalMinutes} 分钟后，保留前置复习卡和最高收益主卡`, confidence: 0.88 },
          ],
          boundCards: cards.slice(0, 2).map((c) => c.cardId),
          userActionExpected: "确认新的任务栈并开始执行",
        },
      ),
    ],
    decisionSummary: [
      ...state.decisionSummary,
      `预算压缩到 ${totalMinutes} 分钟后，系统优先保留前置复习卡和最高收益主卡。`,
    ],
    lastUpdatedAt: nowIso(),
  };
}

export function applyTeacherCommand(state: ScoreCenterState, input: string): ScoreCenterState {
  const normalized = input.replace(/\s+/g, "");
  const timeMatch = normalized.match(/(\d+)\s*分钟/);

  if (timeMatch) {
    return withBudgetReplan(state, Number(timeMatch[1]), input);
  }

  if (normalized.includes("状态差") || normalized.includes("轻一点")) {
    const lightCards = clampCardsToBudget(
      state.cards.map((card, index) =>
        index >= 1 && index <= 2
          ? {
              ...card,
              cardType: index === 1 ? "recovery" : card.cardType,
              title: index === 1 ? `低负荷恢复：${card.title}` : card.title,
            }
          : card,
      ),
      Math.min(state.budget.totalMinutes, 35),
    );

    return {
      ...state,
      pageStatus: "replanned",
      conversationState: "negotiating",
      mode: "light",
      constraints: {
        ...state.constraints,
        energy: "low",
      },
      cards: lightCards,
      panel: {
        ...state.panel,
        mode: "light",
      },
      teacherMessages: [
        ...state.teacherMessages,
        createTeacherMessage("negotiating", input, "user"),
        createTeacherMessage(
          "constraint_ack",
          "已切到轻量模式。我保留节奏，但会降低任务长度和认知负荷，不让你今天彻底脱线。",
          "teacher",
          {
            evidenceUsed: [
              { source: "conversation_summary", signal: "energy_low", quote: "用户自报状态差，系统降级到轻量模式", confidence: 0.92 },
            ],
            userActionExpected: "确认轻量模式并开始第一张卡",
          },
        ),
      ],
      lastUpdatedAt: nowIso(),
    };
  }

  if (normalized.includes("先阅读")) {
    return {
      ...state,
      conversationState: "negotiating",
      constraints: {
        ...state.constraints,
        preferredFocus: "reading",
      },
      teacherMessages: [
        ...state.teacherMessages,
        createTeacherMessage("negotiating", input, "user"),
        createTeacherMessage(
          "constraint_ack",
          "我会提高阅读卡的权重，但不会牺牲今天必须完成的复习内容。",
          "teacher",
          {
            evidenceUsed: [
              { source: "weight_breakdown", signal: "preferred_focus", quote: "用户偏好阅读，提升阅读相关卡优先级", confidence: 0.90 },
            ],
            userActionExpected: "确认优先级调整",
          },
        ),
      ],
      lastUpdatedAt: nowIso(),
    };
  }

  if (normalized.includes("冲刺")) {
    return {
      ...state,
      pageStatus: "replanned",
      conversationState: "replanning",
      mode: "sprint",
      cards: reorderSequences([
        ...state.cards.filter((card) => card.cardType !== "recovery"),
        buildVerificationTail(state.panel.targetExam),
      ]).slice(0, 5),
      panel: {
        ...state.panel,
        mode: "sprint",
        nextMockWindow: "24 小时内",
      },
      teacherMessages: [
        ...state.teacherMessages,
        createTeacherMessage("negotiating", input, "user"),
        createTeacherMessage(
          "replan_explanation",
          "已切到冲刺模式。后续任务会提高验证卡和高权重模块修补的占比。",
          "teacher",
          {
            evidenceUsed: [
              { source: "weight_breakdown", signal: "sprint_mode", quote: "冲刺模式激活，验证卡密度提升，主卡聚焦高权重模块", confidence: 0.88 },
            ],
            boundCards: state.cards.filter((c) => c.cardType !== "recovery").slice(0, 2).map((c) => c.cardId),
            userActionExpected: "确认冲刺模式并开始执行",
          },
        ),
      ],
      lastUpdatedAt: nowIso(),
    };
  }

  if (normalized.includes("为什么")) {
    return {
      ...state,
      conversationState: "explaining",
      teacherMessages: [
        ...state.teacherMessages,
        createTeacherMessage("negotiating", input, "user"),
        createTeacherMessage(
          "replan_explanation",
          `第一张卡排在最前，是因为它同时命中了 ${state.panel.topMistakes[0] ?? "高频错因"} 和遗忘风险，先做它能保护后面的主卡收益。`,
          "teacher",
          {
            evidenceUsed: [
              { source: "diagnostic", signal: "top_mistake", quote: `当前最高频错因：${state.panel.topMistakes[0] ?? "暂无"}`, confidence: 0.82 },
              { source: "review_queue", signal: "forgetting_risk", quote: "复习队列中有到期条目", confidence: 0.78 },
            ],
            boundCards: state.cards.slice(0, 1).map((c) => c.cardId),
            userActionExpected: "确认理解后开始执行",
          },
        ),
      ],
      lastUpdatedAt: nowIso(),
    };
  }

  if (normalized.includes("不是这个原因")) {
    return {
      ...state,
      conversationState: "diagnosing",
      teacherMessages: [
        ...state.teacherMessages,
        createTeacherMessage("negotiating", input, "user"),
        createTeacherMessage(
          "constraint_ack",
          "收到你的反驳。我会先把这次归因降为低置信，并在下一张卡里补一个更短的校准动作，而不是直接固化这个判断。",
          "teacher",
          {
            evidenceUsed: [
              { source: "teacher_thread", signal: "user_rebuttal", quote: "用户反驳当前错因归因，系统降级该归因的置信度", confidence: 0.75 },
            ],
            userActionExpected: "继续执行下一张卡，系统会自动调整",
          },
        ),
      ],
      lastUpdatedAt: nowIso(),
    };
  }

  return {
    ...state,
    teacherMessages: [
      ...state.teacherMessages,
      createTeacherMessage("negotiating", input, "user"),
      createTeacherMessage("idle", "我收到你的反馈了，接下来继续按当前最优序列推进。"),
    ],
    lastUpdatedAt: nowIso(),
  };
}

export function startScoreCenterCard(state: ScoreCenterState, cardId: string): ScoreCenterState {
  return {
    ...state,
    pageStatus: "executing",
    cards: state.cards.map((card) =>
      card.cardId === cardId
        ? {
            ...card,
            status: "started",
          }
        : card,
    ),
    teacherMessages: [
      ...state.teacherMessages,
      createTeacherMessage("task_push", "已进入执行页，完成后我会根据结果立即重排后续任务。", "teacher", {
        boundCards: [cardId],
        userActionExpected: "完成任务后返回提分中心查看结果",
      }),
    ],
    lastUpdatedAt: nowIso(),
  };
}

function appendCardDecision(
  state: ScoreCenterState,
  cardId: string,
  status: ScoreCenterCard["status"],
  reason: string,
): ScoreCenterState {
  const card = state.cards.find((item) => item.cardId === cardId);
  const label = card?.title ?? cardId;
  const statusText =
    status === "postponed"
      ? "已延后"
      : status === "skipped"
        ? "已跳过"
        : status;

  return {
    ...state,
    pageStatus: "replanned",
    conversationState: "negotiating",
    cards: state.cards.map((item) =>
      item.cardId === cardId
        ? {
            ...item,
            status,
          }
        : item,
    ),
    teacherMessages: [
      ...state.teacherMessages,
      createTeacherMessage(
        "negotiating",
        `${label} 已标记为 ${statusText}。原因：${reason}。系统会保持追踪，不会静默丢弃。`,
      ),
    ],
    decisionSummary: [
      ...state.decisionSummary,
      `${label} 被标记为 ${statusText}。原因：${reason}。`,
    ],
    lastUpdatedAt: nowIso(),
  };
}

export function postponeScoreCenterCard(
  state: ScoreCenterState,
  cardId: string,
  reason: string,
): ScoreCenterState {
  return appendCardDecision(state, cardId, "postponed", reason);
}

export function skipScoreCenterCard(
  state: ScoreCenterState,
  cardId: string,
  reason: string,
): ScoreCenterState {
  return appendCardDecision(state, cardId, "skipped", reason);
}

export function completeScoreCenterDay(state: ScoreCenterState): ScoreCenterState {
  const completed = state.cards.filter((card) => card.status === "completed").length;
  const unfinished = state.cards.filter(
    (card) => !["completed", "failed", "skipped", "postponed", "cancelled"].includes(card.status),
  ).length;

  return {
    ...state,
    pageStatus: "completed",
    conversationState: "closing",
    teacherMessages: [
      ...state.teacherMessages,
      createTeacherMessage(
        "closing",
        `今日已关闭：${completed} 张卡已完成，${unfinished} 张卡留待下次规划。`,
      ),
    ],
    decisionSummary: [
      ...state.decisionSummary,
      `今日关闭，${completed} 张已完成，${unfinished} 张未完成。`,
    ],
    lastUpdatedAt: nowIso(),
  };
}

function buildRepairSupportCard(exam: ExamType, taskType: TaskType, primaryError: string) {
  const destination =
    taskType === "review" ? `/${exam}/mistakes` : `/${exam}${taskRoutes[taskType as Exclude<TaskType, "review">]}`;
  const cardId = `card-support-${taskType}-${primaryError}`;
  const destinationPage = `${destination}${destination.includes("?") ? "&" : "?"}taskId=${encodeURIComponent(cardId)}`;

  const title =
    primaryError === "定位错误"
      ? "同义替换微练卡"
      : primaryError === "transition_miss"
        ? "转折触发词微练卡"
        : "同类错因微练卡";

  return createCard({
    cardId,
    cardType: "pitfall",
    title,
    whyThisNow: `主错因是“${primaryError}”，这张卡负责补它旁边的高关联技能，防止只修表层、不修根因。`,
    estimatedTime: 6,
    difficulty: "low",
    expectedImpact: "让修补卡产生迁移收益，而不是只解决单题表现。",
    targetSkills: [primaryError, "transfer_gain"],
    prerequisite: [],
    actionLabel: "连带修补",
    destinationPage,
    successSignal: "完成一次针对高关联技能的短练。",
    fallbackAction: "如果时间不够，这张卡会优先被顺延，不挤掉前面的修补卡。",
    expiry: nowIso(),
    confidence: 0.78,
    originEngine: "repair_support",
    isNew: true,
  });
}

function buildRepairCard(exam: ExamType, taskType: TaskType, primaryError: string) {
  const destination =
    taskType === "review" ? `/${exam}/mistakes` : `/${exam}${taskRoutes[taskType as Exclude<TaskType, "review">]}`;
  const cardId = `card-repair-${taskType}-${primaryError}`;
  const destinationPage = `${destination}${destination.includes("?") ? "&" : "?"}taskId=${encodeURIComponent(cardId)}`;

  return createCard({
    cardId,
    cardType: "repair",
    title:
      primaryError === "定位错误"
        ? "定位修复卡"
        : primaryError === "transition_miss"
          ? "转折修复卡"
          : `${primaryError} 修补卡`,
    whyThisNow: `你刚刚暴露出的核心问题是“${primaryError}”，先补这个洞比继续推进主任务更值钱。`,
    estimatedTime: 8,
    difficulty: "medium",
    expectedImpact: "阻断这个错因继续复发。",
    targetSkills: [primaryError],
    prerequisite: [],
    actionLabel: "立即修补",
    destinationPage,
    successSignal: `完成一次围绕“${primaryError}”的短修补。`,
    fallbackAction: "如果状态继续下滑，系统会把后续主卡再降级，而不是强推新内容。",
    expiry: nowIso(),
    confidence: 0.9,
    originEngine: "diagnostic_engine",
    isNew: true,
  });
}

export function replanScoreCenterAfterTaskResult(
  state: ScoreCenterState,
  input: {
    taskType: TaskType;
    status: "completed" | "failed";
    accuracy?: number;
    timeSpentMinutes: number;
    detectedErrors: string[];
  },
): ScoreCenterState {
  const primaryError = input.detectedErrors[0] ?? "关键错因";
  const shouldRepair = input.status === "failed" || (input.accuracy ?? 1) < 0.65;
  const updatedCards = state.cards.map((card) => {
    const sameTask =
      card.taskId?.includes(input.taskType) ||
      card.cardId.includes(input.taskType) ||
      card.targetSkills.some((skill) => skill.startsWith(`${input.taskType}.`));

    if (!sameTask || card.cardType === "repair" || card.cardType === "pitfall") {
      return card;
    }

    return {
      ...card,
      status: shouldRepair ? ("failed" as const) : ("completed" as const),
    };
  });

  const remainingCards = updatedCards.filter((card, index) => index === 0 || !card.cardId.includes(input.taskType));
  const repairCards = shouldRepair
    ? (() => {
        const repair = buildRepairCard(state.panel.targetExam, input.taskType, primaryError);
        const verification = buildVerificationTail(state.panel.targetExam);
        const support = buildRepairSupportCard(state.panel.targetExam, input.taskType, primaryError);

        repair.expectedOutcome = verification.cardId;
        repair.fallbackAction = repair.cardId;
        repair.relation = {
          kind: "conditional",
          nextIfSuccess: verification.cardId,
          nextIfFail: repair.cardId,
          expiresAt: repair.expiry,
        };

        verification.prerequisite = [repair.cardId];
        verification.relation = {
          kind: "conditional",
          dependsOn: [repair.cardId],
          nextIfSuccess: remainingCards[1]?.cardId,
          nextIfFail: repair.cardId,
          expiresAt: verification.expiry,
          anchorTo: "post_result_verification",
        };
        verification.anchorTo = "post_result_verification";

        support.prerequisite = [repair.cardId];
        support.relation = {
          kind: "sequence",
          dependsOn: [repair.cardId],
          nextIfSuccess: verification.cardId,
          expiresAt: support.expiry,
        };

        return [repair, verification, support];
      })()
    : [];

  const nextCards = reorderSequences([
    updatedCards[0],
    ...repairCards,
    ...remainingCards.slice(1),
  ]);

  return {
    ...state,
    pageStatus: "replanned",
    conversationState: shouldRepair ? "diagnosing" : "replanning",
    cards: nextCards,
    teacherMessages: [
      ...state.teacherMessages,
      createTeacherMessage(
        shouldRepair ? "post_result_feedback" : "post_result_feedback",
        shouldRepair
          ? `你刚刚在"${primaryError}"上掉分明显。我先插入修补卡和一张连带微练卡，补完再回主任务。`
          : "这张卡完成得不错，我已经根据最新结果同步刷新了后续任务顺序。",
        "teacher",
        {
          evidenceUsed: shouldRepair
            ? [{ source: "diagnostic", signal: "error_detected", quote: `检测到错因：${primaryError}，触发修补路径`, confidence: 0.90 }]
            : [{ source: "weight_breakdown", signal: "task_completed", quote: "任务完成，后续任务按最新表现轻量重排", confidence: 0.85 }],
          boundCards: shouldRepair ? repairCards.map((c) => c.cardId) : undefined,
          userActionExpected: shouldRepair ? "先完成修补卡，再回到主任务" : "继续执行下一张卡",
        },
      ),
    ],
    decisionSummary: [
      ...state.decisionSummary,
      shouldRepair
        ? `由于 ${primaryError} 暴露明显，系统先插入修补路径，再决定是否继续推进主任务。`
        : "本次回流没有触发强修补，后续任务按最新表现轻量重排。",
    ],
    budget: {
      ...state.budget,
      remainingMinutes: Math.max(0, state.budget.remainingMinutes - input.timeSpentMinutes),
    },
    panel: {
      ...state.panel,
      remainingBudgetMinutes: Math.max(0, state.panel.remainingBudgetMinutes - input.timeSpentMinutes),
      expectedGain: shouldRepair
        ? "预计修复 1 个刚暴露的高风险错因"
        : state.panel.expectedGain,
    },
    lastUpdatedAt: nowIso(),
  };
}
