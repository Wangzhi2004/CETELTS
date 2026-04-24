"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useTransition } from "react";
import {
  ArrowRight,
  Brain,
  CalendarClock,
  ChevronDown,
  Clock3,
  Gauge,
  Layers2,
  ListRestart,
  MessageSquareText,
  Milestone,
  Settings,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
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
import { ScoreCenterCard, ScoreCenterMode, ScoreCenterState, TeacherMessage } from "@/types/domain";
import { cn } from "@/lib/utils";

const quickActions = [
  "我今天只有20分钟",
  "我今天状态差",
  "我想先阅读",
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
  foundation_rebuild: "基础重建模式",
};

const modeToneMap: Record<ScoreCenterMode, string> = {
  recovery: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  strengthen: "bg-violet-50 text-violet-700 ring-violet-200",
  sprint: "bg-amber-50 text-amber-700 ring-amber-200",
  light: "bg-sky-50 text-sky-700 ring-sky-200",
  foundation_rebuild: "bg-stone-50 text-stone-700 ring-stone-200",
};

const cardLabelMap: Record<ScoreCenterCard["cardType"], string> = {
  review: "必修复习卡",
  score_boost: "今日拉分卡",
  repair: "错因修补卡",
  pitfall: "高频坑位卡",
  verification: "模考验证卡",
  recovery: "低负荷恢复卡",
  sprint: "冲刺升级卡",
  foundation: "基础补课卡",
  bridge: "迁移桥接卡",
  mock_anchor: "模考锚点卡",
};

const statusLabelMap: Record<ScoreCenterCard["status"], string> = {
  generated: "已生成",
  surfaced: "已展示",
  acknowledged: "已看到",
  started: "已开始",
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
  const config = examConfigs[exam];

  useEffect(() => {
    let mounted = true;

    async function load() {
      const state = await getScoreCenterState(mockUser.id, exam);
      if (mounted) {
        setScoreCenter(state as ScoreCenterState);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [exam]);

  const latestTeacherMessage = scoreCenter?.teacherMessages
    ? [...scoreCenter.teacherMessages].reverse().find((item) => item.role === "teacher")
    : undefined;

  function submitCommand(input: string) {
    if (!input.trim()) {
      return;
    }

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
      const nextState = await postponeCardAction(
        mockUser.id,
        exam,
        card.cardId,
        "User postponed from Score Center",
      );
      setScoreCenter(nextState as ScoreCenterState);
    });
  }

  function skipCard(card: ScoreCenterCard) {
    startTransition(async () => {
      const nextState = await skipCardAction(
        mockUser.id,
        exam,
        card.cardId,
        "User skipped from Score Center",
      );
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
        <p className="text-sm font-medium text-violet-900/60">老师正在整理你今天的训练计划，请稍候…</p>
      </div>
    );
  }

  const firstCard = scoreCenter.cards[0];
  const mobileCards = showAllCards ? scoreCenter.cards : scoreCenter.cards.slice(0, 3);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col gap-4 overflow-hidden",
        standalone &&
          "h-[100dvh] bg-[radial-gradient(circle_at_top_right,rgba(124,92,250,0.16),transparent_22%),linear-gradient(180deg,#faf7ff_0%,#ffffff_52%,#faf7ff_100%)] px-4 py-4 sm:px-6 lg:px-8 dark:bg-[radial-gradient(circle_at_top_right,rgba(149,128,255,0.08),transparent_22%),linear-gradient(180deg,#0f0e17_0%,#15131f_52%,#0f0e17_100%)]",
      )}
    >
      {standalone ? (
        <section className="mx-auto w-full max-w-[1500px] shrink-0 rounded-[28px] border border-white/70 bg-white/82 px-5 py-4 shadow-[0_18px_60px_rgba(89,54,180,0.10)] backdrop-blur dark:border-[#2a2739] dark:bg-[#181722]/90 dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Brand />
              <span className="rounded-full bg-[#f2ebff] px-3 py-1 text-xs font-semibold text-[#684fe9] ring-1 ring-[#d8cbff] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff] dark:ring-[#2a2739]">
                唯一主入口
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#67738c] ring-1 ring-[#ebe3fb] dark:bg-[#1c1a28] dark:text-[#8b91a3] dark:ring-[#2a2739]">
                {config.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CompactMetric label="目标分数" value={`${scoreCenter.panel.targetScore}`} />
              <CompactMetric label="距离考试" value={`${scoreCenter.panel.daysToExam} 天`} />
              <CompactMetric label="今日预算" value={`${scoreCenter.budget.totalMinutes} 分钟`} />
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-[#ece4fb] bg-white px-4 text-sm font-semibold text-[#5f6983] transition hover:bg-[#faf8ff] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#8b91a3] dark:hover:bg-[rgba(255,255,255,0.05)]"
                href="/settings"
              >
                <Settings className="h-4 w-4" />
                设置
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <div className={cn("mx-auto min-h-0 w-full flex-1", standalone ? "max-w-[1500px]" : "max-w-none")}>
        <div className="h-full space-y-4 overflow-y-auto pb-24 xl:hidden">
          <PanelCard className="overflow-hidden">
            <div className="border-b border-[#efe8fb] px-4 py-4 dark:border-[#2a2739]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#775deb] dark:text-[#9580ff]">
                    Score Center
                  </p>
                  <h1 className="mt-1 text-[30px] font-[900] tracking-[-0.05em] text-[#1d1730] dark:text-[#edeef1]">
                    提分中心
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-[#627089] dark:text-[#8b91a3]">
                    今天先学什么，不需要你自己决定。
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                    modeToneMap[scoreCenter.mode],
                  )}
                >
                  {modeLabelMap[scoreCenter.mode]}
                </span>
              </div>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <CompactMetric label="当前估分" value={`${scoreCenter.panel.estimatedScore}`} />
                <CompactMetric label="剩余天数" value={`${scoreCenter.panel.daysToExam} 天`} />
                <CompactMetric label="目标分数" value={`${scoreCenter.panel.targetScore}`} />
                <CompactMetric
                  label="今日预算"
                  value={`${scoreCenter.panel.remainingBudgetMinutes} 分钟`}
                />
              </div>

              <section className="rounded-[22px] border border-[#eee5ff] bg-[linear-gradient(135deg,#fbf8ff_0%,#ffffff_62%,#faf6ff_100%)] p-4 dark:border-[#2a2739] dark:bg-[rgba(149,128,255,0.06)]">
                <div className="flex items-center gap-2 text-[#6d53ea] dark:text-[#9580ff]">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-semibold">老师最新消息</span>
                </div>
                <p className="mt-3 text-[15px] leading-7 text-[#30384e] dark:text-[#c5c8d4]">
                  {latestTeacherMessage?.content}
                </p>
              </section>

              {firstCard ? (
                <section className="rounded-[24px] bg-[#201731] p-4 text-white shadow-[0_18px_40px_rgba(52,30,108,0.28)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/64">
                        第一张卡
                      </p>
                      <h2 className="mt-2 text-[22px] font-[900] tracking-[-0.04em]">
                        {firstCard.title}
                      </h2>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/74">
                      {cardLabelMap[firstCard.cardType]}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/76">{firstCard.whyThisNow}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/68">
                    <span>预计 {firstCard.estimatedTime} 分钟</span>
                    <span>{statusLabelMap[firstCard.status]}</span>
                  </div>
                  <button
                    className="mt-4 flex h-12 w-full items-center justify-between rounded-[18px] bg-white px-4 text-[15px] font-semibold text-[#6d53ea] dark:bg-[#1c1a28] dark:text-[#9580ff]"
                    onClick={() => startCard(firstCard)}
                    type="button"
                  >
                    立即开始第一张卡
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </section>
              ) : null}

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#775deb] dark:text-[#9580ff]">
                      Task Stack
                    </p>
                    <h2 className="mt-1 text-[24px] font-[900] tracking-[-0.04em] text-[#1d1730] dark:text-[#edeef1]">
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

                {scoreCenter.cards.length > 3 ? (
                  <button
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-[#ece4fb] bg-white text-sm font-semibold text-[#6b51ea] transition hover:bg-[#faf7ff] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#9580ff] dark:hover:bg-[rgba(255,255,255,0.05)]"
                    onClick={() => setShowAllCards((current) => !current)}
                    type="button"
                  >
                    {showAllCards ? "收起后续任务" : `展开剩余 ${scoreCenter.cards.length - 3} 张卡`}
                    <ChevronDown className={cn("h-4 w-4 transition", showAllCards && "rotate-180")} />
                  </button>
                ) : null}
              </section>
            </div>
          </PanelCard>

          <PanelCard>
            <div className="border-b border-[#efe8fb] px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#f4edff] text-[#6d53ea] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-[800] tracking-[-0.03em] text-[#241b35] dark:text-[#edeef1]">和老师说一句</h3>
                  <p className="mt-1 text-sm text-[#68748b] dark:text-[#8b91a3]">调整预算、优先级或追问为什么这样排。</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 px-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    className="min-h-11 rounded-[16px] bg-[#f5f0ff] px-3 py-2 text-left text-xs font-medium leading-5 text-[#6f57eb] dark:bg-[rgba(149,128,255,0.08)] dark:text-[#9580ff]"
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

          <PanelColumn exam={exam} mobile scoreCenter={scoreCenter} />
        </div>

        <div className="hidden h-full min-h-0 gap-4 overflow-hidden xl:grid xl:grid-cols-[320px_minmax(0,1fr)_300px]">
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
  return (
    <aside className="h-full min-h-0 overflow-hidden">
      <PanelCard className="flex h-full min-h-0 flex-col overflow-hidden p-0">
        <div className="shrink-0 border-b border-[#efe8fb] px-5 py-4 dark:border-[#2a2739]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#775deb] dark:text-[#9580ff]">
                Teacher Thread
              </p>
              <h2 className="mt-1 text-[24px] font-[900] tracking-[-0.04em] text-[#1d1730] dark:text-[#edeef1]">
                老师线程
              </h2>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                modeToneMap[scoreCenter.mode],
              )}
            >
              {modeLabelMap[scoreCenter.mode]}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex min-h-full flex-col justify-end gap-3">
            <div className="space-y-2 border-b border-[#efe8fb] pb-3 dark:border-[#2a2739]">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#f4edff] text-[#6d53ea] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
                  <ListRestart className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-[800] tracking-[-0.02em] text-[#241b35] dark:text-[#edeef1]">历史决策摘要</h3>
                  <p className="mt-0.5 text-xs text-[#68748b] dark:text-[#8b91a3]">所有建议都来自同一套调度上下文。</p>
                </div>
              </div>
              {scoreCenter.decisionSummary.map((item) => (
                <div
                  key={item}
                  className="rounded-[14px] border border-[#efe8fb] bg-[#faf8ff] px-3 py-2 text-xs leading-5 text-[#5d6780] dark:border-[#2a2739] dark:bg-[rgba(149,128,255,0.06)] dark:text-[#a0a5b8]"
                >
                  {item}
                </div>
              ))}
            </div>

            {scoreCenter.teacherMessages.slice(-8).map((item) => (
              <TeacherBubble key={item.id} message={item} />
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#efe8fb] bg-white px-5 py-4 dark:border-[#2a2739] dark:bg-[#14131f]">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action}
                className="rounded-full bg-[#f5f0ff] px-3 py-1.5 text-xs font-medium text-[#6f57eb] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]"
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

      <PanelCard className="hidden">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f4edff] text-[#6d53ea] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
            <ListRestart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-[800] tracking-[-0.03em] text-[#241b35] dark:text-[#edeef1]">历史决策摘要</h3>
            <p className="mt-1 text-sm text-[#68748b] dark:text-[#8b91a3]">所有建议都来自同一套调度上下文。</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {scoreCenter.decisionSummary.map((item) => (
            <div
              key={item}
              className="rounded-[16px] border border-[#efe8fb] bg-[#faf8ff] px-4 py-3 text-sm leading-6 text-[#5d6780] dark:border-[#2a2739] dark:bg-[rgba(149,128,255,0.06)] dark:text-[#a0a5b8]"
            >
              {item}
            </div>
          ))}
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

  return (
    <main className="h-full min-h-0 space-y-4 overflow-y-auto pr-1">
      <PanelCard className="overflow-hidden">
        <div className="border-b border-[#efe8fb] px-6 py-5 dark:border-[#2a2739]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#775deb] dark:text-[#9580ff]">
                Study Command Center
              </p>
              <h1 className="mt-1 text-[34px] font-[900] tracking-[-0.05em] text-[#1d1730] dark:text-[#edeef1]">
                提分中心
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#616b82] dark:text-[#8b91a3]">
                这里不是聊天页，也不是首页陈列页。它只负责下发任务、解释原因、接收反馈、重算下一步。
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                  modeToneMap[scoreCenter.mode],
                )}
              >
                {modeLabelMap[scoreCenter.mode]}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6b748a] ring-1 ring-[#ece4ff] dark:bg-[#1c1a28] dark:text-[#8b91a3] dark:ring-[#2a2739]">
                {scoreCenter.cards.length} 张卡待执行
              </span>
            </div>
          </div>
        </div>

        {latestTeacherMessage ? (
          <div className="border-b border-[#efe8fb] px-6 py-4 dark:border-[#2a2739]">
            <div className="rounded-[18px] border border-[#eee5ff] bg-[#faf8ff] px-4 py-4 dark:border-[#2a2739] dark:bg-[rgba(149,128,255,0.06)]">
              <div className="flex items-center gap-2 text-[#6d53ea] dark:text-[#9580ff]">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">老师当前提示</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-[#47536c] dark:text-[#a0a5b8]">{latestTeacherMessage.content}</p>
            </div>
          </div>
        ) : null}

        {firstCard ? (
          <div className="border-b border-[#efe8fb] px-6 py-5">
            <button
              className="group flex w-full items-start justify-between gap-4 rounded-[24px] bg-[#201731] px-5 py-5 text-left text-white shadow-[0_18px_40px_rgba(52,30,108,0.28)] transition hover:translate-y-[-1px]"
              onClick={() => startCard(firstCard)}
              type="button"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/82">
                    立即开始第一张卡
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/66">
                    {cardLabelMap[firstCard.cardType]}
                  </span>
                </div>
                <div>
                  <p className="text-[24px] font-[900] tracking-[-0.04em]">{firstCard.title}</p>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/76">
                    {firstCard.whyThisNow}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-white/68">
                  <span>预计 {firstCard.estimatedTime} 分钟</span>
                  <span>完成标准：{firstCard.successSignal}</span>
                </div>
              </div>
              <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white text-[#6d53ea] transition group-hover:translate-x-1 dark:bg-[#1c1a28] dark:text-[#9580ff]">
                <ArrowRight className="h-5 w-5" />
              </div>
            </button>
          </div>
        ) : null}

        <div className="space-y-3 px-6 py-5">
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
        <div className="border-t border-[#efe8fb] px-6 py-4">
          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-[14px] border border-[#ece4ff] bg-white text-sm font-semibold text-[#6b51ea] transition hover:bg-[#faf7ff] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#9580ff] dark:hover:bg-[rgba(255,255,255,0.05)]"
            disabled={isPending}
            onClick={closeDay}
            type="button"
          >
            Close today and summarize
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#775deb] dark:text-[#9580ff]">
              Score Panel
            </p>
            <h2 className="mt-1 text-[24px] font-[900] tracking-[-0.04em] text-[#1d1730] dark:text-[#edeef1]">
              提分面板
            </h2>
          </div>
          <Link
            href={`/${exam}/reports`}
            className="rounded-full bg-[#f4edff] px-3 py-1.5 text-xs font-semibold text-[#6b51ea] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]"
          >
            查看报告
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          <ScorePanelMetric icon={<Gauge className="h-4 w-4" />} label="当前估算分数" value={`${scoreCenter.panel.estimatedScore}`} />
          <ScorePanelMetric icon={<Target className="h-4 w-4" />} label="目标分数" value={`${scoreCenter.panel.targetScore}`} />
          <ScorePanelMetric icon={<CalendarClock className="h-4 w-4" />} label="距离考试" value={`${scoreCenter.panel.daysToExam} 天`} />
          <ScorePanelMetric icon={<Clock3 className="h-4 w-4" />} label="今日剩余预算" value={`${scoreCenter.panel.remainingBudgetMinutes} 分钟`} />
        </div>

        <div className="mt-5 rounded-[18px] border border-[#eee7ff] bg-[#faf7ff] px-4 py-4 dark:border-[#2a2739] dark:bg-[rgba(149,128,255,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#281e3a] dark:text-[#edeef1]">近 7 天趋势</p>
              <p className="mt-1 text-xs text-[#6a748b] dark:text-[#8b91a3]">只看是否朝目标靠近，不堆砌无关图表。</p>
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
                    className="w-full rounded-full bg-gradient-to-t from-[#6e54ec] to-[#c8b8ff]"
                    style={{ height: `${42 + ratio * 58}px` }}
                  />
                  <span className="text-[11px] font-medium text-[#7a84a0]">{index + 1}d</span>
                </div>
              );
            })}
          </div>
        </div>
      </PanelCard>

      <PanelCard>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#fff4df] text-[#c98917] dark:bg-[rgba(201,137,23,0.15)] dark:text-[#d4a532]">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-[800] tracking-[-0.03em] text-[#241b35] dark:text-[#edeef1]">本周主要失分点</h3>
            <p className="mt-1 text-sm text-[#68748b] dark:text-[#8b91a3]">只显示会影响今天排程的高价值状态。</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {scoreCenter.panel.topMistakes.map((item, index) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-[16px] border border-[#f0e8ff] px-4 py-3 dark:border-[#2a2739]"
            >
              <div>
                <p className="text-sm font-semibold text-[#271e39] dark:text-[#edeef1]">
                  TOP {index + 1} · {item}
                </p>
                <p className="mt-1 text-xs text-[#717b92] dark:text-[#8b91a3]">这是今天任务排序和修补插卡的重要依据。</p>
              </div>
              <span className="rounded-full bg-[#f4edff] px-2.5 py-1 text-xs font-semibold text-[#6f57eb] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
                高风险
              </span>
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#eef7ff] text-[#3f7fe4] dark:bg-[rgba(63,127,228,0.15)] dark:text-[#6b9fff]">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-[800] tracking-[-0.03em] text-[#241b35] dark:text-[#edeef1]">脆弱能力节点</h3>
            <p className="mt-1 text-sm text-[#68748b] dark:text-[#8b91a3]">今天的主卡为什么这样排，核心证据在这里。</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {scoreCenter.panel.weakestSkills.map((item) => (
            <div
              key={item}
              className="rounded-[16px] bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)] px-4 py-3 ring-1 ring-[#f0e8ff] dark:bg-[rgba(149,128,255,0.06)] dark:ring-[#2a2739]"
            >
              <p className="text-sm font-semibold text-[#271e39] dark:text-[#edeef1]">{item}</p>
              <p className="mt-1 text-xs leading-5 text-[#717b92] dark:text-[#8b91a3]">
                当前最脆弱的能力节点之一，命中它比继续盲刷更值钱。
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
        {mobile ? (
          <p className="mt-4 text-xs leading-6 text-[#76829a]">
            第二屏只看提分状态、错因变化和预算调整，不做多余的信息堆砌。
          </p>
        ) : null}
      </PanelCard>
    </aside>
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

  const cardStyleMap: Record<ScoreCenterCard["cardType"], string> = {
    score_boost: "border-[#efe8fb] bg-[linear-gradient(180deg,#ffffff_0%,#fcfaff_100%)] shadow-[0_8px_24px_rgba(124,92,250,0.05)] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:shadow-none",
    sprint: "border-[#efe8fb] bg-[linear-gradient(180deg,#ffffff_0%,#fcfaff_100%)] shadow-[0_8px_24px_rgba(124,92,250,0.05)] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:shadow-none",
    repair: "border-[#fcd34d] bg-[#fffbeb] shadow-[0_8px_24px_rgba(251,191,36,0.12)] dark:border-[#b45309] dark:bg-[rgba(245,158,11,0.1)] dark:shadow-none",
    pitfall: "border-[#fcd34d] bg-[#fffbeb] shadow-[0_8px_24px_rgba(251,191,36,0.12)] dark:border-[#b45309] dark:bg-[rgba(245,158,11,0.1)] dark:shadow-none",
    verification: "border-[#34d399] bg-[#ecfdf5] shadow-[0_8px_24px_rgba(52,211,153,0.12)] dark:border-[#059669] dark:bg-[rgba(52,211,153,0.1)] dark:shadow-none",
    recovery: "border-[#e2e8f0] bg-[#f8fafc] shadow-none opacity-95 dark:border-[#374151] dark:bg-[#1f2937]",
    review: "border-[#e2e8f0] bg-[#f8fafc] shadow-none opacity-95 dark:border-[#374151] dark:bg-[#1f2937]",
    foundation: "border-[#e2e8f0] bg-[#f8fafc] shadow-none dark:border-[#374151] dark:bg-[#1f2937]",
    bridge: "border-[#99f6e4] bg-[#f0fdfa] shadow-[0_8px_24px_rgba(20,184,166,0.08)] dark:border-[#14b8a6] dark:bg-[rgba(20,184,166,0.1)] dark:shadow-none",
    mock_anchor: "border-[#c4b5fd] bg-[#f5f3ff] shadow-[0_10px_28px_rgba(124,92,250,0.12)] dark:border-[#6d56d9] dark:bg-[rgba(109,86,217,0.12)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.2)]",
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
    mock_anchor: "bg-[#6f57eb]",
  };

  return (
    <div
      className={cn(
        "rounded-[24px] border bg-white dark:border-[#2a2739] dark:bg-[#1c1a28]",
        compact ? "p-4" : "p-5",
        card.isNew && "ring-2 ring-[#cdbdfd]",
        !card.cardType?.match(/repair|pitfall|verification|recovery|review|foundation|bridge/) && "border-[#efe8fb] shadow-[0_8px_24px_rgba(124,92,250,0.05)]",
        card.cardType === "repair" && "border-[#fcd34d]/50 bg-[#fffbeb]/5 dark:bg-[rgba(245,158,11,0.08)]",
        card.cardType === "pitfall" && "border-[#fcd34d]/50 bg-[#fffbeb]/5 dark:bg-[rgba(245,158,11,0.08)]",
        card.cardType === "verification" && "border-[#34d399]/50 bg-[#ecfdf5]/5 dark:bg-[rgba(52,211,153,0.08)]",
        card.cardType === "recovery" && "border-[#e2e8f0] bg-[#f8fafc] dark:border-[#374151] dark:bg-[#1f2937]",
        card.cardType === "review" && "border-[#e2e8f0] bg-[#f8fafc] dark:border-[#374151] dark:bg-[#1f2937]",
        card.cardType === "foundation" && "border-[#e2e8f0] bg-[#f8fafc] dark:border-[#374151] dark:bg-[#1f2937]",
        card.cardType === "bridge" && "border-[#99f6e4]/50 bg-[#f0fdfa]/5 dark:bg-[rgba(20,184,166,0.08)]",
        card.cardType === "mock_anchor" && "border-[#c4b5fd] bg-[#f5f3ff] dark:border-[#6d56d9] dark:bg-[rgba(109,86,217,0.12)]",
        card.anchorTo && "ring-2 ring-[#8b63ff] shadow-[0_16px_32px_rgba(124,92,250,0.2)] dark:shadow-[0_16px_32px_rgba(0,0,0,0.25)]"
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white", numberBgMap[card.cardType] || numberBgMap.score_boost)}>
              {index + 1}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f4edff] px-3 py-1 text-xs font-semibold text-[#6b51ea] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
                  {cardLabelMap[card.cardType]}
                </span>
                <span className="rounded-full bg-[#f8f7fb] px-3 py-1 text-xs font-semibold text-[#6a748b] dark:bg-[rgba(255,255,255,0.06)] dark:text-[#8b91a3]">
                  {card.estimatedTime} 分钟
                </span>
                {card.isNew ? (
                  <span className="rounded-full bg-[#22163b] px-3 py-1 text-xs font-semibold text-white dark:bg-[rgba(149,128,255,0.2)]">
                    刚更新
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 text-[20px] font-[900] tracking-[-0.04em] text-[#1d1730] dark:text-[#edeef1]">
                {card.title}
              </h3>
            </div>
          </div>
          <span className="rounded-full border border-[#ece4ff] px-2.5 py-1 text-[11px] font-semibold text-[#647089] dark:border-[#2a2739] dark:text-[#8b91a3]">
            {statusLabelMap[card.status]}
          </span>
        </div>

        <div className="rounded-[18px] bg-[#faf6ff] px-4 py-4 ring-1 ring-[#efe7ff] dark:bg-[rgba(149,128,255,0.06)] dark:ring-[#2a2739]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a62ee] dark:text-[#9580ff]">
            Why This Now
          </p>
          <p className="mt-2 text-sm leading-7 text-[#4e5b73] dark:text-[#a0a5b8]">{card.whyThisNow}</p>
        </div>

        {compact && !isExpanded ? (
          <div className="grid gap-2 text-sm text-[#626d84]">
            <MetaRow label="影响收益" value={card.expectedImpact} />
            <MetaRow label="完成标准" value={card.successSignal} />
          </div>
        ) : (
          <div className="grid gap-2 text-sm text-[#626d84] sm:grid-cols-2">
            <MetaRow label="会影响哪一块分数" value={card.expectedImpact} />
            <MetaRow label="影响技能" value={card.targetSkills.join(" · ")} />
            <MetaRow label="做到什么算完成" value={card.successSignal} />
            <MetaRow label="如果失败/跳过(Fallback)" value={card.fallbackAction} />
            {card.expectedOutcome && <MetaRow label="预期后续(Success)" value={card.expectedOutcome} />}
            {card.alternative && <MetaRow label="平行替代(Alternative)" value={card.alternative} />}
            {card.relation?.dependsOn && <MetaRow label="前置依赖(Prerequisite)" value={card.relation.dependsOn.join(", ")} />}
            {card.anchorTo && <MetaRow label="锚点关联(Anchor)" value={card.anchorTo} />}
            {card.evidenceRefs && card.evidenceRefs.length > 0 && <MetaRow label="引用的真题/数据" value={card.evidenceRefs.join(", ")} />}
            <MetaRow label="调度来源" value={`${card.originEngine} · 置信度 ${Math.round(card.confidence * 100)}%`} />
          </div>
        )}

        {(isExpanded || !compact) && card.weightBreakdown ? (
          <div className="rounded-[18px] border border-[#efe8fb] bg-white px-4 py-4 dark:border-[#2a2739] dark:bg-[#14131f]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a62ee] dark:text-[#9580ff]">
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
        ) : null}

        {compact && (
          <button
            className="mx-auto mt-2 block text-xs font-medium text-[#7c5cfa] hover:text-[#6a4ce2]"
            onClick={() => setIsExpanded((e) => !e)}
            type="button"
          >
            {isExpanded ? "收起详细调度信息" : "展开详细调度信息"}
          </button>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            className="inline-flex h-11 items-center justify-center rounded-[16px] border border-[#ece4ff] bg-white px-4 text-sm font-semibold text-[#647089] transition hover:bg-[#faf7ff] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#8b91a3] dark:hover:bg-[rgba(255,255,255,0.05)]"
            onClick={onPostpone}
            type="button"
          >
            Postpone
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-[16px] border border-[#f1d7d7] bg-white px-4 text-sm font-semibold text-[#a94e4e] transition hover:bg-[#fff8f8] dark:border-[#3d2525] dark:bg-[#1c1a28] dark:text-[#e57373] dark:hover:bg-[rgba(234,115,115,0.1)]"
            onClick={onSkip}
            type="button"
          >
            Skip
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-[16px] bg-[#201731] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2044] dark:bg-[#6d56d9] dark:hover:bg-[#8068ff]"
            onClick={onStart}
            type="button"
          >
            {card.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeacherBubble({ message }: { message: TeacherMessage }) {
  const isTeacher = message.role === "teacher";

  return (
    <div
      className={cn(
        "rounded-[18px] px-4 py-3 text-sm leading-6",
        isTeacher
          ? "bg-[linear-gradient(180deg,#fbf8ff_0%,#f6efff_100%)] text-[#445168] ring-1 ring-[#efe7ff] dark:bg-[rgba(149,128,255,0.08)] dark:text-[#a0a5b8] dark:ring-[#2a2739]"
          : "bg-[#23183d] text-white dark:bg-[#2b2044]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a62ee] dark:text-[#9580ff]">
          {isTeacher ? message.kind : "user"}
        </span>
        <span className={cn("text-[11px]", isTeacher ? "text-[#8590a6]" : "text-white/60")}>
          {new Date(message.createdAt).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className={cn("mt-2", !isTeacher && "text-white/86")}>{message.content}</p>
    </div>
  );
}

function ScorePanelMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-[#efe7ff] px-4 py-3 dark:border-[#2a2739]">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#f4edff] text-[#6d53ea] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#7a84a0] dark:text-[#8b91a3]">{label}</p>
        <p className="mt-1 text-sm font-semibold text-[#231a35] dark:text-[#edeef1]">{value}</p>
      </div>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[#ece4fb] bg-white px-4 py-2.5 dark:border-[#2a2739] dark:bg-[#181722]">
      <p className="text-[11px] text-[#7c87a0] dark:text-[#8b91a3]">{label}</p>
      <p className="mt-1 text-sm font-[800] text-[#231a35] dark:text-[#edeef1]">{value}</p>
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
    <div className="rounded-[16px] bg-[#faf7ff] px-4 py-3 ring-1 ring-[#efe8fb] dark:bg-[rgba(149,128,255,0.06)] dark:ring-[#2a2739]">
      <div className="flex items-center gap-2 text-[#6d53ea] dark:text-[#9580ff]">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#2a203c] dark:text-[#edeef1]">{value}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-[#fbfaff] px-3 py-3 ring-1 ring-[#f0eaff] dark:bg-[rgba(149,128,255,0.06)] dark:ring-[#2a2739]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a94aa] dark:text-[#8b91a3]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[#4d5971] dark:text-[#a0a5b8]">{value}</p>
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
        "rounded-[28px] border border-[#ebe3fb] bg-white p-5 shadow-[0_16px_50px_rgba(124,92,250,0.08)] dark:border-[#2a2739] dark:bg-[#181722] dark:shadow-[0_16px_50px_rgba(0,0,0,0.3)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
