import { evaluateReadingAttempt } from "@/domain/study-engine";
import { mockStudentRepository } from "@/server/repositories/mock-student-repository";
import {
  EssayFeedback,
  Goal,
  ExamType,
  ReviewQueueEntry,
  VocabItem,
} from "@/types/domain";

export function getStudentAppBootstrap(exam: ExamType) {
  return {
    user: mockStudentRepository.getUser(),
    dashboardStats: mockStudentRepository.getDashboardStats(),
    tasks: mockStudentRepository.listTasks(exam),
    readingSession: mockStudentRepository.getReadingSession(),
    listeningLesson: mockStudentRepository.getListeningLesson(),
    vocabItems: mockStudentRepository.listVocabItems(),
    essayPrompts: mockStudentRepository.listEssayPrompts(),
    essayDraft: mockStudentRepository.getEssayDraft(),
    mockExams: mockStudentRepository.listMockExams(exam),
    reportSnapshot: mockStudentRepository.getReportSnapshot(),
  };
}

export function createSeedReviewQueue(exam: ExamType): ReviewQueueEntry[] {
  return mockStudentRepository
    .listVocabItems()
    .filter((item) => item.sourceExamTypes.includes(exam))
    .slice(0, 2)
    .map((item, index) => ({
      entityType: "vocab" as const,
      entityId: item.id,
      reason: "vocab" as const,
      priority: 60 - index * 5,
      nextReviewAt: new Date(Date.now() + 1000 * 60 * 60 * (index + 1)).toISOString(),
      intervalDays: 1,
    }));
}

export function createMockGoal(exam: ExamType): Goal {
  return {
    id: `goal-${exam}`,
    userId: "user-alex",
    examType: exam,
    targetScore: exam === "cet6" ? 600 : 7,
    examDate: exam === "cet6" ? "2026-06-13" : "2026-07-11",
    dailyMinutes: exam === "cet6" ? 90 : 100,
    phase: exam === "cet6" ? "intensive" : "recovery",
  };
}

export function createSeedMistakeState() {
  const reading = mockStudentRepository.getReadingSession();
  return evaluateReadingAttempt({
    sectionId: reading.section.id,
    sourceWeight: 1.1,
    responses: [
      {
        questionId: reading.questions[0].id,
        answer: "B",
        correctAnswer: reading.questions[0].correctAnswer,
        selfTag: "词汇不认识",
        elapsedSec: 44,
      },
      {
        questionId: reading.questions[1].id,
        answer: "B",
        correctAnswer: reading.questions[1].correctAnswer,
        selfTag: "定位错误",
        elapsedSec: 52,
      },
    ],
  });
}

export async function requestMockEssayFeedback(): Promise<EssayFeedback> {
  return mockStudentRepository.getEssayFeedback();
}

export function updateVocabMastery(
  items: VocabItem[],
  itemId: string,
  result: "mastered" | "again",
) {
  return items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }

    const delta = result === "mastered" ? 0.12 : -0.08;
    return {
      ...item,
      mastery: Math.max(0, Math.min(1, Number((item.mastery + delta).toFixed(2)))),
      dueLabel: result === "mastered" ? "已延后复习" : "再次加入队列",
    };
  });
}
