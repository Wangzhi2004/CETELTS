"use client";

import { useEffect, useState } from "react";

import { getLatestWritingFeedback } from "@/app/actions/score-center";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockUser } from "@/mocks/student-data";

type WritingFeedbackState = Awaited<ReturnType<typeof getLatestWritingFeedback>>;

export default function WritingSubmissionPage() {
  const [state, setState] = useState<WritingFeedbackState | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const payload = await getLatestWritingFeedback(mockUser.id);
      if (mounted) {
        setState(payload);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!state) {
    return (
      <div className="flex h-[40dvh] items-center justify-center text-sm text-[#6b748a]">
        AI 正在整理本次写作反馈，请稍候…
      </div>
    );
  }

  const { draft, feedback } = state;

  return (
    <div className="space-y-4">
      <PageHeader title="作文结果对比" description="一稿、反馈、参考改写和下一次训练动作放在同一页。" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>原始作文</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm leading-7 text-muted">
            {draft}
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>AI 建议</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            <p>{feedback.summary}</p>
            <p>下一步：{feedback.nextActions[0] ?? "根据反馈重写第二段。"}</p>
            <p>参考改写：{feedback.referenceRewrite ?? "-"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
