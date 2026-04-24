import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DailyTask } from "@/types/domain";
import { cn } from "@/lib/utils";

const taskAccent: Record<DailyTask["taskType"], string> = {
  reading: "from-[#8b63ff] to-[#7b56f4]",
  listening: "from-[#5f97ff] to-[#4b83ed]",
  vocab: "from-[#49c78c] to-[#40b980]",
  writing: "from-[#ffa055] to-[#ff8d3f]",
  mock: "from-[#8b63ff] to-[#7b56f4]",
  review: "from-[#8b63ff] to-[#7b56f4]",
};

const taskIcon: Record<DailyTask["taskType"], string> = {
  reading: "📖",
  listening: "🎧",
  vocab: "📗",
  writing: "✏️",
  mock: "📝",
  review: "🔁",
};

export function TaskCard({
  task,
  href,
  index,
}: {
  task: DailyTask;
  href: string;
  index?: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-[#f1edf8] bg-white px-4 py-4">
      <div className="hidden h-6 w-6 items-center justify-center rounded-full bg-[#8b63ff] text-xs font-semibold text-white sm:inline-flex">
        {index ? index + 1 : ""}
      </div>
      <div
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br text-lg text-white shadow-[0_10px_18px_rgba(124,92,250,0.16)]",
          taskAccent[task.taskType],
        )}
      >
        <span aria-hidden>{taskIcon[task.taskType]}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[17px] font-semibold leading-6 text-[#20232d]">{task.title}</h3>
        <p className="mt-1 truncate text-sm text-[#7b859b]">{task.subtitle}</p>
      </div>
      <div className="hidden text-sm text-[#7b859b] sm:block">{task.estimatedMinutes} 分钟</div>
      <Button
        asChild
        className="h-10 rounded-[12px] bg-[#8b63ff] px-4 text-sm font-semibold shadow-none hover:bg-[#7b56f4]"
      >
        <Link href={href}>开始学习</Link>
      </Button>
    </div>
  );
}
