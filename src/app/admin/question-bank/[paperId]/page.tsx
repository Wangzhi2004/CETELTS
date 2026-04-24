import { PageHeader } from "@/components/shared/page-header";
import { QuestionBankBoard } from "@/features/admin-content/question-bank-board";

export default async function QuestionBankDetailPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;
  return (
    <div className="space-y-4">
      <PageHeader title="试卷详情" description={`正在查看 ${paperId} 的题库详情与发布状态。`} />
      <QuestionBankBoard />
    </div>
  );
}
