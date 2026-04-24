"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Clock3 } from "lucide-react";

import { submitTaskResult } from "@/app/actions/score-center";
import { evaluateReadingAttempt } from "@/domain/study-engine";
import { readingPassage, readingQuestions, readingSection } from "@/mocks/student-data";
import { mockUser } from "@/mocks/student-data";
import { MistakeTag, StandardErrorType } from "@/types/domain";

const mistakeTags: MistakeTag[] = [
  "词汇不认识",
  "长难句没读懂",
  "定位错误",
  "主旨误判",
  "干扰项误选",
  "时间压力",
  "粗心",
];

const mapMistakeTagToStandardError = (tag: MistakeTag): StandardErrorType => {
  const mapping: Record<MistakeTag, StandardErrorType> = {
    "词汇不认识": "vocabulary_gap",
    "长难句没读懂": "syntax_parse_failure",
    "定位错误": "evidence_location_failure",
    "主旨误判": "topic_misread",
    "干扰项误选": "option_discrimination_failure",
    "时间压力": "timing_failure",
    "粗心": "inference_failure",
  };
  return mapping[tag] || "inference_failure";
};

export function ReadingWorkspace({ exam, taskId }: { exam: "cet6" | "ielts"; taskId?: string }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selfTags, setSelfTags] = useState<Record<string, MistakeTag>>({});
  const [selectedQuestionId, setSelectedQuestionId] = useState(readingQuestions[0].id);
  const [reviewMode, setReviewMode] = useState(false);
  const [showDetail, setShowDetail] = useState(true);
  const [isPending, startTransition] = useTransition();

  const selectedQuestion =
    readingQuestions.find((question) => question.id === selectedQuestionId) ?? readingQuestions[0];

  const wrongQuestions = useMemo(
    () =>
      readingQuestions.filter(
        (question) =>
          reviewMode &&
          answers[question.id] &&
          answers[question.id] !== question.correctAnswer,
      ),
    [answers, reviewMode],
  );

  const summary = useMemo(
    () =>
      reviewMode
        ? evaluateReadingAttempt({
            sectionId: readingSection.id,
            sourceWeight: 1.2,
            responses: readingQuestions.map((question) => ({
              questionId: question.id,
              answer: answers[question.id] ?? "",
              correctAnswer: question.correctAnswer,
              selfTag: selfTags[question.id],
              elapsedSec: 45,
            })),
          })
        : null,
    [answers, reviewMode, selfTags],
  );

  function submitReadingResult() {
    const finalSummary =
      summary ??
      evaluateReadingAttempt({
        sectionId: readingSection.id,
        sourceWeight: 1.2,
        responses: readingQuestions.map((question) => ({
          questionId: question.id,
          answer: answers[question.id] ?? "",
          correctAnswer: question.correctAnswer,
          selfTag: selfTags[question.id],
          elapsedSec: 45,
        })),
      });

    startTransition(async () => {
      await submitTaskResult(mockUser.id, exam, {
        taskId: taskId ?? "unknown",
        status: finalSummary.accuracy >= 0.7 ? "success" : "failed",
        accuracy: finalSummary.accuracy,
        timeSpentSec: 18 * 60,
        completionRate: 1,
        confidence: 0.8,
        detectedErrors: finalSummary.mistakeLogs.map((item) => mapMistakeTagToStandardError(item.systemTag)),
        selfAssessment:
          finalSummary.accuracy >= 0.7 ? "本轮阅读基本稳定" : "阅读定位与同义替换仍不稳定",
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
        <h1 className="text-[32px] font-[800] tracking-[-0.03em] text-[#171717]">阅读执行页</h1>
        <div className="flex items-center gap-6 text-sm text-[#5d6881]">
          <div className="inline-flex items-center gap-2 rounded-[14px] border border-[#ece7f8] px-4 py-3">
            <Clock3 className="h-4 w-4" />
            29:35
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        <div className="flex items-center justify-between">
          <button className="text-[#4f5b76]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[20px] font-[800] text-[#1b1d24]">阅读执行页</h1>
          <span className="w-5" />
        </div>

        <div className="rounded-[20px] border border-[#efebf8] bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-[12px] text-[#6d7690]">
            <span>2019-12 第 2 套</span>
            <span className="rounded-full bg-[#f3efff] px-2.5 py-1 font-medium text-[#7c5cfa]">
              阅读专项
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[15px] font-semibold text-[#252834]">{readingSection.title}</p>
            <div className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#ece7f8] px-3 py-2 text-[13px] text-[#232734]">
              <Clock3 className="h-3.5 w-3.5" />
              29:35
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {readingQuestions.map((question) => (
            <button
              key={question.id}
              className={`min-w-9 rounded-[10px] px-3 py-2 text-[13px] font-medium ${
                selectedQuestionId === question.id
                  ? "bg-[#7c5cfa] text-white"
                  : answers[question.id]
                    ? "bg-[#f3efff] text-[#7c5cfa]"
                    : "bg-white text-[#5f6983]"
              }`}
              onClick={() => setSelectedQuestionId(question.id)}
              type="button"
            >
              {question.number}
            </button>
          ))}
        </div>

        <div className="rounded-[20px] border border-[#efebf8] bg-white px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-[800] tracking-[-0.03em] text-[#232734]">题目</h2>
              <span className="text-[13px] text-[#5f6983]">{selectedQuestion.number}/3</span>
            </div>
            <button
              className="inline-flex items-center gap-1 text-[12px] text-[#7c5cfa]"
              onClick={() => setShowDetail((current) => !current)}
              type="button"
            >
              {showDetail ? "收起精读" : "展开精读"}
              <ChevronDown className={`h-3.5 w-3.5 transition ${showDetail ? "rotate-180" : ""}`} />
            </button>
          </div>

          <p className="text-[15px] leading-7 text-[#232734]">{selectedQuestion.stem}</p>

          <div className="mt-3 space-y-2.5">
            {selectedQuestion.choices.map((choice) => {
              const active = answers[selectedQuestion.id] === choice.label;
              return (
                <button
                  key={choice.id}
                  className={`flex w-full items-center justify-between rounded-[14px] border px-4 py-3 text-left text-[14px] ${
                    active
                      ? "border-[#8b63ff] bg-[#fbf9ff] text-[#2f3450]"
                      : "border-[#ece7f8] bg-white text-[#343946]"
                  }`}
                  onClick={() =>
                    setAnswers((current) => ({ ...current, [selectedQuestion.id]: choice.label }))
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

          {showDetail ? (
            <div className="mt-4 rounded-[14px] border border-[#f0ebf8] px-3 py-3">
              <p className="text-[14px] font-medium text-[#232734]">原文</p>
              <p className="mt-2 text-[14px] leading-7 text-[#303542]">{readingPassage.content}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <div className="rounded-[26px] border border-[#efebf8] bg-white px-7 py-6">
            <h2 className="text-[34px] font-[800] tracking-[-0.04em] text-[#20232d]">Passage 1</h2>
            <div className="mt-5 space-y-7 text-[18px] leading-[2.15] text-[#27303b]">
              {readingPassage.content.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[26px] border border-[#efebf8] bg-white px-5 py-5">
            <h3 className="text-[28px] font-[800] tracking-[-0.04em] text-[#232734]">题目</h3>
            <p className="mt-5 text-[18px] leading-[1.8] text-[#232734]">{selectedQuestion.stem}</p>
            <div className="mt-4 space-y-3">
              {selectedQuestion.choices.map((choice) => {
                const active = answers[selectedQuestion.id] === choice.label;
                return (
                  <button
                    key={choice.id}
                    className={`flex w-full items-center justify-between rounded-[18px] border px-5 py-4 text-left text-[16px] ${
                      active
                        ? "border-[#8b63ff] bg-[#fbf9ff] text-[#2f3450]"
                        : "border-[#ece7f8] bg-white text-[#343946]"
                    }`}
                    onClick={() =>
                      setAnswers((current) => ({ ...current, [selectedQuestion.id]: choice.label }))
                    }
                    type="button"
                  >
                    <span>
                      <span className="mr-3 font-medium">{choice.label}.</span>
                      {choice.content}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {reviewMode ? (
        <div className="rounded-[24px] border border-[#efebf8] bg-white px-5 py-5">
          <h3 className="text-[22px] font-[800] tracking-[-0.03em] text-[#232734]">先判断你为什么错</h3>
          {wrongQuestions.length > 0 ? (
            <div className="mt-4 space-y-3">
              {wrongQuestions.map((question) => (
                <div key={question.id} className="rounded-[18px] border border-[#f0ebf8] p-4">
                  <p className="text-sm font-medium text-[#252a36]">
                    {question.number}. {question.stem}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mistakeTags.map((tag) => (
                      <button
                        key={tag}
                        className={`rounded-full px-3 py-1.5 text-xs ${
                          selfTags[question.id] === tag
                            ? "bg-[#7c5cfa] text-white"
                            : "bg-[#f7f6fb] text-[#6e7992]"
                        }`}
                        onClick={() =>
                          setSelfTags((current) => ({ ...current, [question.id]: tag }))
                        }
                        type="button"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#69758f]">这一轮没有错题，可以直接回流提分中心继续下一张卡。</p>
          )}
          <button
            className="mt-4 h-12 w-full rounded-[14px] bg-[#7c5cfa] text-[15px] font-semibold text-white"
            onClick={submitReadingResult}
            type="button"
          >
            {isPending ? "回流分析中..." : "提交结果并返回提分中心"}
          </button>
        </div>
      ) : (
        <button
          className="h-12 w-full rounded-[14px] bg-gradient-to-r from-[#7b5cf8] to-[#8b63ff] text-[15px] font-semibold text-white"
          onClick={() => setReviewMode(true)}
          type="button"
        >
          完成本轮训练，进入回流分析
        </button>
      )}
    </div>
  );
}
