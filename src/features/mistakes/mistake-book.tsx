"use client";

import { useEffect, useMemo, useState } from "react";

import { getMistakeBookData } from "@/app/actions/score-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMistakePracticePack } from "@/domain/review-insights";
import { mockUser } from "@/mocks/student-data";
import { MistakeLog, MistakeTag } from "@/types/domain";

export function MistakeBook() {
  const [mistakeLogs, setMistakeLogs] = useState<MistakeLog[]>([]);
  const tagCounts = Array.from(
    mistakeLogs.reduce((map, item) => {
      map.set(item.systemTag, (map.get(item.systemTag) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  );
  const [selectedTag, setSelectedTag] = useState<MistakeTag | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const logs = await getMistakeBookData(mockUser.id);
      if (mounted) {
        setMistakeLogs(logs);
        setSelectedTag((logs[0]?.systemTag as MistakeTag | undefined) ?? null);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const practicePack = useMemo(
    () => (selectedTag ? buildMistakePracticePack(mistakeLogs, selectedTag) : null),
    [selectedTag, mistakeLogs],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>错因聚类</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tagCounts.map(([tag, count]) => (
            <button
              key={tag}
              className={`w-full rounded-[18px] border p-4 text-left ${
                selectedTag === tag ? "border-primary bg-primary-soft" : "bg-card"
              }`}
              onClick={() => setSelectedTag(tag as MistakeTag)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{tag}</p>
                <Badge>{count} 次</Badge>
              </div>
              <p className="mt-2 text-sm text-muted">
                支持按近 7 天 / 30 天筛选，并一键生成专项练习包。
              </p>
            </button>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>专项练习包</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {practicePack ? (
            <>
              <div className="rounded-[18px] border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{practicePack.title}</p>
                  <Button type="button" variant="secondary">
                    生成练习包
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted">
                  已收录 {practicePack.items.length} 道同类错误，适合 20-30 分钟集中补弱。
                </p>
              </div>
              {practicePack.items.map((mistake) => (
                <div key={mistake.id} className="rounded-[18px] border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{mistake.questionId ?? mistake.id}</p>
                    <Badge variant="warning">{mistake.systemTag}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{mistake.evidence}</p>
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted">当前暂无可生成的专项练习包。</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
