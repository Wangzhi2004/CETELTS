import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatePanel } from "@/components/shared/state-panel";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
      <StatePanel title="页面不存在" description="目标资源未找到，可能是考试维度或试卷路径无效。">
        <Button asChild>
          <Link href="/cet6/dashboard">回到工作台</Link>
        </Button>
      </StatePanel>
    </div>
  );
}
