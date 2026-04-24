import { describe, expect, it } from "vitest";

import {
  adminStateReducer,
  createInitialAdminState,
  deriveAdminOverview,
} from "@/state/admin-state";

describe("admin state", () => {
  it("queues a new document upload into parsing flow", () => {
    const initial = createInitialAdminState();

    const next = adminStateReducer(initial, {
      type: "uploadDocument",
      payload: {
        filename: "2021-06-cet6-paper.pdf",
        documentType: "paper_pdf",
        examType: "cet6",
        year: 2021,
        month: 6,
      },
    });

    expect(next.documents[0].filename).toBe("2021-06-cet6-paper.pdf");
    expect(next.documents[0].status).toBe("queued");
    expect(next.jobs[0].stage).toBe("text_extraction");
  });

  it("publishes a reviewed paper into the question bank", () => {
    const initial = createInitialAdminState();

    const reviewed = adminStateReducer(initial, {
      type: "markJobReviewed",
      payload: { jobId: "job-2019-12-analysis" },
    });

    const published = adminStateReducer(reviewed, {
      type: "publishPaper",
      payload: { paperId: "paper-2019-12-set2" },
    });

    expect(
      published.papers.find((paper) => paper.id === "paper-2019-12-set2")?.status,
    ).toBe("published");
  });

  it("derives admin overview counts from document and parsing state", () => {
    const overview = deriveAdminOverview(createInitialAdminState());

    expect(overview.reviewRequiredCount).toBeGreaterThan(0);
    expect(overview.processingCount).toBeGreaterThan(0);
    expect(overview.publishedPaperCount).toBeGreaterThan(0);
  });
});
