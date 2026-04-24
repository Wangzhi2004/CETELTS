"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readingQuestions } from "@/mocks/student-data";
import { useAdminState } from "@/state/admin-state";

export function QuestionBankBoard() {
  const { state, dispatch } = useAdminState();
  const paper = state.papers[0];

  return (
    <Card className="bg-white/90">
      <CardHeader>
        <CardTitle>正式题库预览</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-[18px] border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{paper.title}</p>
            <p className="text-muted">状态：{paper.status}</p>
          </div>
          <Button
            className="mt-3"
            type="button"
            onClick={() =>
              dispatch({
                type: "publishPaper",
                payload: { paperId: paper.id },
              })
            }
          >
            发布到正式题库
          </Button>
        </div>
        {readingQuestions.map((question) => (
          <div key={question.id} className="rounded-[18px] border p-4">
            <p className="font-medium">
              {question.number}. {question.stem}
            </p>
            <p className="mt-2 text-muted">正确答案：{question.correctAnswer}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
