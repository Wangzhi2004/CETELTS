import { ScoreCenterView } from "@/features/score-center/score-center-view";
import { mockUser } from "@/mocks/student-data";
import { StudyStateProvider } from "@/state/study-state";

export default function Home() {
  return (
    <StudyStateProvider exam={mockUser.preferredExam}>
      <ScoreCenterView exam={mockUser.preferredExam} standalone />
    </StudyStateProvider>
  );
}
