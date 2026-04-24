import { PageHeader } from "@/components/shared/page-header";
import { MistakeBook } from "@/features/mistakes/mistake-book";

export default function MistakePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="错题本" description="按能力问题组织，而不是按试卷堆叠。" />
      <MistakeBook />
    </div>
  );
}
