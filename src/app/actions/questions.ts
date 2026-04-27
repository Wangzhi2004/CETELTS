"use server";

import { prisma } from "@/server/db/prisma";

export type QuestionShellData = {
  id: number;
  paperId: string | null;
  questionNo: number | null;
  sectionCode: string | null;
  questionType: string | null;
  stem: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  answerKey: string | null;
  answerStatus: string | null;
  sourceUpdatedFrom: string | null;
};

export type SectionTextData = {
  id: number;
  paperId: string | null;
  sectionCode: string | null;
  sourceType: string | null;
  text: string | null;
};

export type PaperData = {
  paperId: string;
  year: number | null;
  month: number | null;
  setNo: number | null;
  originalPdf: string | null;
  answerPdf: string | null;
  answerDocx: string | null;
  answerPairStatus: string | null;
  originalPageCount: number | null;
  answerTextCoverage: string | null;
  notes: string | null;
  writingPrompt: string | null;
  translationPrompt: string | null;
};

export type SectionWithRealData = {
  paperId: string;
  sectionCode: string;
  questions: QuestionShellData[];
  passageText: string | null;
};

export type ReadingPaper = {
  paperId: string;
  title: string;
  sections: SectionWithRealData[];
};

export async function getReadingPapers(exam: "cet6" | "ielts"): Promise<ReadingPaper[]> {
  const papers = await prisma.paper.findMany({
    where: {
      paperId: { startsWith: `${exam}_` },
    },
  });

  const result: ReadingPaper[] = [];

  for (const paper of papers) {
    const questions = await prisma.questionShell.findMany({
      where: {
        paperId: paper.paperId,
        sectionCode: { in: ["reading_a", "reading_b", "reading_c", "reading_b_raw", "reading_a_raw"] },
      },
      orderBy: { questionNo: "asc" },
    });

    const readingQuestions = questions.filter(
      (q) => q.sectionCode !== null && !q.sectionCode.endsWith("_raw"),
    );

    if (readingQuestions.length === 0) continue;

    const sectionCodes = [...new Set(readingQuestions.map((q) => q.sectionCode!))];

    const sections: SectionWithRealData[] = [];

    for (const sectionCode of sectionCodes) {
      const sectionText = await prisma.sectionText.findFirst({
        where: {
          paperId: paper.paperId,
          sectionCode: `${sectionCode}_raw`,
        },
      });

      const sectionQuestions = readingQuestions.filter(
        (q) => q.sectionCode === sectionCode,
      );

      sections.push({
        paperId: paper.paperId,
        sectionCode,
        questions: sectionQuestions,
        passageText: sectionText?.text ?? null,
      });
    }

    const year = paper.year ?? 0;
    const month = paper.month ?? 0;
    const setNo = paper.setNo ?? 0;
    const title = `${year}年${month}月${exam === "cet6" ? "CET-6" : "IELTS"}第${setNo}套`;

    result.push({
      paperId: paper.paperId,
      title,
      sections,
    });
  }

  return result;
}

export async function getListeningPapers(exam: "cet6" | "ielts"): Promise<ReadingPaper[]> {
  const papers = await prisma.paper.findMany({
    where: {
      paperId: { startsWith: `${exam}_` },
    },
  });

  const result: ReadingPaper[] = [];

  for (const paper of papers) {
    const questions = await prisma.questionShell.findMany({
      where: {
        paperId: paper.paperId,
        sectionCode: { in: ["listening", "listening_a", "listening_b", "listening_c"] },
      },
      orderBy: { questionNo: "asc" },
    });

    if (questions.length === 0) continue;

    const sectionCodes = [...new Set(questions.map((q) => q.sectionCode!))];

    const sections: SectionWithRealData[] = [];

    for (const sectionCode of sectionCodes) {
      const sectionQuestions = questions.filter(
        (q) => q.sectionCode === sectionCode,
      );

      const sectionText = await prisma.sectionText.findFirst({
        where: {
          paperId: paper.paperId,
          sectionCode: `${sectionCode}_raw`,
        },
      });

      sections.push({
        paperId: paper.paperId,
        sectionCode,
        questions: sectionQuestions,
        passageText: sectionText?.text ?? null,
      });
    }

    const year = paper.year ?? 0;
    const month = paper.month ?? 0;
    const setNo = paper.setNo ?? 0;
    const title = `${year}年${month}月${exam === "cet6" ? "CET-6" : "IELTS"}第${setNo}套`;

    result.push({
      paperId: paper.paperId,
      title,
      sections,
    });
  }

  return result;
}

export async function getFirstAvailableSection(exam: "cet6" | "ielts", taskType: "reading" | "listening"): Promise<string | null> {
  const sectionCodePrefix = taskType === "reading" ? "reading" : "listening";

  const question = await prisma.questionShell.findFirst({
    where: {
      paperId: { startsWith: `${exam}_` },
      sectionCode: { startsWith: sectionCodePrefix },
    },
    orderBy: { id: "asc" },
  });

  if (!question || !question.paperId || !question.sectionCode) return null;

  return `/${exam}/${taskType}/${question.paperId}/${question.sectionCode}`;
}

export async function getSectionDetail(
  exam: "cet6" | "ielts",
  paperId: string,
  sectionCode: string,
): Promise<SectionWithRealData | null> {
  const questions = await prisma.questionShell.findMany({
    where: {
      paperId,
      sectionCode,
    },
    orderBy: { questionNo: "asc" },
  });

  if (questions.length === 0) return null;

  const sectionText = await prisma.sectionText.findFirst({
    where: {
      paperId,
      sectionCode: `${sectionCode}_raw`,
    },
  });

  return {
    paperId,
    sectionCode,
    questions,
    passageText: sectionText?.text ?? null,
  };
}

export async function getWritingPrompts(exam: "cet6" | "ielts") {
  const papers = await prisma.paper.findMany({
    where: {
      paperId: { startsWith: `${exam}_` },
      writingPrompt: { not: null },
    },
  });

  return papers
    .filter((p) => p.writingPrompt)
    .map((p) => ({
      id: p.paperId,
      stem: p.writingPrompt ?? "",
    }));
}

export async function getAnswerDetails(
  paperId: string,
  questionNos: number[],
): Promise<Map<number, { answerKey: string | null; explanation: string | null }>> {
  const details = await prisma.answerQuestionDetail.findMany({
    where: {
      paperId,
      questionNo: { in: questionNos },
    },
  });

  const map = new Map<number, { answerKey: string | null; explanation: string | null }>();
  for (const d of details) {
    if (d.questionNo) {
      map.set(d.questionNo, {
        answerKey: d.answerKey ?? null,
        explanation: d.explanationText ?? null,
      });
    }
  }
  return map;
}