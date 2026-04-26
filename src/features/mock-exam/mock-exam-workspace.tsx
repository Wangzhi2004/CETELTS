"use client";

import Link from "next/link";
import { CalendarDays, Headphones, PenLine, ScrollText } from "lucide-react";

import { mockExams } from "@/mocks/student-data";

export function MockExamWorkspace({ exam }: { exam: "cet6" | "ielts" }) {
  const current = mockExams.find((item) => item.paper.examType === exam) ?? mockExams[0];

  return (
    <div className="space-y-4">
      <div className="hidden items-center justify-between lg:flex">
        <h1 className="text-[32px] font-[800] tracking-[-0.03em] text-[#171717]">真题模考</h1>
        <div className="flex items-center gap-6 text-sm text-[#5d6881]">
          <button className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            模考记录
          </button>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        <div className="flex items-center justify-between">
          <button className="text-[#4f5b76]">←</button>
          <h1 className="text-[20px] font-[800] text-[#1b1d24]">真题模考</h1>
          <span className="w-5" />
        </div>
        <div className="overflow-hidden rounded-[20px] bg-gradient-to-r from-[#6e5bf7] to-[#8b63ff] px-4 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[16px] font-semibold">
                {current.paper.year}年{current.paper.month}月 六级真题（一）
              </p>
              <p className="mt-1 text-[12px] text-white/85">共137题 ｜ 130分钟</p>
              <p className="mt-4 text-[11px] text-white/80">距离考试开始</p>
              <p className="mt-1 text-[38px] font-[800] leading-none">02:18:36</p>
              <p className="mt-2 text-[11px] text-white/85">建议时间 09:00–11:10</p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/15 text-2xl">
              📋
            </div>
          </div>
          <button className="mt-4 h-11 w-full rounded-[14px] bg-white text-[15px] font-semibold text-[#765af8]">
            开始模考
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[16px] border border-[#efebf8] bg-white px-3 py-3">
            <p className="text-[11px] text-[#7a84a0]">平均分</p>
            <p className="mt-1 text-[20px] font-[800] leading-none text-[#232734]">482</p>
          </div>
          <div className="rounded-[16px] border border-[#efebf8] bg-white px-3 py-3">
            <p className="text-[11px] text-[#7a84a0]">正确率</p>
            <p className="mt-1 text-[20px] font-[800] leading-none text-[#7c5cfa]">62%</p>
          </div>
          <div className="rounded-[16px] border border-[#efebf8] bg-white px-3 py-3">
            <p className="text-[11px] text-[#7a84a0]">次数</p>
            <p className="mt-1 text-[20px] font-[800] leading-none text-[#232734]">8</p>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#efebf8] bg-white px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[17px] font-[800] tracking-[-0.03em] text-[#1a1d26]">试卷结构</h2>
            <span className="text-[12px] text-[#7c5cfa]">题型说明</span>
          </div>
          <div className="space-y-3">
            {[
              { part: "第一部分", label: "听力理解", meta: "25题 ｜ 30分钟", icon: Headphones },
              { part: "第二部分", label: "阅读理解", meta: "35题 ｜ 40分钟", icon: ScrollText },
              { part: "第三部分", label: "翻译", meta: "15题 ｜ 30分钟", icon: ScrollText },
              { part: "第四部分", label: "写作", meta: "2题 ｜ 30分钟", icon: PenLine },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.part} className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#f4efff] text-[#7c5cfa]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-[#232734]">
                      {item.part} ｜ {item.label}
                    </p>
                    <p className="text-[12px] text-[#7b85a0]">{item.meta}</p>
                  </div>
                  <span className="rounded-full bg-[#f7f6fb] px-2 py-1 text-[11px] text-[#7b85a0]">
                    未开始
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="hidden gap-4 xl:grid-cols-[1.08fr_0.92fr] lg:grid">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[24px] bg-gradient-to-r from-[#6e5bf7] to-[#8b63ff] px-6 py-6 text-white">
            <div className="flex items-start justify-between gap-8">
              <div>
                <h2 className="text-[28px] font-[800] tracking-[-0.03em]">全真模拟考试，还原真实考场环境</h2>
                <div className="mt-8 grid grid-cols-3 gap-6 text-sm">
                  <div><p className="font-semibold">时间控制</p><p className="mt-2 text-white/80">严格计时，含分配时间</p></div>
                  <div><p className="font-semibold">智能评分</p><p className="mt-2 text-white/80">客观评分，精准定位薄弱点</p></div>
                  <div><p className="font-semibold">详细分析</p><p className="mt-2 text-white/80">多维度分析，提供提升建议</p></div>
                </div>
              </div>
              <div className="text-8xl opacity-70">🖥️</div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#efebf8] bg-white px-5 py-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[28px] font-[800] tracking-[-0.03em] text-[#1a1d26]">选择试卷</h2>
            </div>
            <div className="mb-5 hidden grid-cols-4 gap-3 lg:grid">
              {["考试类型：六级", "年份：全部", "难度：全部", "筛选"].map((item) => (
                <button key={item} className="inline-flex h-12 items-center justify-center rounded-[14px] border border-[#ece7f8] px-4 text-sm text-[#5f6983]">{item}</button>
              ))}
            </div>
            <div className="space-y-4">
              {[
                "2018年12月 六级真题（一）",
                "2018年6月 六级真题（一）",
                "2017年12月 六级真题（二）",
                "2017年6月 六级真题（一）",
                "2016年12月 六级真题（一）",
              ].map((title, index) => (
                <div key={title} className={`rounded-[20px] border px-5 py-5 ${index === 0 ? "border-[#cdbefc] bg-[#fcfbff]" : "border-[#efebf8] bg-white"}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[18px] font-[700] tracking-[-0.04em] text-[#232734]">{title}</p>
                      <p className="mt-3 text-sm text-[#7b85a0]">共137题 ｜ 130分钟 ｜ 难度 ⭐⭐⭐⭐☆</p>
                    </div>
                    <ButtonLink exam={exam} primary={index === 0} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-[#efebf8] bg-white px-5 py-5">
            <h3 className="text-[24px] font-[800] tracking-[-0.03em] text-[#232734]">模考流程</h3>
            <div className="mt-6 space-y-6">
              {[
                { part: "第一部分", label: "听力理解", meta: "25题 ｜ 30分钟", icon: Headphones },
                { part: "第二部分", label: "阅读理解", meta: "35题 ｜ 40分钟", icon: ScrollText },
                { part: "第三部分", label: "翻译", meta: "15题 ｜ 30分钟", icon: ScrollText },
                { part: "第四部分", label: "写作", meta: "2题 ｜ 30分钟", icon: PenLine },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.part} className="flex items-start gap-4">
                    <div className="relative">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#8b63ff] text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      {index < 3 ? <div className="absolute left-1/2 top-10 h-11 w-px -translate-x-1/2 bg-[#dfd6fb]" /> : null}
                    </div>
                    <div>
                      <p className="font-semibold text-[#232734]">{item.part} ｜ {item.label}</p>
                      <p className="mt-1 text-sm text-[#7b85a0]">{item.meta}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 text-sm text-[#5e6881]">总计 137 题 ｜ 130分钟</div>
          </div>

          <div className="rounded-[24px] border border-[#efebf8] bg-white px-5 py-5">
            <h3 className="text-[24px] font-[800] tracking-[-0.03em] text-[#232734]">模考记录</h3>
            <div className="mt-5 flex items-center gap-5">
              <div className="relative flex h-[116px] w-[116px] items-center justify-center rounded-full bg-[conic-gradient(from_180deg,#7c5cfa_0_24%,#65b9c9_24%_62%,#f4b254_62%_82%,#ef6f6f_82%_100%)]">
                <div className="h-[86px] w-[86px] rounded-full bg-white" />
                <div className="absolute text-center">
                  <div className="text-[40px] font-[800] leading-none text-[#232734]">8</div>
                  <div className="mt-1 text-xs text-[#7a84a0]">总次数</div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-[#6c7690]">
                <div>优秀（≥550分） 2次</div>
                <div>良好（450–549） 3次</div>
                <div>中等（350–449） 2次</div>
                <div>需努力（&lt;350） 1次</div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div><div className="text-sm text-[#7a84a0]">平均分</div><div className="mt-1 text-[34px] font-[800] text-[#232734]">482</div></div>
              <div><div className="text-sm text-[#7a84a0]">最高分</div><div className="mt-1 text-[34px] font-[800] text-[#232734]">528</div></div>
              <div><div className="text-sm text-[#7a84a0]">正确率</div><div className="mt-1 text-[34px] font-[800] text-[#232734]">62%</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#efebf8] bg-white px-5 py-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <h3 className="text-[24px] font-[800] tracking-[-0.03em] text-[#232734]">备考建议</h3>
            <p className="mt-3 text-sm leading-7 text-[#667089]">建议每周进行 1～2 套真题模考，严格按照考试时间，提升应试性能。</p>
          </div>
          <MetricBox label="最佳模考时间" value="上午 09:00–11:10" />
          <MetricBox label="上次模考时间" value="2024-05-20" />
          <MetricBox label="本周模考计划" value="1/2 套" />
        </div>
      </div>
    </div>
  );
}

function ButtonLink({ exam, primary }: { exam: string; primary?: boolean }) {
  return (
    <Link
      href={`/${exam}/mock/paper-2019-12-set2`}
      className={`inline-flex h-11 items-center justify-center rounded-[14px] px-5 text-sm font-semibold ${
        primary ? "bg-[#8b63ff] text-white" : "border border-[#ece7f8] bg-white text-[#7c5cfa]"
      }`}
    >
      开始模考
    </Link>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#fbf9ff] px-4 py-5">
      <div className="text-sm text-[#7a84a0]">{label}</div>
      <div className="mt-3 text-[24px] font-[800] tracking-[-0.03em] text-[#232734]">{value}</div>
    </div>
  );
}
