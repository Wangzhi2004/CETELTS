"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { goalSchema, type GoalInput } from "@/schemas/goal";

export function OnboardingForm() {
  const [submitted, setSubmitted] = useState<GoalInput | null>(null);
  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      examType: "cet6",
      targetScore: 600,
      examDate: "2026-10-15",
      dailyMinutes: 150,
      phase: "recovery",
    },
  });

  return (
    <Card className="bg-white/90">
      <CardHeader>
        <CardTitle>目标设置</CardTitle>
        <CardDescription>先锁定考试目标和日投入时长，系统才会生成合理任务。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit((values) => setSubmitted(values))}
        >
          <label className="space-y-2 text-sm font-medium">
            考试类型
            <select
              className="h-11 w-full rounded-[12px] border bg-card px-3"
              {...form.register("examType")}
            >
              <option value="cet6">CET-6</option>
              <option value="ielts">IELTS</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            目标分数
            <Input type="number" {...form.register("targetScore", { valueAsNumber: true })} />
          </label>
          <label className="space-y-2 text-sm font-medium">
            考试日期
            <Input type="date" {...form.register("examDate")} />
          </label>
          <label className="space-y-2 text-sm font-medium">
            每日可用时长（分钟）
            <Input type="number" {...form.register("dailyMinutes", { valueAsNumber: true })} />
          </label>
          <label className="space-y-2 text-sm font-medium md:col-span-2">
            当前阶段
            <select
              className="h-11 w-full rounded-[12px] border bg-card px-3"
              {...form.register("phase")}
            >
              <option value="recovery">恢复期</option>
              <option value="intensive">强化期</option>
              <option value="sprint">冲刺期</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <Button type="submit">生成首周任务框架</Button>
          </div>
        </form>
        {submitted ? (
          <Textarea
            readOnly
            value={`已保存目标：${submitted.examType} / ${submitted.targetScore} 分 / 每日 ${submitted.dailyMinutes} 分钟 / 阶段 ${submitted.phase}`}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
