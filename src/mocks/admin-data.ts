import { ParsingJobRecord, SourceDocumentRecord } from "@/types/domain";

export const sourceDocuments: SourceDocumentRecord[] = [
  {
    id: "doc-2019-12-paper",
    filename: "2019-12-cet6-paper.pdf",
    documentType: "paper_pdf",
    status: "published",
    uploadedBy: "Alex",
    updatedAt: "2026-04-20 10:20",
    examType: "cet6",
    year: 2019,
    month: 12,
  },
  {
    id: "doc-2019-12-analysis",
    filename: "2019-12-cet6-analysis.pdf",
    documentType: "analysis_pdf",
    status: "review_required",
    uploadedBy: "Alex",
    updatedAt: "2026-04-21 14:10",
    examType: "cet6",
    year: 2019,
    month: 12,
  },
];

export const parsingJobs: ParsingJobRecord[] = [
  {
    id: "job-2019-12-analysis",
    sourceDocumentId: "doc-2019-12-analysis",
    stage: "mapping",
    status: "review_required",
    progress: 78,
    note: "第 2 篇阅读解析映射命中率偏低，需要人工校对。",
  },
  {
    id: "job-2020-06-listening",
    sourceDocumentId: "doc-2020-06-listening",
    stage: "text_extraction",
    status: "processing",
    progress: 24,
    note: "OCR 处理中，等待下一轮重试。",
  },
];
