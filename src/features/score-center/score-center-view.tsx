"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CalendarClock,
  ChevronDown,
  Clock3,
  Eye,
  Flame,
  Gauge,
  Layers2,
  Link2,
  ListRestart,
  MessageSquareText,
  Milestone,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import {
  closeScoreCenterDay,
  getScoreCenterState,
  postponeCard as postponeCardAction,
  skipCard as skipCardAction,
  startCard as startCardAction,
  submitCommand as submitScoreCenterCommand,
} from "@/app/actions/score-center";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { examConfigs } from "@/config/exams";
import { mockUser } from "@/mocks/student-data";
import { ScoreCenterCard, ScoreCenterMode, ScoreCenterState, TeacherMessage, TeacherMessageKind } from "@/types/domain";
import { cn } from "@/lib/utils";

const quickActions = [
  "我今天只有20分钟",
  "我今天状态差",
  "我想先练阅读",
  "为什么先做这个",
  "我觉得这题不是这个原因",
  "把今天任务变轻一点",
  "直接给我冲刺模式",
] as const;

const modeLabelMap: Record<ScoreCenterMode, string> = {
  recovery: "恢复模式",
  strengthen: "强化模式",
  sprint: "冲刺模式",
  light: "轻量模式",
  foundation_rebuild: "基础重建",
};

const modeDescMap: Record<ScoreCenterMode, string> = {
  recovery: "连续失败后恢复节奏",
  strengthen: "正常推进，构建能力",
  sprint: "临近考试，得分效率优先",
  light: "低负担，保留学习惯性",
  foundation_rebuild: "基础补课，长期断档修复",
};

const modeToneMap: Record<ScoreCenterMode, string> = {
  recovery: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
  strengthen: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-800",
  sprint: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800",
  light: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800",
  foundation_rebuild: "bg-stone-50 text-stone-700 ring-stone-200 dark:bg-stone-950/40 dark:text-stone-300 dark:ring-stone-800",
};

const cardLabelMap: Record<ScoreCenterCard["cardType"], string> = {
  review: "必修复习",
  score_boost: "今日拉分",
  repair: "错因修补",
  pitfall: "高频坑位",
  verification: "验证确认",
  recovery: "低负荷恢复",
  sprint: "冲刺升级",
  foundation: "基础补课",
  bridge: "迁移桥接",
  mock_anchor: "模考锚点",
};

const cardDescMap: Record<ScoreCenterCard["cardType"], string> = {
  review: "先止损，降低今天重复犯错概率",
  score_boost: "当前单位时间最值钱的主任务",
  repair: "针对失败错因定向修补",
  pitfall: "高频陷阱预防，避免继续漏分",
  verification: "验证修补是否真正转化成考试表现",
  recovery: "维持节奏，不增加高负荷",
  sprint: "冲刺阶段高权重模块强化",
  foundation: "长期断档基础补课",
  bridge: "跨模块能力迁移训练",
  mock_anchor: "整周节奏锚点，校准真实水平",
};

const cardIconMap: Record<ScoreCenterCard["cardType"], React.ReactNode> = {
  review: <ListRestart className="h-4 w-4" />,
  score_boost: <Zap className="h-4 w-4" />,
  repair: <ShieldAlert className="h-4 w-4" />,
  pitfall: <AlertTriangle className="h-4 w-4" />,
  verification: <Eye className="h-4 w-4" />,
  recovery: <Clock3 className="h-4 w-4" />,
  sprint: <Flame className="h-4 w-4" />,
  foundation: <Layers2 className="h-4 w-4" />,
  bridge: <Link2 className="h-4 w-4" />,
  mock_anchor: <Target className="h-4 w-4" />,
};

const statusLabelMap: Record<ScoreCenterCard["status"], string> = {
  generated: "已生成",
  surfaced: "待执行",
  acknowledged: "已查看",
  started: "进行中",
  in_progress: "进行中",
  completed: "已完成",
  failed: "待修补",
  skipped: "已跳过",
  postponed: "已延后",
  expired: "已过期",
  replaced: "已替换",
  merged: "已合并",
  cancelled: "已取消",
};

const messageKindLabelMap: Record<TeacherMessageKind, string> = {
  opening_strategy: "今日策略",
  task_push: "任务推送",
  replan_explanation: "重排解释",
  post_result_feedback: "结果反馈",
  constraint_ack: "约束确认",
  risk_warning: "风险提示",
  motivation_reset: "状态重置",
  briefing: "开场简报",
  explaining: "决策解释",
  negotiating: "协商调整",
  diagnosing: "诊断分析",
  replanning: "重排调度",
  closing: "今日总结",
  idle: "系统提示",
};

const messageKindIconMap: Record<TeacherMessageKind, React.ReactNode> = {
  opening_strategy: <Sparkles className="h-3.5 w-3.5" />,
  task_push: <ArrowRight className="h-3.5 w-3.5" />,
  replan_explanation: <ListRestart className="h-3.5 w-3.5" />,
  post_result_feedback: <BarChart3 className="h-3.5 w-3.5" />,
  constraint_ack: <MessageSquareText className="h-3.5 w-3.5" />,
  risk_warning: <AlertTriangle className="h-3.5 w-3.5" />,
  motivation_reset: <Flame className="h-3.5 w-3.5" />,
  briefing: <Sparkles className="h-3.5 w-3.5" />,
  explaining: <Brain className="h-3.5 w-3.5" />,
  negotiating: <MessageSquareText className="h-3.5 w-3.5" />,
  diagnosing: <ShieldAlert className="h-3.5 w-3.5" />,
  replanning: <ListRestart className="h-3.5 w-3.5" />,
  closing: <Milestone className="h-3.5 w-3.5" />,
  idle: <Clock3 className="h-3.5 w-3.5" />,
};

