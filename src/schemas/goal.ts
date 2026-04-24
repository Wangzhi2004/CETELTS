import { z } from "zod";

export const goalSchema = z.object({
  examType: z.enum(["cet6", "ielts"]),
  targetScore: z.number().min(1),
  examDate: z.string().min(1),
  dailyMinutes: z.number().min(30),
  phase: z.enum(["recovery", "intensive", "sprint"]),
});

export type GoalInput = z.infer<typeof goalSchema>;
