import { ListeningWorkspace } from "@/features/listening/listening-workspace";

export default async function ListeningSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ exam: "cet6" | "ielts"; paperId: string; sectionId: string }>;
  searchParams: Promise<{ taskId?: string }>;
}) {
  const { exam } = await params;
  const { taskId } = await searchParams;
  return <ListeningWorkspace exam={exam} taskId={taskId} />;
}
