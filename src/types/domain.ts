export type ExamType = "cet6" | "ielts";
export type LearningPhase = "recovery" | "intensive" | "sprint";
export type ScoreCenterMode =
  | "recovery"
  | "strengthen"
  | "sprint"
  | "light"
  | "foundation_rebuild";
export type TaskType =
  | "reading"
  | "listening"
  | "vocab"
  | "writing"
  | "mock"
  | "review";
export type TaskStatus = "todo" | "in_progress" | "done" | "skipped";
export type ScoreCenterPageStatus =
  | "initializing"
  | "ready"
  | "executing"
  | "replanning"
  | "replanned"
  | "completed"
  | "error";
export type ScoreCardType =
  | "review"
  | "score_boost"
  | "repair"
  | "pitfall"
  | "verification"
  | "recovery"
  | "sprint"
  | "foundation"
  | "bridge"
  | "mock_anchor";
export type ScoreCardStatus =
  | "generated"
  | "surfaced"
  | "acknowledged"
  | "started"
  | "in_progress"
  | "completed"
  | "failed"
  | "skipped"
  | "postponed"
  | "expired"
  | "replaced"
  | "merged"
  | "cancelled";
export type ModuleType =
  | "dashboard"
  | "reading"
  | "listening"
  | "vocab"
  | "writing"
  | "mock"
  | "mistake"
  | "report";
export type MistakeTag =
  | "词汇不认识"
  | "长难句没读懂"
  | "定位错误"
  | "主旨误判"
  | "干扰项误选"
  | "时间压力"
  | "粗心";
export type ReviewReason = "mistake" | "vocab" | "mock" | "rewrite";
export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "matching"
  | "blank_filling";
export type ParsingStage =
  | "text_extraction"
  | "structuring"
  | "mapping"
  | "review"
  | "published";
export type ParsingStatus =
  | "queued"
  | "processing"
  | "review_required"
  | "failed"
  | "completed";

export interface User {
  id: string;
  name: string;
  role: "student" | "admin";
  timezone: string;
  preferredExam: ExamType;
  avatarUrl?: string;
}

export interface Goal {
  id: string;
  userId: string;
  examType: ExamType;
  targetScore: number;
  examDate: string;
  dailyMinutes: number;
  phase: LearningPhase;
}

export interface ScoreCenterCard {
  cardId: string;
  taskId?: string;
  cardType: ScoreCardType;
  title: string;
  whyThisNow: string;
  estimatedTime: number;
  difficulty: "low" | "medium" | "high";
  expectedImpact: string;
  targetSkills: string[];
  prerequisite: string[];
  actionLabel: string;
  destinationPage: string;
  successSignal: string;
  fallbackAction: string;
  expiry: string;
  confidence: number;
  utilityScore?: number;
  weightBreakdown?: {
    summary: string;
    terms: Array<{
      key: string;
      label: string;
      direction: "positive" | "negative";
      weight: number;
      value: number;
      contribution: number;
    }>;
  };
  relation?: {
    kind: "sequence" | "conditional" | "alternative";
    dependsOn?: string[];
    alternativeTo?: string;
    condition?: string;
    nextIfSuccess?: string;
    nextIfFail?: string;
    alternative?: string[];
    blocks?: string[];
    expiresAt?: string;
    anchorTo?: string;
  };
  expectedOutcome?: string;
  alternative?: string;
  anchorTo?: string;
  evidenceRefs?: string[];
  originEngine: string;
  status: ScoreCardStatus;
  sequence: number;
  isNew?: boolean;
}

export interface TeacherMessage {
  id: string;
  role: "teacher" | "user";
  kind:
    | "briefing"
    | "explaining"
    | "negotiating"
    | "diagnosing"
    | "replanning"
    | "closing"
    | "idle";
  content: string;
  createdAt: string;
}

export interface ScoreCenterPanel {
  targetExam: ExamType;
  targetScore: number;
  estimatedScore: number;
  daysToExam: number;
  scoreTrend: number[];
  topMistakes: string[];
  weakestSkills: string[];
  remainingBudgetMinutes: number;
  mode: ScoreCenterMode;
  expectedGain: string;
  nextMockWindow: string;
}

export interface ScoreCenterBudget {
  totalMinutes: number;
  remainingMinutes: number;
}

export interface ScoreCenterState {
  pageStatus: ScoreCenterPageStatus;
  conversationState:
    | "briefing"
    | "explaining"
    | "negotiating"
    | "diagnosing"
    | "replanning"
    | "closing"
    | "idle";
  mode: ScoreCenterMode;
  budget: ScoreCenterBudget;
  cards: ScoreCenterCard[];
  teacherMessages: TeacherMessage[];
  decisionSummary: string[];
  panel: ScoreCenterPanel;
  constraints: {
    preferredFocus?: TaskType;
    energy: "normal" | "low";
  };
  lastUpdatedAt: string;
}

export interface DailyTask {
  id: string;
  title: string;
  subtitle: string;
  examType: ExamType;
  taskType: TaskType;
  status: TaskStatus;
  estimatedMinutes: number;
  scheduledAt: string;
  priority: number;
  sourceEntityType: string;
  sourceEntityId: string;
}

export interface ExamPaper {
  id: string;
  examType: ExamType;
  year: number;
  month: number;
  session: string;
  title: string;
  status: "draft" | "published";
  sourceDocumentId: string;
}

export interface Section {
  id: string;
  paperId: string;
  title: string;
  sectionType: "reading" | "listening" | "writing" | "translation";
  order: number;
  instructions: string;
  audioAssetId?: string;
}

