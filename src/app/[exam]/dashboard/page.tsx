import { ScoreCenterView } from "@/features/score-center/score-center-view";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ exam: "cet6" | "ielts" }>;
}) {
  const { exam } = await params;
  return <ScoreCenterView exam={exam} />;
}
