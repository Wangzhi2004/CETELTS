import type { ExamType, TeacherMessage } from "@/types/domain";

type TeacherMemoryMap = Record<string, string>;

const memoryMap: TeacherMemoryMap = {};

export async function getTeacherPreviousResponseId(userId: string, exam: string) {
  return memoryMap[`${userId}:${exam}`];
}

export async function saveTeacherPreviousResponseId(
  userId: string,
  exam: string,
  responseId: string,
) {
  memoryMap[`${userId}:${exam}`] = responseId;
}

export function compactTeacherConversation(input: {
  messages: TeacherMessage[];
  maxRecentMessages?: number;
}) {
  const maxRecentMessages = input.maxRecentMessages ?? 6;
  const compactedMessages = input.messages.slice(0, Math.max(0, input.messages.length - maxRecentMessages));
  const recentMessages = input.messages.slice(-maxRecentMessages);

  if (compactedMessages.length === 0) {
    return {
      compactedCount: 0,
      recentMessages,
      summary: undefined,
    };
  }

  const keyDecisions = compactedMessages
    .filter((message) => message.kind !== "idle")
    .map((message) => message.content)
    .slice(-6);

  return {
    compactedCount: compactedMessages.length,
    recentMessages,
    summary: {
      summary: compactedMessages.map((message) => message.content).join(" "),
      keyDecisions,
    },
  };
}

export async function getTeacherConversationSummary(_userId: string, _exam: ExamType) {
  try {
    const { prisma } = await import("@/server/db/prisma");
    const record = await prisma.conversationSummary.findUnique({
      where: {
        userId_examType_windowIndex: {
          userId: _userId,
          examType: _exam,
          windowIndex: 0,
        },
      },
    });

    if (!record) {
      return undefined;
    }

    return {
      summary: record.summary,
      keyDecisions: record.keyDecisions as string[] | undefined,
      compactedCount: record.compactedCount,
      updatedAt: record.updatedAt.toISOString(),
    };
  } catch {
    return undefined;
  }
}

export async function saveTeacherConversationSummary(input: {
  userId: string;
  exam: ExamType;
  summary: string;
  keyDecisions: string[];
  compactedCount: number;
}) {
  try {
    const { prisma } = await import("@/server/db/prisma");
    await prisma.conversationSummary.upsert({
      where: {
        userId_examType_windowIndex: {
          userId: input.userId,
          examType: input.exam,
          windowIndex: 0,
        },
      },
      update: {
        summary: input.summary,
        keyDecisions: input.keyDecisions,
        compactedCount: input.compactedCount,
      },
      create: {
        userId: input.userId,
        examType: input.exam,
        windowIndex: 0,
        summary: input.summary,
        keyDecisions: input.keyDecisions,
        compactedCount: input.compactedCount,
      },
    });
  } catch {}
}
