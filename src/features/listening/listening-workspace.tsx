"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clock3, FileText, Pause } from "lucide-react";

import { submitTaskResult } from "@/app/actions/score-center";
import { listeningLesson, mockUser } from "@/mocks/student-data";

export function ListeningWorkspace({ exam, taskId }: { exam: "cet6" | "ielts"; taskId?: string }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPending, startTransition] = useTransition();

  const accuracy = useMemo(() => {
    if (listeningLesson.questions.length === 0) {
      return 0;
    }

    const correct = listeningLesson.questions.filter(
      (question) => answers[question.id] === question.correctAnswer,
    ).length;
    return Number((correct / listeningLesson.questions.length).toFixed(2));
  }, [answers]);

  function submitListeningResult() {
    startTransition(async () => {
      await submitTaskResult(mockUser.id, exam, {
        taskId: taskId ?? "unknown",
        status: accuracy >= 0.7 ? "success" : "failed",
        accuracy,
        timeSpentSec: 16 * 60,
        completionRate: 1,
        confidence: 0.8,
        detectedErrors: accuracy >= 0.7 ? [] : ["listening_keyword_miss", "listening_structure_loss"],
        selfAssessment: accuracy >= 0.7 ? "听力表现稳定" : "转折和数字捕捉仍不稳定",
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
        <h1 className="text-[32px] font-[800] tracking-[-0.03em] text-[#171717]">听力执行页</h1>
        <div className="inline-flex items-center gap-2 rounded-[14px] border border-[#ece7f8] px-4 py-3 text-sm text-[#5d6881]">
          <Clock3 className="h-4 w-4" />
          18:20
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        <div className="flex items-center justify-between">
          <button className="text-[#4f5b76]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[20px] font-[800] text-[#1b1d24]">听力执行页</h1>
          <span className="w-5" />
        </div>
      </div>

      <div className="rounded-[24px] border border-[#efebf8] bg-white px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-[#7c5cfa]">播放中</p>
            <div className="mt-1 flex items-end gap-1.5">
              <span className="text-[34px] font-[800] leading-none text-[#1b1e28]">00:28</span>
              <span className="pb-1 text-[16px] text-[#7a849d]">/01:24</span>
            </div>
          </div>
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#7b5cf8] text-white shadow-[0_16px_24px_rgba(124,92,250,0.22)]">
            <Pause className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#efebf8] bg-white px-5 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-[800] tracking-[-0.03em] text-[#1a1d26]">题目</h2>
          <span className="text-[12px] text-[#7b85a0]">
            已答 {Object.keys(answers).length}/{listeningLesson.questions.length}
          </span>
        </div>
        {listeningLesson.questions.map((question) => (
          <div key={question.id} className="space-y-2.5">
            <p className="text-[15px] leading-7 text-[#222733]">{question.stem}</p>
            {question.choices.map((choice) => {
              const active = answers[question.id] === choice.label;
              return (
                <button
                  key={choice.id}
                  className={`flex w-full items-center justify-between rounded-[14px] border px-4 py-3 text-left text-[14px] ${
                    active
                      ? "border-[#8b63ff] bg-[#fbf9ff] text-[#2f3450]"
                      : "border-[#ece7f8] bg-white text-[#343946]"
                  }`}
                  onClick={() =>
                    setAnswers((current) => ({ ...current, [question.id]: choice.label }))
                  }
                  type="button"
                >
                  <span className="pr-3">
                    <span className="mr-2 font-medium">{choice.label}.</span>
                    {choice.content}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-[#efebf8] bg-white px-5 py-5">
        <button
          className="flex w-full items-center justify-between"
          onClick={() => setShowTranscript((current) => !current)}
          type="button"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#7c5cfa]" />
            <span className="text-[16px] font-[800] tracking-[-0.03em] text-[#232734]">
              原文 / 解析
            </span>
          </div>
          <span className="text-sm text-[#6f7891]">{showTranscript ? "收起" : "展开"}</span>
        </button>
        {showTranscript ? (
          <div className="mt-3 space-y-2 text-[13px] leading-6 text-[#4e566a]">
            {listeningLesson.segments.map((segment) => (
              <div key={segment.id} className="rounded-[12px] bg-[#faf9fd] px-3 py-2">
                <span className="mr-3 inline-block w-8 text-[#5361d8]">{segment.startSec}s</span>
                {segment.transcript}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <button
        className="h-12 w-full rounded-[14px] bg-gradient-to-r from-[#7b5cf8] to-[#8b63ff] text-[15px] font-semibold text-white"
        onClick={submitListeningResult}
        type="button"
      >
        {isPending ? "回流分析中..." : "提交本轮听力并返回提分中心"}
      </button>
    </div>
  );
}
