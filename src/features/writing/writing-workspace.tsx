"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ChevronLeft, Clock3, Link2, List, Pause, RotateCcw, RotateCw } from "lucide-react";

import { submitTaskResult } from "@/app/actions/score-center";
import { essayPrompts, mockEssayDraft, mockUser } from "@/mocks/student-data";

export function WritingWorkspace({ exam, taskId }: { exam: "cet6" | "ielts"; taskId?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"cet6" | "ielts-task1" | "ielts-task2">(
    exam === "cet6" ? "cet6" : "ielts-task2",
  );
  const [draft, setDraft] = useState(mockEssayDraft);
  const [isPending, startTransition] = useTransition();
  const activePrompt = essayPrompts.find((item) => item.mode === mode) ?? essayPrompts[0];

  function submitEssay() {
    startTransition(async () => {
      const response = await fetch("/api/ai/essay-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draft,
          prompt: activePrompt.prompt,
        }),
      });
      const result = (await response.json()) as { data: unknown };

      await submitTaskResult(mockUser.id, exam, {
        taskId: taskId ?? "unknown",
        status: "success",
        accuracy: 0.74,
        timeSpentSec: 25 * 60,
        completionRate: 1,
        confidence: 0.7,
        detectedErrors: ["writing_task_response_weak", "writing_cohesion_weak"],
        selfAssessment: "写作结构基本完整，但论证展开还不够扎实",
        subSkillSignals: [],
        reviewQueueDelta: [],
        artifacts: [
          {
            draft,
            feedback: result.data,
          }
        ],
      });

      router.push(`/${exam}/writing/submissions/latest`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="hidden items-center justify-between lg:flex">
        <h1 className="text-[32px] font-[800] tracking-[-0.03em] text-[#171717]">写作执行页</h1>
      </div>

      <div className="space-y-3 lg:hidden">
        <div className="flex items-center justify-between">
          <button className="text-[#4f5b76]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[20px] font-[800] text-[#1b1d24]">写作执行页</h1>
          <span className="w-5" />
        </div>
      </div>

      <div className="flex items-center gap-8 overflow-x-auto border-b border-[#ece7f8] px-2 pb-3 text-[16px]">
        {[
          { key: "cet6", label: "六级写作" },
          { key: "ielts-task1", label: "Task 1" },
          { key: "ielts-task2", label: "Task 2" },
        ].map((item) => (
          <button
            key={item.key}
            className={`border-b-2 pb-2.5 ${
              mode === item.key ? "border-[#7c5cfa] font-semibold text-[#7c5cfa]" : "border-transparent text-[#5f6983]"
            }`}
            onClick={() => setMode(item.key as typeof mode)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <div className="rounded-[20px] border border-[#efebf8] bg-white px-4 py-4 sm:rounded-[24px] sm:px-5 sm:py-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[18px] font-[800] tracking-[-0.03em] text-[#1a1d26] sm:text-[28px]">当前题目</h2>
            </div>
            <div className="space-y-3 sm:grid sm:gap-3 lg:grid-cols-[1fr_0.55fr]">
              <div className="rounded-[16px] border border-[#efebf8] px-3 py-3 sm:px-4 sm:py-4">
                <div className="inline-flex rounded-[8px] bg-[#fff3df] px-2 py-1 text-[11px] font-medium text-[#d39119]">
                  题目
                </div>
                <p className="mt-3 text-[14px] leading-7 text-[#232734] sm:text-[18px] sm:leading-9">
                  {activePrompt.prompt}
                </p>
              </div>
              <div className="rounded-[16px] border border-[#efebf8] px-3 py-3 sm:px-4 sm:py-4">
                <p className="text-[14px] font-semibold text-[#232734] sm:text-[18px]">提纲</p>
                <ol className="mt-3 space-y-1.5 text-[12px] leading-5 text-[#5f6983] sm:text-sm">
                  {activePrompt.outline.map((item, index) => (
                    <li key={item}>
                      {index + 1}. {item}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-[#efebf8] bg-white px-4 py-3 sm:rounded-[22px] sm:px-5 sm:py-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="inline-flex flex-wrap items-center gap-2.5 text-[12px] text-[#5f6983] sm:text-sm">
                <span>建议用时 30 分钟</span>
                <Clock3 className="h-3.5 w-3.5 text-[#7c5cfa] sm:h-4 sm:w-4" />
                <span className="text-[18px] font-[800] text-[#232734] sm:text-[22px]">28:36</span>
                <button className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#ece7f8] text-[#7c5cfa] sm:h-10 sm:w-10">
                  <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[11px] text-[#7a84a0] sm:text-sm">
                <Check className="h-3.5 w-3.5 text-[#4db68b]" />
                自动保存
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#efebf8] bg-white px-4 py-4 sm:rounded-[24px] sm:px-5 sm:py-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[18px] font-[800] tracking-[-0.03em] text-[#1a1d26] sm:text-[28px]">我的作文</h2>
              <div className="text-[11px] text-[#7a84a0] sm:text-sm">{draft.length} 字</div>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-[#f1edf8] pb-2.5 text-[#5f6983]">
              <button className="rounded-[10px] border border-[#ece7f8] px-3 py-2 text-[12px] sm:text-sm">正文</button>
              <button>B</button>
              <button>I</button>
              <button>U</button>
              <button><List className="h-4 w-4" /></button>
              <button><Link2 className="h-4 w-4" /></button>
              <button><RotateCcw className="h-4 w-4" /></button>
              <button><RotateCw className="h-4 w-4" /></button>
            </div>
            <textarea
              className="min-h-[180px] w-full resize-none border-none text-[15px] leading-[1.75] text-[#232734] outline-none sm:min-h-[320px] sm:text-[18px] sm:leading-[1.95]"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button
                className="h-12 rounded-[14px] bg-gradient-to-r from-[#7b5cf8] to-[#8b63ff] px-8 text-[15px] font-semibold text-white"
                onClick={submitEssay}
                type="button"
              >
                {isPending ? "AI 分析中..." : "提交作文并回流提分中心"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[20px] border border-[#efebf8] bg-white px-4 py-4 sm:rounded-[24px] sm:px-5 sm:py-5">
            <h2 className="text-[18px] font-[800] tracking-[-0.03em] text-[#1a1d26] sm:text-[28px]">
              AI 写作目标
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-[#667089]">
              <li>先给出清晰立场，不要把观点埋在后半段。</li>
              <li>每一段至少有一个具体展开，而不是抽象表态。</li>
              <li>回流后系统会根据反馈决定是否插入重写卡。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