export function ScoreCenterView({
  exam,
  standalone = false,
}: {
  exam: "cet6" | "ielts";
  standalone?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [scoreCenter, setScoreCenter] = useState<ScoreCenterState | null>(null);
  const [showAllCards, setShowAllCards] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const config = examConfigs[exam];

  async function loadScoreCenter() {
    const state = await getScoreCenterState(mockUser.id, exam);
    setScoreCenter(state as ScoreCenterState);
  }

  useEffect(() => {
    let mounted = true;
    loadScoreCenter().then(() => { if (!mounted) return; });
    return () => { mounted = false; };
  }, [exam]);

  function refreshScoreCenter() {
    setIsRefreshing(true);
    startTransition(async () => {
      await loadScoreCenter();
      setIsRefreshing(false);
    });
  }

  const latestTeacherMessage = scoreCenter?.teacherMessages
    ? [...scoreCenter.teacherMessages].reverse().find((item) => item.role === "teacher")
    : undefined;

  function submitCommand(input: string) {
    if (!input.trim()) return;
    setMessage("");
    startTransition(async () => {
      const nextState = await submitScoreCenterCommand(mockUser.id, exam, input);
      setScoreCenter(nextState as ScoreCenterState);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitCommand(message);
  }

  function startCard(card: ScoreCenterCard) {
    startTransition(async () => {
      await startCardAction(mockUser.id, exam, card.cardId);
      router.push(card.destinationPage);
    });
  }

  function postponeCard(card: ScoreCenterCard) {
    startTransition(async () => {
      const nextState = await postponeCardAction(mockUser.id, exam, card.cardId, "用户从提分中心延后");
      setScoreCenter(nextState as ScoreCenterState);
    });
  }

  function skipCard(card: ScoreCenterCard) {
    startTransition(async () => {
      const nextState = await skipCardAction(mockUser.id, exam, card.cardId, "用户从提分中心跳过");
      setScoreCenter(nextState as ScoreCenterState);
    });
  }

  function closeDay() {
    startTransition(async () => {
      const nextState = await closeScoreCenterDay(mockUser.id, exam);
      setScoreCenter(nextState as ScoreCenterState);
    });
  }

  if (!scoreCenter) {
    return (
      <div className="flex h-[50dvh] flex-col items-center justify-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        <p className="text-sm font-medium text-violet-900/60 dark:text-violet-300/60">老师正在整理你今天的训练计划，请稍候…</p>
      </div>
    );
  }

  const mobileCards = showAllCards ? scoreCenter.cards : scoreCenter.cards.slice(0, 3);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col gap-4 overflow-hidden",
        standalone &&
          "h-[100dvh] bg-[radial-gradient(circle_at_top_right,rgba(124,92,250,0.12),transparent_22%),linear-gradient(180deg,#faf7ff_0%,#ffffff_52%,#faf7ff_100%)] px-4 py-4 sm:px-6 lg:px-8 dark:bg-[radial-gradient(circle_at_top_right,rgba(149,128,255,0.06),transparent_22%),linear-gradient(180deg,#0f0e17_0%,#15131f_52%,#0f0e17_100%)]",
      )}
    >
      {standalone ? (
        <header className="mx-auto w-full max-w-[1500px] shrink-0">
          <TopBar config={config} scoreCenter={scoreCenter} isRefreshing={isRefreshing} onRefresh={refreshScoreCenter} />
        </header>
      ) : null}

      <div className={cn("mx-auto min-h-0 w-full flex-1", standalone ? "max-w-[1500px]" : "max-w-none")}>
        <div className="h-full space-y-4 overflow-y-auto pb-24 xl:hidden">
          <MobileView
            closeDay={closeDay}
            exam={exam}
            handleSubmit={handleSubmit}
            isPending={isPending}
            latestTeacherMessage={latestTeacherMessage}
            message={message}
            mobileCards={mobileCards}
            postponeCard={postponeCard}
            scoreCenter={scoreCenter}
            setMessage={setMessage}
            showAllCards={showAllCards}
            skipCard={skipCard}
            startCard={startCard}
            submitCommand={submitCommand}
            setShowAllCards={setShowAllCards}
          />
        </div>

        <div className="hidden h-full min-h-0 gap-4 overflow-hidden xl:grid xl:grid-cols-[340px_minmax(0,1fr)_320px]">
          <TeacherColumn
            handleSubmit={handleSubmit}
            isPending={isPending}
            message={message}
            scoreCenter={scoreCenter}
            setMessage={setMessage}
            submitCommand={submitCommand}
          />
          <TaskColumn
            closeDay={closeDay}
            isPending={isPending}
            latestTeacherMessage={latestTeacherMessage}
            postponeCard={postponeCard}
            scoreCenter={scoreCenter}
            skipCard={skipCard}
            startCard={startCard}
          />
          <PanelColumn exam={exam} scoreCenter={scoreCenter} />
        </div>
      </div>
    </div>
  );
}

