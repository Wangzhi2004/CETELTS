import { MockExamWorkspace } from "@/features/mock-exam/mock-exam-workspace";

export default async function MockPage({
  params,
}: {
  params: Promise<{ exam: "cet6" | "ielts" }>;
}) {
  const { exam } = await params;
  return <MockExamWorkspace exam={exam} />;
}