export interface Passage {
  id: string;
  sectionId: string;
  title: string;
  order: number;
  content: string;
  transcript?: string;
  timeRange?: [number, number];
  outline?: string[];
}

export interface Choice {
  id: string;
  questionId: string;
  label: string;
  content: string;
  order: number;
}

export interface Explanation {
  id: string;
  questionId: string;
  source: "original" | "ai_enhanced";
  content: string;
  evidenceSpans: string[];
  mistakeTemplateIds: MistakeTag[];
}

export interface Question {
  id: string;
  sectionId: string;
  passageId?: string;
  number: number;
  questionType: QuestionType;
  stem: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  choices: Choice[];
  correctAnswer: string;
  explanation: Explanation;
}

export interface AttemptResponse {
  questionId: string;
  answer: string;
  correctAnswer: string;
  selfTag?: MistakeTag;
  elapsedSec: number;
}

export interface ReviewQueueEntry {
  entityType: "question" | "vocab" | "essay";
  entityId: string;
  reason: ReviewReason;
  priority: number;
  nextReviewAt: string;
  intervalDays: number;
  systemTag?: MistakeTag;
}

export interface MistakeLog {
  id: string;
  userId: string;
  moduleType: ModuleType;
  questionId?: string;
  submissionId?: string;
  selfTag?: MistakeTag;
  systemTag: MistakeTag;
  evidence: string;
  resolved: boolean;
}

export interface ReadingAttemptSummary {
  sectionId: string;
  accuracy: number;
  mistakeLogs: MistakeLog[];
  reviewQueue: ReviewQueueEntry[];
}

export interface ListeningSegment {
  id: string;
  startSec: number;
  endSec: number;
  transcript: string;
  keywords: string[];
  prompt: string;
}

export interface ListeningLesson {
  paper: ExamPaper;
  section: Section;
  segments: ListeningSegment[];
  questions: Question[];
}

export interface VocabItem {
  id: string;
  lemma: string;
  phonetic: string;
  partOfSpeech: string;
  definitions: string[];
  collocations: string[];
  sourceExamTypes: ExamType[];
  sourceQuestionIds: string[];
  example: string;
  mastery: number;
  dueLabel: string;
}

export interface EssayDimensionScore {
  key: "task_response" | "coherence" | "lexical_resource" | "grammar";
  label: string;
  score: number;
}

export interface EssayFeedback {
  overallScore: number;
  summary: string;
  dimensions: EssayDimensionScore[];
  mistakes: Array<{
    title: string;
    evidence: string;
    suggestion: string;
  }>;
  suggestions: string[];
  nextActions: string[];
  confidence: number;
  referenceRewrite?: string;
}

export interface EssayPrompt {
  id: string;
  mode: "cet6" | "ielts-task1" | "ielts-task2";
  title: string;
  prompt: string;
  outline: string[];
}

export interface MockExamSummary {
  paper: ExamPaper;
  sections: Array<{
    id: string;
    label: string;
    durationMin: number;
    status: "locked" | "ready" | "completed";
  }>;
  lastScore?: number;
}

export interface StudyReportSnapshot {
  weekHours: number;
  completedTasks: number;
  readingAccuracyTrend: number[];
  listeningAccuracyTrend: number[];
  vocabMasteryTrend: number[];
  writingScoreTrend: number[];
  weakestModule: string;
  nextFocus: string;
}

export interface SourceDocumentInput {
  id: string;
  documentType: "paper_pdf" | "analysis_pdf" | "audio_script_pdf" | "answer_pdf";
  filename: string;
  metadata: {
    examType: ExamType;
    year: number;
    month: number;
  };
}

export interface ParsingJobDraft {
  sourceDocumentId: string;
  stage: ParsingStage;
  status: ParsingStatus;
  structuredDraft: {
    paper: {
      examType: ExamType;
      year: number;
      month: number;
      title: string;
    };
    sections: Array<{ id: string; title: string }>;
  };
}

export interface SourceDocumentRecord {
  id: string;
  filename: string;
  documentType: SourceDocumentInput["documentType"];
  status: "queued" | "processing" | "review_required" | "published";
  uploadedBy: string;
  updatedAt: string;
  examType: ExamType;
  year: number;
  month: number;
}

export interface ParsingJobRecord {
  id: string;
  sourceDocumentId: string;
  stage: ParsingStage;
  status: ParsingStatus;
  progress: number;
  note: string;
}

export interface MistakePracticePack {
  title: string;
  items: MistakeLog[];
}

export type StandardErrorType =
  | "vocabulary_gap"
  | "syntax_parse_failure"
  | "evidence_location_failure"
  | "option_discrimination_failure"
  | "topic_misread"
  | "detail_misread"
  | "inference_failure"
  | "listening_keyword_miss"
  | "listening_structure_loss"
  | "writing_task_response_weak"
  | "writing_cohesion_weak"
  | "writing_grammar_risk"
  | "timing_failure"
  | "confidence_miscalibration";

export interface ExecutionContext {
  taskId: string;
  userId: string;
  moduleType: ModuleType;
  skillTargets: string[];
  sourceRef: string;
  difficultyTarget: string;
  timeBudgetSec: number;
  mode: ScoreCenterMode;
  expectedSignals: string[];
  prerequisiteState?: unknown;
}

export interface ExecutionResult {
  taskId: string;
  status: "success" | "partial" | "failed";
  accuracy: number;
  timeSpentSec: number;
  completionRate: number;
  confidence: number;
  selfAssessment?: string;
  detectedErrors: StandardErrorType[];
  subSkillSignals: Array<{ skill: string; value: number }>;
  reviewQueueDelta: ReviewQueueEntry[];
  artifacts: unknown[];
  rawTelemetry?: unknown;
}
