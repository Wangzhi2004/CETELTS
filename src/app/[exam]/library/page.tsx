"use client";

import Link from "next/link";
import {
  BookOpen,
  Headphones,
  PenSquare,
  ScrollText,
  ClipboardList,
  Target,
  Search,
  Clock,
  ChevronRight,
  Bot,
  ArrowRight,
} from "lucide-react";
import { examConfigs } from "@/config/exams";

const trainingModules = [
  {
    id: "reading",
    title: "阅读",
    description: "长篇阅读、匹配题、仔细阅读等",
    count: "1200练习",
    icon: BookOpen,
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    href: "reading",
  },
  {
    id: "listening",
    title: "听力",
    description: "短对话、长对话、听力篇章等",
    count: "996练习",
    icon: Headphones,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    href: "listening",
  },
  {
    id: "vocab",
    title: "词汇",
    description: "核心词汇、派生词、词汇搭配等",
    count: "2356练习",
    icon: ScrollText,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    href: "vocab",
  },
  {
    id: "writing",
    title: "写作",
    description: "议论文、图表作文、应用文等",
    count: "468练习",
    icon: PenSquare,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    href: "writing",
  },
  {
    id: "mock",
    title: "模考",
    description: "全真模拟、真题模考、整套卷等",
    count: "36套试卷",
    icon: ClipboardList,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    href: "mock",
  },
  {
    id: "mistakes",
    title: "错题",
    description: "错题难题、原因分析、同类强化",
    count: "522题",
    icon: Target,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    href: "mistakes",
  },
];

export default function LibraryPage({
  params,
}: {
  params: { exam: string };
}) {
  const config = examConfigs[params.exam as "cet6" | "ielts"];

  return (
    <div className="min-h-screen bg-[#f4f2fd] pb-24 lg:pb-8">
      {/* Mobile Layout */}
      <div className="mx-auto max-w-lg space-y-6 px-4 py-6 lg:hidden">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-[#1d1730]">训练库</h1>
          <p className="mt-2 text-base text-[#6b748a]">
            选择你想强化的模块，开始针对性训练
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="搜索练习、资料、题目..."
            className="h-12 w-full rounded-2xl border border-[#e5e0f5] bg-white py-3.5 pl-12 pr-12 text-base text-[#1d1730] placeholder:text-[#9ca3af] shadow-sm focus:border-[#7c5cfa] focus:outline-none focus:ring-2 focus:ring-[#7c5cfa]/20"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#7c5cfa]">
            <Clock className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {trainingModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.id}
                href={`/${params.exam}/${module.href}`}
                className="group flex items-center gap-4 rounded-2xl bg-white p-4.5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 border border-[#f0e8ff] min-h-[88px]"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${module.bgColor} ${module.color} transition-transform group-hover:scale-105`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-[#1d1730]">{module.title}</h3>
                  <p className="mt-1 text-[15px] text-[#6b748a] truncate">{module.description}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-sm font-medium text-[#9ca3af]">{module.count}</span>
                  <ChevronRight className="h-5 w-5 text-[#c4b5fd] transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#9580ff] to-[#7c5cfa] p-6 text-white shadow-xl shadow-purple-200/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold leading-snug">
                不知道练什么？
                <br />
                让老师帮你定制训练
              </h3>
              <p className="mt-2.5 text-base text-white/80 leading-relaxed">
                基于你的薄弱点和考试时间，智能生成个性化训练计划
              </p>
              <Link
                href={`/${params.exam}/dashboard`}
                className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-[#7c5cfa] shadow-lg transition hover:bg-white/90 active:scale-[0.98]"
              >
                定制计划
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="hidden sm:block">
              <Bot className="h-20 w-20 text-white/25" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[#1d1730]">最近学习</h2>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f0e8ff]">
            <p className="text-base text-center text-[#9ca3af] py-8">
              完成训练后，这里会显示你的学习记录
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block mx-auto max-w-[1200px] px-8 py-8">
        <div>
          <h1 className="text-[32px] font-black tracking-tight text-[#1d1730]">训练库</h1>
          <p className="mt-2 text-[15px] text-[#6b748a]">
            选择你想强化的模块，开始针对性训练
          </p>
        </div>

        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="搜索练习、资料、题目..."
            className="h-12 w-full rounded-2xl border border-[#e5e0f5] bg-white py-3.5 pl-12 pr-12 text-[15px] text-[#1d1730] placeholder:text-[#9ca3af] shadow-sm focus:border-[#7c5cfa] focus:outline-none focus:ring-2 focus:ring-[#7c5cfa]/20"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#7c5cfa]">
            <Clock className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {trainingModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.id}
                href={`/${params.exam}/${module.href}`}
                className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 border border-[#f0e8ff] min-h-[88px]"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${module.bgColor} ${module.color} transition-transform group-hover:scale-105`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-[#1d1730]">{module.title}</h3>
                  <p className="mt-1 text-[14px] text-[#6b748a] truncate">{module.description}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-sm font-medium text-[#9ca3af]">{module.count}</span>
                  <ChevronRight className="h-5 w-5 text-[#c4b5fd] transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex gap-4">
          <div className="flex-1 overflow-hidden rounded-3xl bg-gradient-to-br from-[#9580ff] to-[#7c5cfa] p-8 text-white shadow-xl shadow-purple-200/40">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold leading-snug">
                  不知道练什么？
                  让老师帮你定制训练
                </h3>
                <p className="mt-2.5 text-[15px] text-white/80 leading-relaxed">
                  基于你的薄弱点和考试时间，智能生成个性化训练计划
                </p>
                <Link
                  href={`/${params.exam}/dashboard`}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[15px] font-semibold text-[#7c5cfa] shadow-lg transition hover:bg-white/90 active:scale-[0.98]"
                >
                  定制计划
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <Bot className="h-16 w-16 text-white/25 shrink-0" />
            </div>
          </div>

          <div className="w-[280px] space-y-3">
            <h2 className="text-lg font-bold text-[#1d1730]">最近学习</h2>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f0e8ff]">
              <p className="text-[14px] text-center text-[#9ca3af] py-6">
                完成训练后，这里会显示你的学习记录
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}