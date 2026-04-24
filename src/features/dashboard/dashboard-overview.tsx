"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUp,
  BookOpen,
  Clock3,
  Flame,
  Headphones,
  PenLine,
  Sparkles,
  Target,
} from "lucide-react";

import { TaskCard } from "@/components/shared/task-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockDashboardStats } from "@/mocks/student-data";
import { useStudyState } from "@/state/study-state";
import { cn, formatMinutes, formatPercent } from "@/lib/utils";

const taskHrefMap: Record<string, string> = {
  reading: "/reading/paper-2019-12-set2/section-reading-2019-12-a",
  listening: "/listening/paper-2020-06-set1/section-listening-2020-06-a",
  vocab: "/vocab",
  writing: "/writing",
  mock: "/mock",
  review: "/mistakes",
};

const statCards = [
  {
    key: "time",
    label: "今日学习",
    value: formatMinutes(mockDashboardStats.todayMinutes),
    sub: "目标 4h",
    trailing: "65%",
  },
  {
    key: "accuracy",
    label: "正确率",
    value: formatPercent(mockDashboardStats.accuracy),
    sub: "较昨日",
    trailing: "8%",
  },
  {
    key: "questions",
    label: "做题量",
    value: `${mockDashboardStats.completedQuestions} 题`,
    sub: "较昨日",
    trailing: "12",
  },
  {
    key: "vocab",
    label: "掌握词汇",
    value: `${mockDashboardStats.masteredWords}`,
    sub: "较昨日",
    trailing: "32",
  },
];

