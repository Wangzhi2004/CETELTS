import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <PageHeader title="创建账户" description="当前先聚焦产品工作流，注册流程后续接入真实认证。" />
      <Card className="bg-white/90">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-muted">建议下一步：完成目标设置，再根据考试类型进入默认工作台。</p>
          <Button asChild>
            <Link href="/onboarding">去设置目标</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
