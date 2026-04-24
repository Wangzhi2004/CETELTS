import { PageHeader } from "@/components/shared/page-header";
import { ParsingBoard } from "@/features/admin-content/parsing-board";

export default function ParsingJobsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="解析任务" description="解析失败可重跑，映射命中不足进入人工校对。" />
      <ParsingBoard />
    </div>
  );
}
