"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { deriveAdminOverview, useAdminState } from "@/state/admin-state";

export function ParsingBoard() {
  const { state, dispatch } = useAdminState();
  const overview = deriveAdminOverview(state);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white/90">
          <CardHeader><CardTitle>待校对任务</CardTitle></CardHeader>
          <CardContent className="text-3xl font-[800]">{overview.reviewRequiredCount}</CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardHeader><CardTitle>处理中</CardTitle></CardHeader>
          <CardContent className="text-3xl font-[800]">{overview.processingCount}</CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardHeader><CardTitle>已发布试卷</CardTitle></CardHeader>
          <CardContent className="text-3xl font-[800]">{overview.publishedPaperCount}</CardContent>
        </Card>
      </div>
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>解析任务队列</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.jobs.map((job) => (
            <div key={job.id} className="rounded-[18px] border p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{job.id}</p>
                <p className="text-muted">{job.status}</p>
              </div>
              <p className="mt-2 text-muted">
                阶段：{job.stage} · 进度：{job.progress}%
              </p>
              <div className="mt-3">
                <Progress value={job.progress} />
              </div>
              <p className="mt-2 text-muted">{job.note}</p>
              {job.status === "review_required" ? (
                <Button
                  className="mt-3"
                  variant="secondary"
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "markJobReviewed",
                      payload: { jobId: job.id },
                    })
                  }
                >
                  标记为已校对
                </Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
