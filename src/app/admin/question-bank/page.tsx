import { PageHeader } from "@/components/shared/page-header";
import { QuestionBankBoard } from "@/features/admin-content/question-bank-board";

export default function QuestionBankPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="题库发布" description="人工校对完成后，从草稿发布到正式题库。" />
      <QuestionBankBoard />
    </div>
  );
}
