import { OnboardingForm } from "@/components/shared/onboarding-form";
import { PageHeader } from "@/components/shared/page-header";

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <PageHeader
        eyebrow="Step 1"
        title="先定义目标，再生成任务"
        description="CETELTS 不把用户扔进题海。先锁定考试、时间和阶段，再给出今日任务与复习比例。"
      />
      <OnboardingForm />
    </div>
  );
}
