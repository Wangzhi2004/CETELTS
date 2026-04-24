import { ReportOverview } from "@/features/reports/report-overview";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ exam: "cet6" | "ielts" }>;
}) {
  const { exam } = await params;
  return <ReportOverview exam={exam} />;
}
