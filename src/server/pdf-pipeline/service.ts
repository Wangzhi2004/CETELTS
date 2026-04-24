import { createParsingJobDraft } from "@/server/pdf-pipeline/parsing-job";
import { SourceDocumentInput } from "@/types/domain";

export const pdfPipelineService = {
  async queueDocument(sourceDocument: SourceDocumentInput) {
    return createParsingJobDraft(sourceDocument);
  },
};
