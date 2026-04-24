import { WritingWorkspace } from "@/features/writing/writing-workspace";

export default async function WritingPage({
  params,
  searchParams,
}: {
  params: Promise<{ exam: "cet6" | "ielts" }>;
  searchParams: Promise<{ taskId?: string }>;
}) {
  const { exam } = await params;
  const { taskId } = await searchParams;
  return <WritingWorkspace exam={exam} taskId={taskId} />;
}
