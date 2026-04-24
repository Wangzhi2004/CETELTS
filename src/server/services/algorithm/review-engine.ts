import { prisma } from "@/server/db/prisma";

export async function processReview(userId: string, entityId: string, entityType: string, result: "mastered" | "again") {
  const queueEntry = await prisma.reviewQueue.findUnique({
    where: { userId_entityType_entityId: { userId, entityType, entityId } },
  });

  if (!queueEntry) {
    return null;
  }

  // Simple SM-2 like interval update
  let intervalDays = result === "mastered" ? 3 : 1;
  if (result === "mastered" && queueEntry.lastSuccessAt) {
    const daysSinceLastSuccess = (Date.now() - queueEntry.lastSuccessAt.getTime()) / (1000 * 60 * 60 * 24);
    intervalDays = Math.max(3, Math.floor(daysSinceLastSuccess * 2.5));
  }

  const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

  const updated = await prisma.reviewQueue.update({
    where: { id: queueEntry.id },
    data: {
      nextReviewAt,
      lastSuccessAt: result === "mastered" ? new Date() : queueEntry.lastSuccessAt,
      priority: result === "mastered" ? Math.max(0, queueEntry.priority - 20) : Math.min(100, queueEntry.priority + 10),
      forgettingRisk: result === "mastered" ? 0.2 : 0.8,
    },
  });

  // Update Skill State if applicable
  if (queueEntry.skillNodes && Array.isArray(queueEntry.skillNodes)) {
    for (const skillNode of queueEntry.skillNodes as string[]) {
      const skillState = await prisma.skillState.findUnique({
        where: { userId_skillNode: { userId, skillNode } },
      });
      if (skillState) {
        await prisma.skillState.update({
          where: { id: skillState.id },
          data: {
            decayRisk: result === "mastered" ? Math.max(0, skillState.decayRisk - 0.2) : Math.min(1, skillState.decayRisk + 0.1),
          },
        });
      }
    }
  }

  return updated;
}
