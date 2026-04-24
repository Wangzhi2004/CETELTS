import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <div className="space-y-4">
      <PageHeader title="文档详情" description={`当前预览源文档 ${documentId} 的元数据与处理历史。`} />
      <Card className="bg-white/90">
        <CardHeader><CardTitle>文档预览</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted">
          后续在这里接入 PDF 页预览、原文 OCR 结果和题号定位标注。
        </CardContent>
      </Card>
    </div>
  );
}
