import { ExamType } from "@/types/domain";

export const examConfigs: Record<
  ExamType,
  {
    label: string;
    shortLabel: string;
    accent: string;
    targetCopy: string;
  }
> = {
  cet6: {
    label: "CET-6 大学英语六级",
    shortLabel: "六级",
    accent: "from-violet-600 to-indigo-500",
    targetCopy: "真题驱动 · 精准提分",
  },
  ielts: {
    label: "IELTS 雅思学术类",
    shortLabel: "雅思",
    accent: "from-fuchsia-500 to-violet-500",
    targetCopy: "模块化冲刺 · 高效出分",
  },
};

export function isExamType(value: string): value is ExamType {
  return value === "cet6" || value === "ielts";
}
