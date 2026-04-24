import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <PageHeader title="登录 CETELTS" description="MVP 阶段先提供静态认证入口，后续接入 Auth.js / PostgreSQL。" />
      <Card className="bg-white/90">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-muted">当前已预留邮箱登录和 OAuth 接口位，先进入 mock 用户工作台。</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/cet6/dashboard">以学生身份进入</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/documents">进入后台</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