function TopBar({
  config,
  scoreCenter,
  isRefreshing,
  onRefresh,
}: {
  config: { label: string; shortLabel: string };
  scoreCenter: ScoreCenterState;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/70 bg-white/82 px-5 py-3.5 shadow-[0_12px_40px_rgba(89,54,180,0.08)] backdrop-blur dark:border-[#2a2739]/80 dark:bg-[#181722]/90 dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Brand />
          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1", modeToneMap[scoreCenter.mode])}>
            {modeLabelMap[scoreCenter.mode]}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#67738c] ring-1 ring-[#ebe3fb] dark:bg-[#1c1a28] dark:text-[#8b91a3] dark:ring-[#2a2739]">
            {config.label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CompactMetric label="目标分数" value={`${scoreCenter.panel.targetScore}`} />
          <CompactMetric label="距离考试" value={`${scoreCenter.panel.daysToExam} 天`} />
          <CompactMetric label="今日预算" value={`${scoreCenter.budget.totalMinutes} 分钟`} />
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ece7f8] text-[#7c5cfa] transition hover:bg-[#f3efff] disabled:opacity-50 dark:border-[#2a2739] dark:text-[#9580ff] dark:hover:bg-[rgba(149,128,255,0.08)]"
            disabled={isRefreshing}
            onClick={onRefresh}
            title="刷新提分中心"
            type="button"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </button>
          <Link
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#ece4fb] bg-white px-3.5 text-sm font-medium text-[#5f6983] transition hover:bg-[#faf8ff] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#8b91a3] dark:hover:bg-[rgba(255,255,255,0.05)]"
            href="/settings"
          >
            <Settings className="h-3.5 w-3.5" />
            设置
          </Link>
        </div>
      </div>
    </section>
  );
}

function MobileView({
  closeDay,
  exam,
  handleSubmit,
  isPending,
  latestTeacherMessage,
  message,
  mobileCards,
  postponeCard,
  scoreCenter,
  setMessage,
  showAllCards,
  skipCard,
  startCard,
  submitCommand,
  setShowAllCards,
}: {
  closeDay: () => void;
  exam: string;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  latestTeacherMessage?: TeacherMessage;
  message: string;
  mobileCards: ScoreCenterCard[];
  postponeCard: (card: ScoreCenterCard) => void;
  scoreCenter: ScoreCenterState;
  setMessage: (value: string) => void;
  showAllCards: boolean;
  skipCard: (card: ScoreCenterCard) => void;
  startCard: (card: ScoreCenterCard) => void;
  submitCommand: (value: string) => void;
  setShowAllCards: (fn: (prev: boolean) => boolean) => void;
}) {
  const firstCard = scoreCenter.cards[0];

  return (
    <>
      <PanelCard className="overflow-hidden">
        <div className="border-b border-[#efe8fb] px-4 py-4 dark:border-[#2a2739]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#775deb] dark:text-[#9580ff]">
                Score Center
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-[#1d1730] dark:text-[#edeef1]">
                提分中心
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-[#627089] dark:text-[#8b91a3]">
                今天先学什么，不需要你自己决定。
              </p>
            </div>
            <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1", modeToneMap[scoreCenter.mode])}>
              {modeLabelMap[scoreCenter.mode]}
            </span>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <CompactMetric label="当前估分" value={`${scoreCenter.panel.estimatedScore}`} />
            <CompactMetric label="剩余天数" value={`${scoreCenter.panel.daysToExam} 天`} />
            <CompactMetric label="目标分数" value={`${scoreCenter.panel.targetScore}`} />
            <CompactMetric label="今日剩余" value={`${scoreCenter.panel.remainingBudgetMinutes} 分钟`} />
          </div>

          {latestTeacherMessage && (
            <section className="rounded-2xl border border-[#eee5ff] bg-[linear-gradient(135deg,#fbf8ff_0%,#ffffff_62%,#faf6ff_100%)] p-4 dark:border-[#2a2739] dark:bg-[rgba(149,128,255,0.06)]">
              <div className="flex items-center gap-2 text-[#6d53ea] dark:text-[#9580ff]">
                {messageKindIconMap[latestTeacherMessage.kind] ?? <Sparkles className="h-4 w-4" />}
                <span className="text-sm font-semibold">{messageKindLabelMap[latestTeacherMessage.kind]}</span>
              </div>
              <p className="mt-2.5 text-[15px] leading-7 text-[#30384e] dark:text-[#c5c8d4]">
                {latestTeacherMessage.content}
              </p>
              {latestTeacherMessage.evidenceUsed && latestTeacherMessage.evidenceUsed.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {latestTeacherMessage.evidenceUsed.slice(0, 2).map((ev, i) => (
                    <div key={i} className="rounded-lg bg-white/60 px-3 py-1.5 text-xs text-[#6b748a] dark:bg-[rgba(255,255,255,0.04)] dark:text-[#8b91a3]">
                      <span className="font-medium text-[#7c5cfa] dark:text-[#9580ff]">{ev.source}</span>：{ev.quote}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {firstCard && (
            <HeroCard card={firstCard} onStart={() => startCard(firstCard)} />
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#775deb] dark:text-[#9580ff]">
                  Task Stack
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-[#1d1730] dark:text-[#edeef1]">
                  今日任务栈
                </h2>
              </div>
              <span className="rounded-full bg-[#f4edff] px-3 py-1 text-xs font-semibold text-[#6b51ea] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
                {scoreCenter.cards.length} 张卡
              </span>
            </div>

            {mobileCards.map((card, index) => (
              <TaskStackCard
                key={card.cardId}
                card={card}
                index={index}
                onStart={() => startCard(card)}
                onPostpone={() => postponeCard(card)}
                onSkip={() => skipCard(card)}
                compact
              />
            ))}

            {scoreCenter.cards.length > 3 && (
              <button
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#ece4fb] bg-white text-sm font-semibold text-[#6b51ea] transition hover:bg-[#faf7ff] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#9580ff] dark:hover:bg-[rgba(255,255,255,0.05)]"
                onClick={() => setShowAllCards((current) => !current)}
                type="button"
              >
                {showAllCards ? "收起后续任务" : `展开剩余 ${scoreCenter.cards.length - 3} 张卡`}
                <ChevronDown className={cn("h-4 w-4 transition", showAllCards && "rotate-180")} />
              </button>
            )}
          </section>
        </div>
      </PanelCard>

      <PanelCard>
        <div className="border-b border-[#efe8fb] px-4 py-4 dark:border-[#2a2739]">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4edff] text-[#6d53ea] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-[#241b35] dark:text-[#edeef1]">和老师说一句</h3>
              <p className="mt-0.5 text-sm text-[#68748b] dark:text-[#8b91a3]">调整预算、优先级或追问为什么这样排。</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action}
                className="min-h-11 rounded-2xl bg-[#f5f0ff] px-3 py-2 text-left text-xs font-medium leading-5 text-[#6f57eb] transition hover:bg-[#ede5ff] dark:bg-[rgba(149,128,255,0.08)] dark:text-[#9580ff] dark:hover:bg-[rgba(149,128,255,0.14)]"
                onClick={() => submitCommand(action)}
                type="button"
              >
                {action}
              </button>
            ))}
          </div>

          <form className="space-y-2" onSubmit={handleSubmit}>
            <Input
              placeholder="告诉老师你的时间、状态或优先级变化"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Button className="w-full justify-between" disabled={isPending} type="submit">
              让老师重排今天任务
              <MessageSquareText className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </PanelCard>

      <PanelColumn exam={exam as "cet6" | "ielts"} mobile scoreCenter={scoreCenter} />
    </>
  );
}

function TeacherColumn({
  scoreCenter,
  message,
  setMessage,
  handleSubmit,
  isPending,
  submitCommand,
}: {
  scoreCenter: ScoreCenterState;
  message: string;
  setMessage: (value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  submitCommand: (value: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [scoreCenter.teacherMessages.length]);

  return (
    <aside className="h-full min-h-0 overflow-hidden">
      <PanelCard className="flex h-full min-h-0 flex-col overflow-hidden p-0">
        <div className="shrink-0 border-b border-[#efe8fb] px-5 py-4 dark:border-[#2a2739]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#775deb] dark:text-[#9580ff]">
                Teacher Thread
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#1d1730] dark:text-[#edeef1]">
                老师线程
              </h2>
            </div>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1", modeToneMap[scoreCenter.mode])}>
              {modeLabelMap[scoreCenter.mode]}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#7a84a0] dark:text-[#8b91a3]">
            {modeDescMap[scoreCenter.mode]}
          </p>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {scoreCenter.decisionSummary.length > 0 && (
              <div className="rounded-2xl border border-[#efe8fb] bg-[#faf8ff] p-3.5 dark:border-[#2a2739] dark:bg-[rgba(149,128,255,0.04)]">
                <div className="flex items-center gap-2 text-[#6d53ea] dark:text-[#9580ff]">
                  <ListRestart className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">历史决策摘要</span>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  {scoreCenter.decisionSummary.map((item, i) => (
                    <p key={i} className="text-xs leading-5 text-[#5d6780] dark:text-[#a0a5b8]">
                      · {item}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {scoreCenter.teacherMessages.slice(-10).map((item) => (
              <TeacherBubble key={item.id} message={item} />
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#efe8fb] bg-white px-4 py-3.5 dark:border-[#2a2739] dark:bg-[#14131f]">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {quickActions.slice(0, 5).map((action) => (
              <button
                key={action}
                className="rounded-full bg-[#f5f0ff] px-2.5 py-1 text-[11px] font-medium text-[#6f57eb] transition hover:bg-[#ede5ff] dark:bg-[rgba(149,128,255,0.10)] dark:text-[#9580ff] dark:hover:bg-[rgba(149,128,255,0.16)]"
                onClick={() => submitCommand(action)}
                type="button"
              >
                {action}
              </button>
            ))}
          </div>

          <form className="space-y-2" onSubmit={handleSubmit}>
            <Input
              placeholder="告诉老师你的时间、状态或优先级变化"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="text-sm"
            />
            <Button className="w-full justify-between text-sm" disabled={isPending} type="submit">
              让老师重排今天任务
              <MessageSquareText className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </PanelCard>
    </aside>
  );
}

function TaskColumn({
  scoreCenter,
  latestTeacherMessage,
  startCard,
  postponeCard,
  skipCard,
  closeDay,
  isPending,
}: {
  scoreCenter: ScoreCenterState;
  latestTeacherMessage?: TeacherMessage;
  startCard: (card: ScoreCenterCard) => void;
  postponeCard: (card: ScoreCenterCard) => void;
  skipCard: (card: ScoreCenterCard) => void;
  closeDay: () => void;
  isPending: boolean;
}) {
  const firstCard = scoreCenter.cards[0];
  const activeCards = scoreCenter.cards.filter((c) => !["completed", "skipped", "postponed", "cancelled", "expired"].includes(c.status));
  const doneCards = scoreCenter.cards.filter((c) => ["completed", "skipped", "postponed"].includes(c.status));

  return (
    <main className="h-full min-h-0 space-y-4 overflow-y-auto pr-1">
      <PanelCard className="overflow-hidden">
        <div className="border-b border-[#efe8fb] px-6 py-5 dark:border-[#2a2739]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#775deb] dark:text-[#9580ff]">
                Study Command Center
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-[#1d1730] dark:text-[#edeef1]">
                提分中心
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#616b82] dark:text-[#8b91a3]">
                不是聊天页，不是首页陈列页。它只负责下发任务、解释原因、接收反馈、重算下一步。
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1", modeToneMap[scoreCenter.mode])}>
                {modeLabelMap[scoreCenter.mode]}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6b748a] ring-1 ring-[#ece4ff] dark:bg-[#1c1a28] dark:text-[#8b91a3] dark:ring-[#2a2739]">
                {activeCards.length} 张待执行
              </span>
            </div>
          </div>
        </div>

        {latestTeacherMessage && (
          <div className="border-b border-[#efe8fb] px-6 py-4 dark:border-[#2a2739]">
            <div className="rounded-2xl border border-[#eee5ff] bg-[#faf8ff] px-4 py-4 dark:border-[#2a2739] dark:bg-[rgba(149,128,255,0.06)]">
              <div className="flex items-center gap-2 text-[#6d53ea] dark:text-[#9580ff]">
                {messageKindIconMap[latestTeacherMessage.kind] ?? <Sparkles className="h-4 w-4" />}
                <span className="text-sm font-semibold">{messageKindLabelMap[latestTeacherMessage.kind]}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-[#47536c] dark:text-[#a0a5b8]">{latestTeacherMessage.content}</p>
              {latestTeacherMessage.evidenceUsed && latestTeacherMessage.evidenceUsed.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {latestTeacherMessage.evidenceUsed.slice(0, 3).map((ev, i) => (
                    <div key={i} className="rounded-xl bg-white/60 px-3 py-2 text-xs text-[#6b748a] dark:bg-[rgba(255,255,255,0.04)] dark:text-[#8b91a3]">
                      <span className="font-medium text-[#7c5cfa] dark:text-[#9580ff]">{ev.source}</span>：{ev.quote}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {firstCard && (
          <div className="border-b border-[#efe8fb] px-6 py-5 dark:border-[#2a2739]">
            <HeroCard card={firstCard} onStart={() => startCard(firstCard)} />
          </div>
        )}

        <div className="space-y-3 px-6 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1d1730] dark:text-[#edeef1]">任务栈</h3>
            <span className="text-xs text-[#7a84a0] dark:text-[#8b91a3]">{activeCards.length} 待执行 · {doneCards.length} 已处理</span>
          </div>
          {scoreCenter.cards.map((card, index) => (
            <TaskStackCard
              key={card.cardId}
              card={card}
              index={index}
              onPostpone={() => postponeCard(card)}
              onSkip={() => skipCard(card)}
              onStart={() => startCard(card)}
            />
          ))}
        </div>

        <div className="border-t border-[#efe8fb] px-6 py-4 dark:border-[#2a2739]">
          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#ece4ff] bg-white text-sm font-semibold text-[#6b51ea] transition hover:bg-[#faf7ff] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#9580ff] dark:hover:bg-[rgba(255,255,255,0.05)]"
            disabled={isPending}
            onClick={closeDay}
            type="button"
          >
            结束今天并生成总结
          </button>
        </div>
      </PanelCard>
    </main>
  );
}

function PanelColumn({
  exam,
  scoreCenter,
  mobile = false,
}: {
  exam: "cet6" | "ielts";
  scoreCenter: ScoreCenterState;
  mobile?: boolean;
}) {
  return (
    <aside className="h-full min-h-0 space-y-4 overflow-y-auto pr-1">
      <PanelCard>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#775deb] dark:text-[#9580ff]">
              Score Panel
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-[#1d1730] dark:text-[#edeef1]">
              提分面板
            </h2>
          </div>
          <Link
            href={`/${exam}/reports`}
            className="rounded-full bg-[#f4edff] px-3 py-1.5 text-xs font-semibold text-[#6b51ea] transition hover:bg-[#ede5ff] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff] dark:hover:bg-[rgba(149,128,255,0.18)]"
          >
            查看报告
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          <ScorePanelMetric icon={<Gauge className="h-4 w-4" />} label="当前估算分数" value={`${scoreCenter.panel.estimatedScore}`} highlight />
          <ScorePanelMetric icon={<Target className="h-4 w-4" />} label="目标分数" value={`${scoreCenter.panel.targetScore}`} />
          <ScorePanelMetric icon={<CalendarClock className="h-4 w-4" />} label="距离考试" value={`${scoreCenter.panel.daysToExam} 天`} />
          <ScorePanelMetric icon={<Clock3 className="h-4 w-4" />} label="今日剩余预算" value={`${scoreCenter.panel.remainingBudgetMinutes} 分钟`} />
        </div>

        <div className="mt-5 rounded-2xl border border-[#eee7ff] bg-[#faf7ff] px-4 py-4 dark:border-[#2a2739] dark:bg-[rgba(149,128,255,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#281e3a] dark:text-[#edeef1]">近 7 天趋势</p>
              <p className="mt-0.5 text-xs text-[#6a748b] dark:text-[#8b91a3]">只看是否朝目标靠近。</p>
            </div>
            <TrendingUp className="h-4 w-4 text-[#6f57eb]" />
          </div>
          <div className="mt-4 flex items-end gap-2">
            {scoreCenter.panel.scoreTrend.map((value, index, array) => {
              const min = Math.min(...array);
              const max = Math.max(...array);
              const ratio = max === min ? 1 : (value - min) / (max - min);
              return (
                <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-[#6e54ec] to-[#c8b8ff] dark:from-[#9580ff] dark:to-[#c8b8ff]"
                    style={{ height: `${42 + ratio * 58}px` }}
                  />
                  <span className="text-[11px] font-medium text-[#7a84a0] dark:text-[#8b91a3]">{index + 1}d</span>
                </div>
              );
            })}
          </div>
        </div>
      </PanelCard>

      <PanelCard>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4df] text-[#c98917] dark:bg-[rgba(201,137,23,0.15)] dark:text-[#d4a532]">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-[#241b35] dark:text-[#edeef1]">本周主要失分点</h3>
            <p className="mt-0.5 text-xs text-[#68748b] dark:text-[#8b91a3]">影响今天排程的高价值状态。</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {scoreCenter.panel.topMistakes.map((item, index) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-2xl border border-[#f0e8ff] px-4 py-3 dark:border-[#2a2739]"
            >
              <div>
                <p className="text-sm font-semibold text-[#271e39] dark:text-[#edeef1]">
                  TOP {index + 1} · {item}
                </p>
                <p className="mt-0.5 text-xs text-[#717b92] dark:text-[#8b91a3]">今天任务排序和修补插卡的重要依据。</p>
              </div>
              <span className="rounded-full bg-[#fff4df] px-2.5 py-1 text-xs font-semibold text-[#c98917] dark:bg-[rgba(201,137,23,0.15)] dark:text-[#d4a532]">
                高风险
              </span>
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef7ff] text-[#3f7fe4] dark:bg-[rgba(63,127,228,0.15)] dark:text-[#6b9fff]">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-[#241b35] dark:text-[#edeef1]">脆弱能力节点</h3>
            <p className="mt-0.5 text-xs text-[#68748b] dark:text-[#8b91a3]">今天主卡排法的核心证据。</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {scoreCenter.panel.weakestSkills.map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)] px-4 py-3 ring-1 ring-[#f0e8ff] dark:bg-[rgba(149,128,255,0.06)] dark:ring-[#2a2739]"
            >
              <p className="text-sm font-semibold text-[#271e39] dark:text-[#edeef1]">{item}</p>
              <p className="mt-0.5 text-xs leading-5 text-[#717b92] dark:text-[#8b91a3]">
                命中它比继续盲刷更值钱。
              </p>
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <MiniInsight icon={<Layers2 className="h-4 w-4" />} label="当前学习模式" value={modeLabelMap[scoreCenter.mode]} />
          <MiniInsight icon={<Milestone className="h-4 w-4" />} label="本周最优修复方向" value={scoreCenter.panel.weakestSkills[0] ?? "等待更多数据"} />
          <MiniInsight icon={<Target className="h-4 w-4" />} label="今日完成后预计收益" value={scoreCenter.panel.expectedGain} />
        </div>
        {mobile && (
          <p className="mt-4 text-xs leading-6 text-[#76829a] dark:text-[#8b91a3]">
            只看提分状态、错因变化和预算调整，不做多余的信息堆砌。
          </p>
        )}
      </PanelCard>
    </aside>
  );
}

function HeroCard({ card, onStart }: { card: ScoreCenterCard; onStart: () => void }) {
  return (
    <button
      className="group flex w-full items-start justify-between gap-4 rounded-3xl bg-[#1a1230] px-5 py-5 text-left text-white shadow-[0_16px_40px_rgba(52,30,108,0.25)] transition hover:-translate-y-0.5 dark:bg-[#1a1230]"
      onClick={onStart}
      type="button"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/85">
            立即开始
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/66">
            {cardLabelMap[card.cardType]}
          </span>
        </div>
        <div>
          <p className="text-2xl font-black tracking-tight">{card.title}</p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/76">
            {card.whyThisNow}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-white/68">
          <span>预计 {card.estimatedTime} 分钟</span>
          <span>完成标准：{card.successSignal}</span>
        </div>
      </div>
      <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6d53ea] transition group-hover:translate-x-1 dark:bg-[#1c1a28] dark:text-[#9580ff]">
        <ArrowRight className="h-5 w-5" />
      </div>
    </button>
  );
}

function TaskStackCard({
  card,
  index,
  onStart,
  onPostpone,
  onSkip,
  compact = false,
}: {
  card: ScoreCenterCard;
  index: number;
  onStart: () => void;
  onPostpone: () => void;
  onSkip: () => void;
  compact?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDone = ["completed", "skipped", "postponed", "cancelled", "expired"].includes(card.status);

  const cardStyleMap: Record<ScoreCenterCard["cardType"], string> = {
    score_boost: "border-l-4 border-l-[#6f57eb] bg-white dark:bg-[#1c1a28]",
    sprint: "border-l-4 border-l-[#6f57eb] bg-white dark:bg-[#1c1a28]",
    repair: "border-l-4 border-l-[#f59e0b] bg-[#fffbeb] dark:border-l-[#f59e0b] dark:bg-[rgba(245,158,11,0.06)]",
    pitfall: "border-l-4 border-l-[#f59e0b] bg-[#fffbeb] dark:border-l-[#f59e0b] dark:bg-[rgba(245,158,11,0.06)]",
    verification: "border-l-4 border-l-[#10b981] bg-[#ecfdf5] dark:border-l-[#10b981] dark:bg-[rgba(52,211,153,0.06)]",
    recovery: "border-l-4 border-l-[#94a3b8] bg-[#f8fafc] dark:border-l-[#64748b] dark:bg-[rgba(148,163,184,0.06)]",
    review: "border-l-4 border-l-[#94a3b8] bg-[#f8fafc] dark:border-l-[#64748b] dark:bg-[rgba(148,163,184,0.06)]",
    foundation: "border-l-4 border-l-[#64748b] bg-[#f8fafc] dark:border-l-[#475569] dark:bg-[rgba(100,116,139,0.06)]",
    bridge: "border-l-4 border-l-[#14b8a6] bg-[#f0fdfa] dark:border-l-[#14b8a6] dark:bg-[rgba(20,184,166,0.06)]",
    mock_anchor: "border-l-4 border-l-[#8b5cf6] bg-[#f5f3ff] dark:border-l-[#8b5cf6] dark:bg-[rgba(139,92,246,0.08)]",
  };

  const numberBgMap: Record<ScoreCenterCard["cardType"], string> = {
    score_boost: "bg-[#6f57eb]",
    sprint: "bg-[#6f57eb]",
    repair: "bg-[#f59e0b]",
    pitfall: "bg-[#f59e0b]",
    verification: "bg-[#10b981]",
    recovery: "bg-[#94a3b8]",
    review: "bg-[#94a3b8]",
    foundation: "bg-[#64748b]",
    bridge: "bg-[#14b8a6]",
    mock_anchor: "bg-[#8b5cf6]",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#efe8fb] transition-all dark:border-[#2a2739]",
        compact ? "p-4" : "p-5",
        cardStyleMap[card.cardType] || cardStyleMap.score_boost,
        card.isNew && "ring-2 ring-[#cdbdfd]",
        card.anchorTo && "ring-2 ring-[#8b63ff] shadow-[0_12px_28px_rgba(124,92,250,0.15)]",
        isDone && "opacity-60",
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white", numberBgMap[card.cardType] || numberBgMap.score_boost)}>
              {index + 1}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4edff] px-2.5 py-1 text-xs font-semibold text-[#6b51ea] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
                  {cardIconMap[card.cardType]}
                  {cardLabelMap[card.cardType]}
                </span>
                <span className="rounded-full bg-[#f8f7fb] px-2.5 py-1 text-xs font-semibold text-[#6a748b] dark:bg-[rgba(255,255,255,0.06)] dark:text-[#8b91a3]">
                  {card.estimatedTime} 分钟
                </span>
                {card.isNew && (
                  <span className="rounded-full bg-[#22163b] px-2.5 py-1 text-xs font-semibold text-white dark:bg-[rgba(149,128,255,0.2)]">
                    刚更新
                  </span>
                )}
              </div>
              <h3 className="mt-2.5 text-lg font-black tracking-tight text-[#1d1730] dark:text-[#edeef1]">
                {card.title}
              </h3>
            </div>
          </div>
          <span className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            card.status === "completed" ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a] dark:border-[#166534] dark:bg-[rgba(22,163,74,0.1)] dark:text-[#4ade80]" :
            card.status === "failed" ? "border-[#fecaca] bg-[#fef2f2] text-[#dc2626] dark:border-[#991b1b] dark:bg-[rgba(220,38,38,0.1)] dark:text-[#f87171]" :
            card.status === "in_progress" || card.status === "started" ? "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb] dark:border-[#1e40af] dark:bg-[rgba(37,99,235,0.1)] dark:text-[#60a5fa]" :
            "border-[#ece4ff] bg-white text-[#647089] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#8b91a3]"
          )}>
            {statusLabelMap[card.status]}
          </span>
        </div>

        <p className="text-sm leading-7 text-[#4e5b73] dark:text-[#a0a5b8]">{card.whyThisNow}</p>

        {compact && !isExpanded ? (
          <div className="grid gap-2 text-sm text-[#626d84]">
            <MetaRow label="影响收益" value={card.expectedImpact} />
            <MetaRow label="完成标准" value={card.successSignal} />
          </div>
        ) : (
          <div className="grid gap-2 text-sm text-[#626d84] sm:grid-cols-2">
            <MetaRow label="影响分数" value={card.expectedImpact} />
            <MetaRow label="影响技能" value={card.targetSkills.join(" · ")} />
            <MetaRow label="完成标准" value={card.successSignal} />
            <MetaRow label="失败回退" value={card.fallbackAction} />
            {card.expectedOutcome && <MetaRow label="成功后续" value={card.expectedOutcome} />}
            {card.alternative && <MetaRow label="平行替代" value={card.alternative} />}
            {card.relation?.dependsOn && <MetaRow label="前置依赖" value={card.relation.dependsOn.join(", ")} />}
            {card.anchorTo && <MetaRow label="锚点关联" value={card.anchorTo} />}
            {card.evidenceRefs && card.evidenceRefs.length > 0 && <MetaRow label="引用数据" value={card.evidenceRefs.join(", ")} />}
            <MetaRow label="调度来源" value={`${card.originEngine} · 置信度 ${Math.round(card.confidence * 100)}%`} />
          </div>
        )}

        {(isExpanded || !compact) && card.weightBreakdown && (
          <div className="rounded-2xl border border-[#efe8fb] bg-white px-4 py-4 dark:border-[#2a2739] dark:bg-[#14131f]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a62ee] dark:text-[#9580ff]">
                Weight Breakdown
              </p>
              <span className="text-xs font-semibold text-[#657089] dark:text-[#8b91a3]">
                {card.utilityScore?.toFixed(3) ?? card.confidence.toFixed(2)}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {card.weightBreakdown.terms
                .slice()
                .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
                .slice(0, compact ? 3 : 5)
                .map((term) => (
                  <div key={term.key} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-[#334056] dark:text-[#c5c8d4]">{term.label}</span>
                      <span className={term.contribution >= 0 ? "text-[#21885b]" : "text-[#b54747]"}>
                        {term.contribution >= 0 ? "+" : ""}
                        {term.contribution.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#f1edf8] dark:bg-[rgba(255,255,255,0.06)]">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          term.contribution >= 0 ? "bg-[#6f57eb]" : "bg-[#d66a6a]",
                        )}
                        style={{
                          width: `${Math.min(100, Math.max(8, Math.abs(term.contribution) * 500))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {compact && (
          <button
            className="mx-auto block text-xs font-medium text-[#7c5cfa] hover:text-[#6a4ce2] dark:text-[#9580ff]"
            onClick={() => setIsExpanded((e) => !e)}
            type="button"
          >
            {isExpanded ? "收起详细调度信息" : "展开详细调度信息"}
          </button>
        )}

        {!isDone && (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#ece4ff] bg-white px-3.5 text-sm font-medium text-[#647089] transition hover:bg-[#faf7ff] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#8b91a3] dark:hover:bg-[rgba(255,255,255,0.05)]"
              onClick={onPostpone}
              type="button"
            >
              延后
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#f1d7d7] bg-white px-3.5 text-sm font-medium text-[#a94e4e] transition hover:bg-[#fff8f8] dark:border-[#3d2525] dark:bg-[#1c1a28] dark:text-[#e57373] dark:hover:bg-[rgba(234,115,115,0.1)]"
              onClick={onSkip}
              type="button"
            >
              跳过
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1a1230] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2044] dark:bg-[#6d56d9] dark:hover:bg-[#8068ff]"
              onClick={onStart}
              type="button"
            >
              {card.actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherBubble({ message }: { message: TeacherMessage }) {
  const isTeacher = message.role === "teacher";

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 text-sm leading-6",
        isTeacher
          ? "bg-[linear-gradient(180deg,#fbf8ff_0%,#f6efff_100%)] text-[#445168] ring-1 ring-[#efe7ff] dark:bg-[rgba(149,128,255,0.08)] dark:text-[#a0a5b8] dark:ring-[#2a2739]"
          : "bg-[#1a1230] text-white dark:bg-[#2b2044]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7a62ee] dark:text-[#9580ff]">
          {isTeacher ? messageKindIconMap[message.kind] : null}
          {isTeacher ? messageKindLabelMap[message.kind] : "你的指令"}
        </span>
        <span className={cn("text-[11px]", isTeacher ? "text-[#8590a6] dark:text-[#6b7280]" : "text-white/60")}>
          {new Date(message.createdAt).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className={cn("mt-2", !isTeacher && "text-white/86")}>{message.content}</p>
      {isTeacher && message.evidenceUsed && message.evidenceUsed.length > 0 && (
        <div className="mt-2.5 space-y-1">
          {message.evidenceUsed.slice(0, 2).map((ev, i) => (
            <div key={i} className="rounded-lg bg-white/50 px-2.5 py-1.5 text-xs text-[#6b748a] dark:bg-[rgba(255,255,255,0.04)] dark:text-[#8b91a3]">
              <span className="font-medium text-[#7c5cfa] dark:text-[#9580ff]">{ev.source}</span>：{ev.quote}
            </div>
          ))}
        </div>
      )}
      {isTeacher && message.boundCards && message.boundCards.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {message.boundCards.map((cardId) => (
            <span key={cardId} className="rounded-full bg-[#f4edff] px-2 py-0.5 text-[10px] font-medium text-[#6f57eb] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
              {cardId}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ScorePanelMetric({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-2xl border px-4 py-3 dark:border-[#2a2739]",
      highlight
        ? "border-[#d8cbff] bg-[#f4edff] dark:border-[#4c3d8f] dark:bg-[rgba(149,128,255,0.10)]"
        : "border-[#efe7ff] bg-white dark:bg-[#1c1a28]"
    )}>
      <div className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl",
        highlight
          ? "bg-[#6f57eb] text-white dark:bg-[#6f57eb]"
          : "bg-[#f4edff] text-[#6d53ea] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#7a84a0] dark:text-[#8b91a3]">{label}</p>
        <p className={cn("mt-0.5 text-sm font-semibold", highlight ? "font-bold text-[#5b3fd4] dark:text-[#b4a0ff]" : "text-[#231a35] dark:text-[#edeef1]")}>{value}</p>
      </div>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#ece4fb] bg-white px-3.5 py-2.5 dark:border-[#2a2739] dark:bg-[#181722]">
      <p className="text-[11px] text-[#7c87a0] dark:text-[#8b91a3]">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-[#231a35] dark:text-[#edeef1]">{value}</p>
    </div>
  );
}

function MiniInsight({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#faf7ff] px-4 py-3 ring-1 ring-[#efe8fb] dark:bg-[rgba(149,128,255,0.06)] dark:ring-[#2a2739]">
      <div className="flex items-center gap-2 text-[#6d53ea] dark:text-[#9580ff]">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#2a203c] dark:text-[#edeef1]">{value}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#fbfaff] px-3 py-2.5 ring-1 ring-[#f0eaff] dark:bg-[rgba(149,128,255,0.06)] dark:ring-[#2a2739]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a94aa] dark:text-[#8b91a3]">{label}</p>
      <p className="mt-1.5 text-sm leading-6 text-[#4d5971] dark:text-[#a0a5b8]">{value}</p>
    </div>
  );
}

function PanelCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-[#ebe3fb] bg-white p-5 shadow-[0_12px_40px_rgba(124,92,250,0.06)] dark:border-[#2a2739] dark:bg-[#181722] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
