"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Clock3 } from "lucide-react";

import { submitTaskResult } from "@/app/actions/score-center";
import { getReadingSections, type SectionWithData } from "@/app/actions/questions";
import { evaluateReadingAttempt } from "@/domain/study-engine";
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
  const [sectionData, setSectionData] = useState<SectionWithData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selfTags, setSelfTags] = useState<Record<string, MistakeTag>>({});
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [reviewMode, setReviewMode] = useState(false);
  const [showDetail, setShowDetail] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    getReadingSections(exam).then((sections) => {
      if (mounted && sections.length > 0) {
        const section = sections[0];
        setSectionData(section);
        const allQuestions = section.passages.flatMap((p) => p.questions).concat(section.questions);
        if (allQuestions.length > 0) {
          setSelectedQuestionId(allQuestions[0].id);
        }
      }
    });
    return () => { mounted = false; };
  }, [exam]);

  const allQuestions = useMemo(() => {
    if (!sectionData) return [];
    return sectionData.passages.flatMap((p) => p.questions).concat(sectionData.questions);
  }, [sectionData]);

  const selectedQuestion = allQuestions.find((q) => q.id === selectedQuestionId) ?? allQuestions[0];

  const currentPassage = useMemo(() => {
    if (!sectionData || !selectedQuestion) return null;
    return sectionData.passages.find((p) => p.questions.some((q) => q.id === selectedQuestion.id)) ?? null;
  }, [sectionData, selectedQuestion]);

  const wrongQuestions = useMemo(
    () =>
      reviewMode
        ? allQuestions.filter(
            (question) =>
              answers[question.id] &&
              answers[question.id] !== question.choices.find((c) => c.isCorrect)?.label,
          )
        : [],
    [answers, reviewMode, allQuestions],
  );

  const summary = useMemo(
    () =>
      reviewMode && sectionData
        ? evaluateReadingAttempt({
            sectionId: sectionData.id,
            sourceWeight: 1.2,
            responses: allQuestions.map((question) => ({
              questionId: question.id,
              answer: answers[question.id] ?? "",
              correctAnswer: question.choices.find((c) => c.isCorrect)?.label ?? "",
              selfTag: selfTags[question.id],
              elapsedSec: 45,
            })),
          })
        : null,
    [answers, reviewMode, selfTags, allQuestions, sectionData],
  );

  function submitReadingResult() {
    if (!sectionData || !summary) return;
    startTransition(async () => {
      await submitTaskResult("user-alex", exam, {
        taskId: taskId ?? "unknown",
        status: summary.accuracy >= 0.7 ? "success" : "failed",
        accuracy: summary.accuracy,
        timeSpentSec: 18 * 60,
        completionRate: 1,
        confidence: 0.8,
        detectedErrors: summary.mistakeLogs.map((item) => mapMistakeTagToStandardError(item.systemTag)),
        selfAssessment:
          summary.accuracy >= 0.7 ? "本轮阅读基本稳定" : "阅读定位与同义替换仍不稳定",
        subSkillSignals: [],
        reviewQueueDelta: [],
        artifacts: [],
      });
      router.push(`/${exam}/dashboard`);
    });
  }

  if (!sectionData || allQuestions.length === 0) {
    return (
      <div className="flex h-[50dvh] flex-col items-center justify-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        <p className="text-sm font-medium text-violet-900/60">正在加载阅读题目…</p>
      </div>
    );
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
            <span>{sectionData.title}</span>
            <span className="rounded-full bg-[#f3efff] px-2.5 py-1 font-medium text-[#7c5cfa]">
              阅读专项
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[15px] font-semibold text-[#252834]">{currentPassage?.title ?? sectionData.title}</p>
            <div className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#ece7f8] px-3 py-2 text-[13px] text-[#232734]">
              <Clock3 className="h-3.5 w-3.5" />
              29:35
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {allQuestions.map((question, index) => (
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
              {index + 1}
            </button>
          ))}
        </div>

        {selectedQuestion && (
          <div className="rounded-[20px] border border-[#efebf8] bg-white px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-[800] tracking-[-0.03em] text-[#232734]">题目</h2>
                <span className="text-[13px] text-[#5f6983]">
                  {allQuestions.indexOf(selectedQuestion) + 1}/{allQuestions.length}
                </span>
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

            {showDetail && currentPassage ? (
              <div className="mt-4 rounded-[14px] border border-[#f0ebf8] px-3 py-3">
                <p className="text-[14px] font-medium text-[#232734]">原文</p>
                <div className="mt-2 space-y-4">
                  {currentPassage.body.split("\n\n").map((paragraph) => (
                    <p key={paragraph.slice(0, 20)} className="text-[14px] leading-7 text-[#303542]">{paragraph}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <div className="rounded-[26px] border border-[#efebf8] bg-white px-7 py-6">
            <h2 className="text-[34px] font-[800] tracking-[-0.04em] text-[#20232d]">
              {currentPassage?.title ?? "Passage"}
            </h2>
            <div className="mt-5 space-y-7 text-[18px] leading-[2.15] text-[#27303b]">
              {currentPassage
                ? currentPassage.body.split("\n\n").map((paragraph) => (
                    <p key={paragraph.slice(0, 20)}>{paragraph}</p>
                  ))
                : <p>暂无文章内容</p>
              }
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedQuestion && (
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
          )}
        </div>
      </div>

      {reviewMode ? (
        <div className="rounded-[24px] border border-[#efebf8] bg-white px-5 py-5">
          <h3 className="text-[22px] font-[800] tracking-[-0.03em] text-[#232734]">先判断你为什么错</h3>
          {wrongQuestions.length > 0 ? (
            <div className="mt-4 space-y-3">
              {wrongQuestions.map((question, index) => (
                <div key={question.id} className="rounded-[18px] border border-[#f0ebf8] p-4">
                  <p className="text-sm font-medium text-[#252a36]">
                    {index + 1}. {question.stem}
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