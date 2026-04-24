import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MockResultPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="模考结果" description="结果页聚焦分项失分、时间分配和未来 7 天冲刺建议。" />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["阅读", "68%"],
          ["听力", "61%"],
          ["写作", "14.5 / 20"],
        ].map(([label, value]) => (
          <Card key={label} className="bg-white/90">
            <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
            <CardContent className="text-3xl font-[800]">{value}</CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-white/90">
        <CardHeader><CardTitle>冲刺建议</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted">
          未来 7 天优先：1）清理听力定位错句；2）重做阅读主旨题；3）完成 2 篇结构化写作重写。
        </CardContent>
      </Card>
    </div>
  );
}
