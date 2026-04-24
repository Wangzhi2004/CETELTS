"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Volume2 } from "lucide-react";

import { submitTaskResult } from "@/app/actions/score-center";
import { mockUser, vocabItems as seedVocabItems } from "@/mocks/student-data";

const desktopTabs = ["复习列表", "新学习列表", "掌握列表", "收藏列表"];

export function VocabReviewWorkspace({ exam, taskId }: { exam: "cet6" | "ielts"; taskId?: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(desktopTabs[0]);
  const [items, setItems] = useState(seedVocabItems);
  const [isPending, startTransition] = useTransition();

  const masteredCount = useMemo(
    () => items.filter((item) => item.mastery >= 0.6).length,
    [items],
  );

  function finishRound() {
    startTransition(async () => {
      await submitTaskResult(mockUser.id, exam, {
        taskId: taskId ?? "unknown",
        status: "success",
        accuracy: masteredCount / items.length,
        timeSpentSec: 10 * 60,
        completionRate: 1,
        confidence: 0.9,
        detectedErrors: masteredCount / items.length < 0.7 ? ["vocabulary_gap"] : [],
        selfAssessment: masteredCount / items.length < 0.7 ? "词汇回忆还不稳定" : "本轮词汇掌握良好",
        subSkillSignals: [],
        reviewQueueDelta: [],
        artifacts: [],
      });
      router.push(`/${exam}/dashboard`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="hidden items-center justify-between lg:flex">
        <h1 className="text-[32px] font-[800] tracking-[-0.03em] text-[#171717]">词汇执行页</h1>
      </div>

      <div className="space-y-3 lg:hidden">
        <div className="flex items-center justify-between">
          <span className="text-[#4f5b76]">←</span>
          <h1 className="text-[20px] font-[800] text-[#1b1d24]">词汇执行页</h1>
          <span className="w-5" />
        </div>
      </div>

      <div className="flex items-center gap-8 overflow-x-auto border-b border-[#ece7f8] px-2 pb-3 text-[16px]">
        {desktopTabs.map((tab) => (
          <button
            key={tab}
            className={`border-b-2 pb-2.5 ${
              activeTab === tab
                ? "border-[#7c5cfa] font-semibold text-[#7c5cfa]"
                : "border-transparent text-[#5f6983]"
            }`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-[24px] border border-[#efebf8] bg-white px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[18px] font-[800] tracking-[-0.03em] text-[#1a1d26]">
            今日词汇回顾
          </h2>
          <button className="inline-flex items-center gap-1 text-[12px] text-[#7c5cfa]">
            调整
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="总词数" value={`${items.length}`} />
          <Metric label="已掌握" value={`${masteredCount}`} />
          <Metric label="待巩固" value={`${items.length - masteredCount}`} />
          <Metric label="本轮目标" value="完成回忆" />
        </div>
      </div>

      <div className="rounded-[24px] border border-[#efebf8] bg-white">
        <div className="space-y-0">
          {items.map((item) => (
            <div key={item.id} className="border-b border-[#f5f2fb] px-4 py-4 last:border-b-0 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#f3efff] text-[#7c5cfa]">
                    <Volume2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[20px] font-[800] tracking-[-0.04em] text-[#232734]">
                      {item.lemma}
                    </p>
                    <p className="text-[12px] text-[#8a93ab]">{item.phonetic}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-[10px] border border-[#ece7f8] px-3 py-2 text-[12px] font-semibold text-[#6d7690]"
                    onClick={() =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.id === item.id ? { ...entry, mastery: Math.max(0.2, entry.mastery - 0.08) } : entry,
                        ),
                      )
                    }
                    type="button"
                  >
                    再来一次
                  </button>
                  <button
                    className="rounded-[10px] bg-[#8b63ff] px-3 py-2 text-[12px] font-semibold text-white"
                    onClick={() =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.id === item.id ? { ...entry, mastery: Math.min(1, entry.mastery + 0.12) } : entry,
                        ),
                      )
                    }
                    type="button"
                  >
                    掌握
                  </button>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-[#50586c]">
                {item.partOfSpeech} {item.definitions.join("；")}
              </p>
            </div>
          ))}
        </div>
      </div>

      <button
        className="h-12 w-full rounded-[14px] bg-gradient-to-r from-[#7b5cf8] to-[#8b63ff] text-[15px] font-semibold text-white"
        onClick={finishRound}
        type="button"
      >
        {isPending ? "回流分析中..." : "完成本轮词汇并返回提分中心"}
      </button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[#faf8ff] px-4 py-3">
      <p className="text-[11px] text-[#6e7891]">{label}</p>
      <p className="mt-1 text-[20px] font-[800] leading-none text-[#232734]">{value}</p>
    </div>
  );
}
