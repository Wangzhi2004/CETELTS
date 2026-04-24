import { MistakeLog, MistakePracticePack } from "@/types/domain";
import type { StudyState } from "@/state/study-state";

export function buildMistakePracticePack(
  mistakeLogs: MistakeLog[],
  tag: MistakeLog["systemTag"],
): MistakePracticePack {
  const items = mistakeLogs.filter((item) => item.systemTag === tag);

  return {
    title: `${tag} 专项练习包`,
    items,
  };
}

export function deriveStudyReportInsights(state: StudyState) {
  const tagCounts = Array.from(
    state.mistakeLogs.reduce((map, item) => {
      map.set(item.systemTag, (map.get(item.systemTag) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);

  const weakestTag = tagCounts[0]?.[0] ?? "定位错误";
  const weakestModule =
    weakestTag === "定位错误" || weakestTag === "长难句没读懂" ? "阅读" : "写作";

  return {
    weakestModule,
    weakestTag,
    nextFocus: `未来 7 天优先处理${weakestTag}，并清理 ${state.reviewQueue.length} 条复习队列。`,
  };
}
