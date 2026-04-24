import { notFound } from "next/navigation";

import { StudentShell } from "@/components/shared/student-shell";
import { isExamType } from "@/config/exams";

export default async function ExamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;

  if (!isExamType(exam)) {
    notFound();
  }

  return <StudentShell exam={exam}>{children}</StudentShell>;
}
