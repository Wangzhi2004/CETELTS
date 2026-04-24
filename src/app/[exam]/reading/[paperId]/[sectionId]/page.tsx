import { ReadingWorkspace } from "@/features/reading/reading-workspace";

export default async function ReadingSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ exam: "cet6" | "ielts"; paperId: string; sectionId: string }>;
  searchParams: Promise<{ taskId?: string }>;
}) {
  const { exam } = await params;
  const { taskId } = await searchParams;
  return <ReadingWorkspace exam={exam} taskId={taskId} />;
}
