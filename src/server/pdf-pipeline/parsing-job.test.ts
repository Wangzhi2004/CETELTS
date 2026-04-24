import { describe, expect, it } from "vitest";

import { createParsingJobDraft } from "@/server/pdf-pipeline/parsing-job";

describe("parsing job draft", () => {
  it("creates a resumable parsing draft for uploaded source documents", () => {
    const draft = createParsingJobDraft({
      id: "doc-cet6-2019-12-reading",
      documentType: "paper_pdf",
      filename: "2019-12-cet6-paper.pdf",
      metadata: {
        examType: "cet6",
        year: 2019,
        month: 12,
      },
    });

    expect(draft.stage).toBe("text_extraction");
    expect(draft.status).toBe("queued");
    expect(draft.structuredDraft.paper.year).toBe(2019);
    expect(draft.structuredDraft.sections).toEqual([]);
  });
});
