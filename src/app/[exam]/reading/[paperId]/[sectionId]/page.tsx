import { ReadingWorkspace } from "@/features/reading/reading-workspace";

export default async function ReadingSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ exam: "cet6" | "ielts"; paperId: string; sectionId: string }>;
  searchParams: Promise<{ taskId?: string }>;
}) {
  const { exam, paperId, sectionId } = await params;
  const { taskId } = await searchParams;
  return <ReadingWorkspace exam={exam} paperId={paperId} sectionId={sectionId} taskId={taskId} />;
}
