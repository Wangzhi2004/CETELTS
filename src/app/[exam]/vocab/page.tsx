import { PageHeader } from "@/components/shared/page-header";
import { VocabReviewWorkspace } from "@/features/vocab/vocab-review-workspace";

export default async function VocabPage({
  params,
  searchParams,
}: {
  params: Promise<{ exam: "cet6" | "ielts" }>;
  searchParams: Promise<{ taskId?: string }>;
}) {
  const { exam } = await params;
  const { taskId } = await searchParams;
  return (
    <div className="space-y-4">
      <PageHeader
        title="词汇复习"
        description="不是单词书，而是和真题上下文、错题队列和遗忘风险联动的词汇引擎。"
      />
      <VocabReviewWorkspace exam={exam} taskId={taskId} />
    </div>
  );
}
