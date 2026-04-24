import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ParsingReviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <div className="space-y-4">
      <PageHeader title="结构化校对" description={`正在校对解析任务 ${jobId} 的题目与解析映射。`} />
      <Card className="bg-white/90">
        <CardHeader><CardTitle>校对视图骨架</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted">
          左侧放 OCR / 原文，右侧放结构化草稿，中间支持题号与解析一对一映射修正。
        </CardContent>
      </Card>
    </div>
  );
}
