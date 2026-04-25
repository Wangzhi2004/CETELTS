"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Clock3, Send } from "lucide-react";

import { submitTaskResult } from "@/app/actions/score-center";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockUser } from "@/mocks/student-data";

export default function MockSessionPage() {
  const params = useParams<{ exam: "cet6" | "ielts"; paperId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { exam, paperId } = params;
  const taskId = searchParams.get("taskId");

  function submitMock() {
    startTransition(async () => {
      await submitTaskResult(mockUser.id, exam, {
        taskId: taskId ?? "unknown",
        status: "success",
        accuracy: 0.66,
        timeSpentSec: 60 * 60,
        completionRate: 1,
        confidence: 0.6,
        detectedErrors: ["timing_failure", "evidence_location_failure"],
        selfAssessment: "模考节奏还不够稳定，后程准确率下滑明显",
        subSkillSignals: [],
        reviewQueueDelta: [],
        artifacts: [
          { score: exam === "cet6" ? 482 : 6 }
        ],
      });
      router.push(`/${exam}/mock/${paperId}/result`);
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="模考执行页"
        description="这里负责模考倒计时、分模块完成与统一交卷，交卷后结果会回流提分中心。"
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>当前模考：{paperId}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {["阅读", "听力", "写作"].map((label, index) => (
              <div key={label} className="rounded-[18px] border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{label}</p>
                  <Badge variant={index === 0 ? "default" : "neutral"}>
                    {index === 0 ? "进行中" : "待开始"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted">
                  倒计时、分模块完成与交卷结果将在这里统一展示。
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" />
              总倒计时
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-4xl font-[800] tracking-tight">02:15:00</p>
            <Button className="w-full" onClick={submitMock} type="button">
              {isPending ? "交卷中..." : "交卷并生成结果"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
            <Button asChild className="w-full" variant="secondary">
              <Link href={`/${exam}/dashboard`}>返回提分中心</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
