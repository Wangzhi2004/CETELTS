import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { readingPaper } from "@/mocks/student-data";

export default async function ReadingIndexPage({
  params,
}: {
  params: Promise<{ exam: "cet6" | "ielts" }>;
}) {
  const { exam } = await params;

  return (
    <div className="space-y-4">
      <PageHeader
        title="阅读训练"
        description="先做高收益真题，再做系统错因与复习队列。"
        action={
          <Button asChild>
            <Link href={`/${exam}/reading/${readingPaper.id}/section-reading-2019-12-a`}>
              继续最近训练
            </Link>
          </Button>
        }
      />
      <Card className="bg-white/90">
        <CardContent className="p-6 text-sm text-muted">
          已根据最近 7 天错因，把“定位错误”和“主旨误判”相关题目放在最前面。
        </CardContent>
      </Card>
    </div>
  );
}
