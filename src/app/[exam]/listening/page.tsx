import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export default async function ListeningIndexPage({
  params,
}: {
  params: Promise<{ exam: "cet6" | "ielts" }>;
}) {
  const { exam } = await params;
  return (
    <PageHeader
      title="听力训练"
      description="听力页强调错句时间轴、精听动作和漏听词回收。"
      action={
        <Button asChild>
          <Link href={`/${exam}/listening/paper-2020-06-set1/section-listening-2020-06-a`}>
            开始本轮精听
          </Link>
        </Button>
      }
    />
  );
}