export function DashboardOverview({ exam }: { exam: "cet6" | "ielts" }) {
  const { state } = useStudyState();
  const progressData = mockDashboardStats.weekHours.map((value, index) => ({
    name: ["一", "二", "三", "四", "五", "六", "日"][index],
    value,
  }));
  const radarData = mockDashboardStats.moduleScores.map((item) => ({
    subject: item.label,
    value: item.value,
  }));
  const reviewMap = {
    reading: { label: "阅读", icon: BookOpen, count: 5, color: "text-[#8b63ff]" },
    listening: { label: "听力", icon: Headphones, count: 3, color: "text-[#5f97ff]" },
    vocab: { label: "词汇", icon: Sparkles, count: 2, color: "text-[#49c78c]" },
    writing: { label: "写作", icon: PenLine, count: 2, color: "text-[#ff9a51]" },
  } as const;

  return (
    <div className="space-y-4">
      <div className="space-y-3 lg:hidden">
        <section className="rounded-[20px] border border-[#efebf8] bg-white px-4 py-4 dark:border-[#2a2739] dark:bg-[#181722]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-[700] tracking-[-0.03em] text-[#171717] dark:text-[#edeef1]">
                早上好，Alex👋
              </h1>
              <p className="mt-1 text-[13px] text-[#6f7891] dark:text-[#8b91a3]">今天先做阅读精练，再补听力定位。</p>
            </div>
            <div className="rounded-[16px] bg-gradient-to-r from-[#6e5bf7] to-[#8b63ff] px-3 py-3 text-white dark:from-[#9580ff] dark:to-[#8068ff]">
              <p className="text-[11px] text-white/80">距离考试</p>
              <p className="mt-1 text-[28px] font-[800] leading-none">128</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-[14px] bg-[#faf8ff] px-3 py-3 dark:bg-[rgba(149,128,255,0.08)]">
              <p className="text-[11px] text-[#7b85a0] dark:text-[#8b91a3]">今日目标</p>
              <p className="mt-1 text-[20px] font-[700] leading-none text-[#232734] dark:text-[#edeef1]">3 项</p>
            </div>
            <div className="rounded-[14px] bg-[#faf8ff] px-3 py-3 dark:bg-[rgba(149,128,255,0.08)]">
              <p className="text-[11px] text-[#7b85a0] dark:text-[#8b91a3]">预计用时</p>
              <p className="mt-1 text-[20px] font-[700] leading-none text-[#232734] dark:text-[#edeef1]">115 分钟</p>
            </div>
            <div className="rounded-[14px] bg-[#faf8ff] px-3 py-3 dark:bg-[rgba(149,128,255,0.08)]">
              <div className="flex items-center gap-1 text-[#7c5cfa] dark:text-[#9580ff]">
                <Flame className="h-3.5 w-3.5" />
                <p className="text-[11px]">连续学习</p>
              </div>
              <p className="mt-1 text-[20px] font-[700] leading-none text-[#232734] dark:text-[#edeef1]">7 天</p>
            </div>
            <div className="rounded-[14px] bg-[#faf8ff] px-3 py-3 dark:bg-[rgba(149,128,255,0.08)]">
              <div className="flex items-center gap-1 text-[#4b83ed] dark:text-[#6b9fff]">
                <Clock3 className="h-3.5 w-3.5" />
                <p className="text-[11px]">待复习</p>
              </div>
              <p className="mt-1 text-[20px] font-[700] leading-none text-[#232734] dark:text-[#edeef1]">
                {state.tasks.length} 项
              </p>
            </div>
          </div>

          <Button
            asChild
            className="mt-3 h-11 w-full rounded-[14px] bg-gradient-to-r from-[#7b5cf8] to-[#8b63ff] text-[15px] font-semibold"
          >
            <Link href={`/${exam}${taskHrefMap[state.tasks[0]?.taskType ?? "reading"]}`}>
              开始今日学习
            </Link>
          </Button>
        </section>

        <section className="rounded-[20px] border border-[#efebf8] bg-white px-4 py-4 dark:border-[#2a2739] dark:bg-[#181722]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-[700] tracking-[-0.03em] text-[#1a1d26] dark:text-[#edeef1]">
              今日任务
            </h2>
            <Link href={`/${exam}/dashboard`} className="text-[12px] font-medium text-[#7c5cfa] dark:text-[#9580ff]">
              全部
            </Link>
          </div>
          <div className="space-y-2.5">
            {state.tasks.slice(0, 3).map((task, index) => (
              <TaskCard
                key={task.id}
                index={index}
                task={task}
                href={`/${exam}${taskHrefMap[task.taskType]}`}
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-[18px] border border-[#efebf8] bg-white px-4 py-4 dark:border-[#2a2739] dark:bg-[#181722]">
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-[700] tracking-[-0.03em] text-[#1a1d26] dark:text-[#edeef1]">
                学习数据
              </h3>
              <Link href={`/${exam}/reports`} className="text-[12px] font-medium text-[#7c5cfa] dark:text-[#9580ff]">
                查看
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {statCards.map((card) => (
                <div key={card.key} className="rounded-[14px] bg-[#faf8ff] px-3 py-3 dark:bg-[rgba(149,128,255,0.08)]">
                  <p className="text-[11px] text-[#7b85a0] dark:text-[#8b91a3]">{card.label}</p>
                  <p className="text-[17px] font-[700] leading-none text-[#232734] dark:text-[#edeef1]">
                    {card.key === "accuracy"
                      ? formatPercent(state.completedReadingAccuracy ?? mockDashboardStats.accuracy)
                      : card.value}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-[#8b95ad]">
                    <ArrowUp className="h-2.5 w-2.5 text-[#16b364]" />
                    <span className="text-[#16b364]">{card.trailing}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-[#efebf8] bg-white px-4 py-4 dark:border-[#2a2739] dark:bg-[#181722]">
            <h3 className="text-[17px] font-[700] tracking-[-0.03em] text-[#1a1d26] dark:text-[#edeef1]">
              错题回顾
            </h3>
            <div className="mt-3 grid gap-2">
              {Object.values(reviewMap).map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#f6f2ff] dark:bg-[rgba(149,128,255,0.12)]",
                      item.color,
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[#2a2f3a] dark:text-[#edeef1]">{item.label}</p>
                    <p className="text-[11px] text-[#7b85a0] dark:text-[#8b91a3]">{item.count} 题</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center rounded-[20px] border border-[#f1edf8] bg-white px-5 py-5 lg:min-h-[180px] lg:px-8 dark:border-[#2a2739] dark:bg-[#181722]">
          <h1 className="text-[28px] font-[700] leading-none tracking-[-0.03em] text-[#171717] sm:text-[42px] dark:text-[#edeef1]">
            早上好，Alex👋
          </h1>
          <p className="mt-4 text-[15px] text-[#707b93] dark:text-[#8b91a3]">今天是你坚持学习的第 7 天</p>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-[#6e5bf7] via-[#7b5fff] to-[#8f69ff] px-6 py-6 text-white shadow-[0_12px_28px_rgba(124,92,250,0.18)] dark:from-[#9580ff] dark:via-[#8068ff] dark:to-[#7050ff] dark:shadow-[0_12px_28px_rgba(0,0,0,0.3)]">
          <div className="max-w-[52%]">
            <p className="text-sm text-white/85">距离六级考试还有</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-[60px] font-[700] leading-none">128</span>
              <span className="pb-2 text-[24px]">天</span>
            </div>
            <div className="mt-4 flex items-center gap-3 text-sm text-white/90">
              <span>◎ 目标分数：600+</span>
              <button className="rounded-full bg-white/90 px-4 py-2 font-medium text-[#775cf8]">
                调整目标
              </button>
            </div>
          </div>
          <div className="pointer-events-none absolute right-4 top-4 h-[150px] w-[170px] rounded-[30px] bg-[radial-gradient(circle_at_40%_30%,rgba(255,255,255,0.38),transparent_42%),radial-gradient(circle_at_65%_72%,rgba(255,255,255,0.18),transparent_40%)]">
            <div className="absolute right-[22px] top-[14px] h-[104px] w-[90px] rounded-[20px] bg-white/92 shadow-[0_18px_30px_rgba(73,47,173,0.20)]" />
            <div className="absolute right-[0px] top-[60px] inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#7a5df8] shadow-[0_12px_28px_rgba(72,44,173,0.25)]">
              <Target className="h-7 w-7" />
            </div>
            <div className="absolute right-[120px] top-[100px] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#7a5df8]">
              ⏰
            </div>
          </div>
        </div>
      </div>

      <div className="hidden gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:grid">
        {statCards.map((card) => (
          <Card key={card.key} className="rounded-[18px] border-[#efebf8] bg-white shadow-none dark:border-[#2a2739] dark:bg-[#181722]">
            <CardContent className="p-5">
              <p className="text-sm text-[#6e7891] dark:text-[#8b91a3]">{card.label}</p>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[34px] font-[700] leading-none tracking-[-0.03em] text-[#151823] dark:text-[#edeef1]">
                    {card.value}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-[#8a93ab] dark:text-[#6b7280]">
                    <span>{card.sub}</span>
                    <span className="inline-flex items-center gap-1 text-[#16b364]">
                      <ArrowUp className="h-3 w-3" />
                      {card.trailing}
                    </span>
                  </div>
                </div>
                <div className="rounded-[16px] bg-[#faf8ff] px-3 py-2 text-sm font-semibold text-[#7c5cfa] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
                  {card.key === "accuracy"
                    ? formatPercent(state.completedReadingAccuracy ?? mockDashboardStats.accuracy)
                    : card.trailing}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden gap-4 xl:grid-cols-[1.08fr_0.92fr] lg:grid">
        <Card className="rounded-[18px] border-[#efebf8] bg-white shadow-none dark:border-[#2a2739] dark:bg-[#181722]">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[28px] font-[700] tracking-[-0.03em] text-[#1a1d26] dark:text-[#edeef1]">今日任务</h2>
              <p className="text-sm text-[#7a84a0] dark:text-[#8b91a3]">共 {state.tasks.length} 项任务</p>
            </div>
            <div className="space-y-3">
              {state.tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  index={index}
                  task={task}
                  href={`/${exam}${taskHrefMap[task.taskType]}`}
                />
              ))}
            </div>
            <div className="mt-5 rounded-[14px] bg-[linear-gradient(90deg,#f5f0ff,rgba(245,240,255,0.45))] px-4 py-4 text-sm text-[#7a84a0] dark:bg-[rgba(149,128,255,0.06)] dark:text-[#8b91a3]">
              <div className="flex items-center gap-2 text-[#686f88] dark:text-[#8b91a3]">
                <span className="text-base">💡</span>
                <span className="font-medium">学习小贴士</span>
              </div>
              <p className="mt-2">每天进步一点点，累积起来就是大进步！</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[18px] border-[#efebf8] bg-white shadow-none dark:border-[#2a2739] dark:bg-[#181722]">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-[28px] font-[700] tracking-[-0.03em] text-[#1a1d26] dark:text-[#edeef1]">学习进度</h3>
                  <p className="mt-1 text-sm text-[#7a84a0] dark:text-[#8b91a3]">本周学习时长趋势</p>
                </div>
                <div className="rounded-full bg-[#f2ecff] px-4 py-2 text-sm font-medium text-[#8a63ff] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
                  平均 2.6h
                </div>
              </div>
              <div className="h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressData} margin={{ left: -16, right: 0, top: 8, bottom: 0 }}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#8b63ff" barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[18px] border-[#efebf8] bg-white shadow-none dark:border-[#2a2739] dark:bg-[#181722]">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-[28px] font-[700] tracking-[-0.03em] text-[#1a1d26] dark:text-[#edeef1]">能力雷达图</h3>
                  <p className="mt-1 text-sm text-[#7a84a0] dark:text-[#8b91a3]">综合能力评估</p>
                </div>
                <Link href={`/${exam}/reports`} className="text-sm font-medium text-[#7f5ffd] dark:text-[#9580ff]">
                  查看详情
                </Link>
              </div>
              <div className="h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#eee8f8" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#7b85a0", fontSize: 12 }} />
                    <Radar
                      dataKey="value"
                      fill="#8b63ff"
                      fillOpacity={0.22}
                      stroke="#7c5cfa"
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden gap-4 xl:grid-cols-[1.08fr_0.92fr] lg:grid">
        <Card className="rounded-[18px] border-[#efebf8] bg-white shadow-none dark:border-[#2a2739] dark:bg-[#181722]">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[28px] font-[700] tracking-[-0.03em] text-[#1a1d26] dark:text-[#edeef1]">错题回顾</h3>
                <p className="mt-1 text-sm text-[#7a84a0] dark:text-[#8b91a3]">今日需复习 12 题</p>
              </div>
              <Button className="h-10 rounded-[12px] bg-[#8b63ff] px-5 shadow-none hover:bg-[#7b56f4] dark:bg-[#9580ff] dark:hover:bg-[#8068ff]">
                立即复习
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              {Object.values(reviewMap).map((item) => (
                <div key={item.label} className="space-y-3">
                  <div
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#f6f2ff] dark:bg-[rgba(149,128,255,0.12)]",
                      item.color,
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2a2f3a] dark:text-[#edeef1]">{item.label}</p>
                    <p className="mt-1 text-sm text-[#7b85a0] dark:text-[#8b91a3]">{item.count} 题</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border-[#efebf8] bg-white shadow-none dark:border-[#2a2739] dark:bg-[#181722]">
          <CardContent className="flex h-full flex-col justify-between p-5 sm:p-6">
            <div>
              <h3 className="text-[28px] font-[700] tracking-[-0.03em] text-[#1a1d26] dark:text-[#edeef1]">近期模考</h3>
              <p className="mt-4 text-lg font-semibold text-[#232734] dark:text-[#edeef1]">2024年6月六级模拟考试</p>
              <p className="mt-2 text-sm text-[#7b85a0] dark:text-[#8b91a3]">上次成绩：520 分（总分 710）</p>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div className="pointer-events-none inline-flex h-20 w-20 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#f6f0ff,#ece6fb)] text-2xl text-[#8b63ff] shadow-[0_16px_30px_rgba(124,92,250,0.10)] dark:bg-[linear-gradient(180deg,rgba(149,128,255,0.12),rgba(149,128,255,0.18))] dark:shadow-[0_16px_30px_rgba(0,0,0,0.2)]">
                💯
              </div>
              <Button className="h-11 rounded-[14px] bg-[#8b63ff] px-5 shadow-none hover:bg-[#7b56f4] dark:bg-[#9580ff] dark:hover:bg-[#8068ff]">
                继续模考
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
