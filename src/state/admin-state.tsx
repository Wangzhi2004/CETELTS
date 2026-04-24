"use client";

import { createContext, useContext, useMemo, useReducer } from "react";

import { parsingJobs, sourceDocuments } from "@/mocks/admin-data";
import { readingPaper } from "@/mocks/student-data";
import { ParsingJobRecord, SourceDocumentRecord, ExamPaper, ExamType } from "@/types/domain";

export interface AdminState {
  documents: SourceDocumentRecord[];
  jobs: ParsingJobRecord[];
  papers: ExamPaper[];
}

type AdminAction =
  | {
      type: "uploadDocument";
      payload: {
        filename: string;
        documentType: SourceDocumentRecord["documentType"];
        examType: ExamType;
        year: number;
        month: number;
      };
    }
  | { type: "markJobReviewed"; payload: { jobId: string } }
  | { type: "publishPaper"; payload: { paperId: string } };

export function createInitialAdminState(): AdminState {
  return {
    documents: sourceDocuments,
    jobs: parsingJobs,
    papers: [readingPaper],
  };
}

export function adminStateReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case "uploadDocument": {
      const documentId = `doc-${Date.now()}`;
      const jobId = `job-${Date.now()}`;
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");

      const document: SourceDocumentRecord = {
        id: documentId,
        filename: action.payload.filename,
        documentType: action.payload.documentType,
        status: "queued",
        uploadedBy: "Alex",
        updatedAt: now,
        examType: action.payload.examType,
        year: action.payload.year,
        month: action.payload.month,
      };

      const job: ParsingJobRecord = {
        id: jobId,
        sourceDocumentId: documentId,
        stage: "text_extraction",
        status: "queued",
        progress: 0,
        note: "已进入解析队列，等待文本提取。",
      };

      return {
        ...state,
        documents: [document, ...state.documents],
        jobs: [job, ...state.jobs],
      };
    }
    case "markJobReviewed":
      return {
        ...state,
        jobs: state.jobs.map((job) =>
          job.id === action.payload.jobId
            ? { ...job, status: "completed", stage: "review", progress: 100, note: "人工校对完成。" }
            : job,
        ),
        documents: state.documents.map((document) => {
          const target = state.jobs.find((job) => job.id === action.payload.jobId);
          return document.id === target?.sourceDocumentId
            ? { ...document, status: "review_required" }
            : document;
        }),
      };
    case "publishPaper":
      return {
        ...state,
        papers: state.papers.map((paper) =>
          paper.id === action.payload.paperId ? { ...paper, status: "published" } : paper,
        ),
      };
    default:
      return state;
  }
}

export function deriveAdminOverview(state: AdminState) {
  return {
    reviewRequiredCount: state.jobs.filter((job) => job.status === "review_required").length,
    processingCount: state.jobs.filter((job) => job.status === "processing" || job.status === "queued").length,
    publishedPaperCount: state.papers.filter((paper) => paper.status === "published").length,
  };
}

const AdminStateContext = createContext<{
  state: AdminState;
  dispatch: React.Dispatch<AdminAction>;
} | null>(null);

export function AdminStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(adminStateReducer, undefined, createInitialAdminState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AdminStateContext.Provider value={value}>{children}</AdminStateContext.Provider>;
}

export function useAdminState() {
  const context = useContext(AdminStateContext);
  if (!context) {
    throw new Error("useAdminState must be used within AdminStateProvider");
  }
  return context;
}
