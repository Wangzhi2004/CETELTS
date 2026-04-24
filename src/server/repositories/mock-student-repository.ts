import {
  essayPrompts,
  listeningLesson,
  mockDashboardStats,
  mockEssayDraft,
  mockEssayFeedback,
  mockExams,
  mockReport,
  mockTasks,
  mockUser,
  readingPaper,
  readingPassage,
  readingQuestions,
  readingSection,
  vocabItems,
} from "@/mocks/student-data";
import { ExamType } from "@/types/domain";

export const mockStudentRepository = {
  getUser() {
    return mockUser;
  },
  getDashboardStats() {
    return mockDashboardStats;
  },
  listTasks(exam: ExamType) {
    return mockTasks.filter((task) => task.examType === exam);
  },
  getReadingSession() {
    return {
      paper: readingPaper,
      section: readingSection,
      passage: readingPassage,
      questions: readingQuestions,
    };
  },
  getListeningLesson() {
    return listeningLesson;
  },
  listVocabItems() {
    return vocabItems;
  },
  listEssayPrompts() {
    return essayPrompts;
  },
  getEssayDraft() {
    return mockEssayDraft;
  },
  getEssayFeedback() {
    return mockEssayFeedback;
  },
  listMockExams(exam: ExamType) {
    return mockExams.filter((item) => item.paper.examType === exam);
  },
  getReportSnapshot() {
    return mockReport;
  },
};
