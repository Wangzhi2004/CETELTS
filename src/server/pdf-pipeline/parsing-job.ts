import { ParsingJobDraft, SourceDocumentInput } from "@/types/domain";

export function createParsingJobDraft(
  sourceDocument: SourceDocumentInput,
): ParsingJobDraft {
  return {
    sourceDocumentId: sourceDocument.id,
    stage: "text_extraction",
    status: "queued",
    structuredDraft: {
      paper: {
        examType: sourceDocument.metadata.examType,
        year: sourceDocument.metadata.year,
        month: sourceDocument.metadata.month,
        title: sourceDocument.filename.replace(".pdf", ""),
      },
      sections: [],
    },
  };
}
