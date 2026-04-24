"use client";

import { useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminState } from "@/state/admin-state";

export function DocumentsBoard() {
  const { state, dispatch } = useAdminState();
  const [filename, setFilename] = useState("2021-06-cet6-paper.pdf");

  return (
    <div className="space-y-4">
      <PageHeader
        title="源文档管理"
        description="原始 PDF、答案和解析先进入这里，再流转到解析、人工校对与题库发布。"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="w-[240px]"
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              placeholder="输入上传文件名"
            />
            <Button
              type="button"
              onClick={() =>
                dispatch({
                  type: "uploadDocument",
                  payload: {
                    filename,
                    documentType: "paper_pdf",
                    examType: "cet6",
                    year: 2021,
                    month: 6,
                  },
                })
              }
            >
              上传 PDF
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white/90">
          <CardHeader><CardTitle>总文档数</CardTitle></CardHeader>
          <CardContent className="text-3xl font-[800]">{state.documents.length}</CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardHeader><CardTitle>待校对</CardTitle></CardHeader>
          <CardContent className="text-3xl font-[800]">
            {state.documents.filter((item) => item.status === "review_required").length}
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardHeader><CardTitle>已发布</CardTitle></CardHeader>
          <CardContent className="text-3xl font-[800]">
            {state.documents.filter((item) => item.status === "published").length}
          </CardContent>
        </Card>
      </div>
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>文档列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.documents.map((document) => (
            <div key={document.id} className="rounded-[18px] border p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{document.filename}</p>
                <p className="text-muted">{document.status}</p>
              </div>
              <p className="mt-2 text-muted">
                类型：{document.documentType} · 考试：{document.examType} · 更新时间：{document.updatedAt}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
