"use server";

import { prisma } from "@/server/db/prisma";
import { auth } from "@/server/auth";
import { updateUserProfile, changePassword } from "@/app/actions/auth";
import { saveAiProviderSettings } from "@/server/ai/ai-config";

export type UserSettings = {
  name: string;
  email: string;
  preferredExam: "cet6" | "ielts";
  timezone: string;
  dailyMinutes: number;
  targetScore: number;
  examDate: string;
  aiProvider: string;
  aiModel: string;
  aiApiKey: string;
  aiBaseUrl: string;
};

const defaultSettings: Omit<UserSettings, "name" | "email"> = {
  preferredExam: "cet6",
  timezone: "Asia/Shanghai",
  dailyMinutes: 90,
  targetScore: 500,
  examDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  aiProvider: "dashscope",
  aiModel: "glm-5",
  aiApiKey: "",
  aiBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
};

export async function getUserSettings(): Promise<UserSettings> {
  const session = await auth();
  if (!session?.user?.id) {
    return { name: "", email: "", ...defaultSettings };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      preferredExam: true,
      timezone: true,
    },
  });

  if (!user) {
    return { name: "", email: "", ...defaultSettings };
  }

  const goal = await prisma.goal.findFirst({
    where: { userId: session.user.id, examType: user.preferredExam },
  });

  const settingsRows = await prisma.userSetting.findMany({
    where: { userId: session.user.id },
  });

  const settingsMap = new Map(settingsRows.map((s) => [s.key, s.value]));

  const aiConfigs = await prisma.appConfig.findMany({
    where: { key: { in: ["ai_api_key", "ai_base_url", "ai_model", "ai_enabled"] } },
  });
  const aiConfigMap = new Map(aiConfigs.map((c) => [c.key, c.value]));

  return {
    name: user.name,
    email: user.email,
    preferredExam: user.preferredExam,
    timezone: user.timezone,
    dailyMinutes: goal?.dailyMinutes ?? defaultSettings.dailyMinutes,
    targetScore: goal?.targetScore ?? defaultSettings.targetScore,
    examDate: goal?.examDate ? goal.examDate.toISOString().split("T")[0] : defaultSettings.examDate,
    aiProvider: (settingsMap.get("aiProvider") as string) ?? defaultSettings.aiProvider,
    aiModel: aiConfigMap.get("ai_model") ?? (settingsMap.get("aiModel") as string) ?? defaultSettings.aiModel,
    aiApiKey: aiConfigMap.get("ai_api_key") ?? (settingsMap.get("aiApiKey") as string) ?? "",
    aiBaseUrl: aiConfigMap.get("ai_base_url") ?? defaultSettings.aiBaseUrl,
  };
}

export async function saveUserSettings(input: Partial<UserSettings>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "未登录" };
  }

  if (input.name || input.preferredExam || input.timezone) {
    await updateUserProfile({
      name: input.name,
      preferredExam: input.preferredExam,
      timezone: input.timezone,
    });
  }

  if (input.dailyMinutes || input.targetScore || input.examDate) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferredExam: true },
    });

    const existingGoal = await prisma.goal.findFirst({
      where: { userId: session.user.id, examType: user?.preferredExam },
    });

    if (existingGoal) {
      await prisma.goal.update({
        where: { id: existingGoal.id },
        data: {
          ...(input.dailyMinutes != null && { dailyMinutes: input.dailyMinutes }),
          ...(input.targetScore != null && { targetScore: input.targetScore }),
          ...(input.examDate != null && { examDate: new Date(input.examDate) }),
        },
      });
    } else {
      await prisma.goal.create({
        data: {
          userId: session.user.id,
          examType: user?.preferredExam ?? "cet6",
          targetScore: input.targetScore ?? 500,
          examDate: input.examDate ? new Date(input.examDate) : new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          dailyMinutes: input.dailyMinutes ?? 90,
          phase: "intensive",
        },
      });
    }
  }

  const settingKeys = ["aiProvider", "aiModel", "aiApiKey"] as const;
  for (const key of settingKeys) {
    if (input[key] !== undefined) {
      await prisma.userSetting.upsert({
        where: { userId_key: { userId: session.user.id, key } },
        create: { userId: session.user.id, key, value: input[key]! },
        update: { value: input[key]! },
      });
    }
  }

  if (input.aiApiKey || input.aiModel || input.aiBaseUrl) {
    await saveAiProviderSettings({
      apiKey: input.aiApiKey,
      model: input.aiModel,
      baseURL: input.aiBaseUrl,
      enabled: Boolean(input.aiApiKey),
    });
  }

  return { success: true };
}

export { updateUserProfile, changePassword };
