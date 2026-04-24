"use client";

import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { getReportOverviewData } from "@/app/actions/score-center";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockUser } from "@/mocks/student-data";
import { MistakeLog } from "@/types/domain";

export function ReportOverview({ exam }: { exam: "cet6" | "ielts" }) {
  const [data, setData] = useState<{
    reportSnapshot: {
      weekHours: number;
      readingAccuracyTrend: number[];
      listeningAccuracyTrend: number[];
      vocabMasteryTrend: number[];
      writingScoreTrend: number[];
    };
    completedTasks: number;
    reviewQueueCount: number;
    mistakeLogs: MistakeLog[];
    completedReadingAccuracy?: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const result = await getReportOverviewData(mockUser.id, exam);
      if (mounted) {
        setData(result);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [exam]);

  const weakestTag = useMemo(() => {
    if (!data) return "定位错误";
    const counts = Array.from(
      data.mistakeLogs.reduce((map, item) => {
        map.set(item.systemTag, (map.get(item.systemTag) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    ).sort((a, b) => b[1] - a[1]);
    return counts[0]?.[0] ?? "定位错误";
  }, [data]);

  if (!data) {
    return (
      <div className="flex h-[40dvh] items-center justify-center text-sm text-[#6b748a]">
        正在整理你的学习报告，请稍候…
      </div>
    );
  }

  const chartData = data.reportSnapshot.readingAccuracyTrend.map((item, index) => ({
    week: `W${index + 1}`,
    reading:
      (index === data.reportSnapshot.readingAccuracyTrend.length - 1 && data.completedReadingAccuracy
        ? data.completedReadingAccuracy
        : item) * 100,
    listening: data.reportSnapshot.listeningAccuracyTrend[index] * 100,
    vocab: data.reportSnapshot.vocabMasteryTrend[index] * 100,
    writing: data.reportSnapshot.writingScoreTrend[index] * 5,
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="学习报告"
        description="报告不只展示时长，而是判断哪里正在上升、哪里继续拖后腿。"
      />
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>近 5 周能力变化</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="week" tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="reading" stroke="#7C5CFA" strokeWidth={3} />
              <Line type="monotone" dataKey="listening" stroke="#16B364" strokeWidth={3} />
              <Line type="monotone" dataKey="vocab" stroke="#F59E0B" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>本周判断</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>有效学习时长：{data.reportSnapshot.weekHours} 小时</p>
            <p>完成任务数：{data.completedTasks}</p>
            <p>最高频错因：{weakestTag}</p>
            <p>待清理复习项：{data.reviewQueueCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>下周建议</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            未来 7 天优先处理 {weakestTag}，同时减少低收益任务，把预算集中给高权重模块。
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
