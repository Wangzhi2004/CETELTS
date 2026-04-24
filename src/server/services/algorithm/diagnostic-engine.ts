import { prisma } from "@/server/db/prisma";

type DiagnosticPayload = {
  accuracy?: number;
  detectedErrors?: string[];
  selfAssessment?: string;
};

export async function processDiagnostic(eventId: string) {
  // 1. Fetch Event
  const event = await prisma.learningEvent.findUnique({
    where: { eventId },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  const payload = event.payload as DiagnosticPayload | null;
  if (!payload) return null;

  const isFailed = payload.accuracy !== undefined && payload.accuracy < 0.65;
  const primaryError = Array.isArray(payload.detectedErrors) && payload.detectedErrors.length > 0 
    ? payload.detectedErrors[0] 
    : "未知错误";

  // 2. Create Diagnostic Record
  const diagnosticId = `diag-${Math.random().toString(36).slice(2, 9)}`;
  const diagnostic = await prisma.diagnosticRecord.create({
    data: {
      diagnosticId,
      eventId,
      userId: event.userId,
      primaryError,
      secondaryErrors: payload.detectedErrors?.slice(1) || [],
      severity: isFailed ? 0.8 : 0.2,
      confidence: 0.85,
      evidence: payload.selfAssessment ? [payload.selfAssessment] : [],
      repairPlanIds: isFailed ? [`repair-${event.pageType}-${primaryError}`] : [],
    },
  });

  // 3. Update Skill State (Knowledge Tracing BKT / PFA simulation)
  const delta = isFailed ? -0.1 : +0.1;
  const skillNode = primaryError; // simplify: error name maps to skill node

  const skillState = await prisma.skillState.findUnique({
    where: { userId_skillNode: { userId: event.userId, skillNode } },
  });

  if (skillState) {
    await prisma.skillState.update({
      where: { id: skillState.id },
      data: {
        mastery: Math.max(0, Math.min(1, skillState.mastery + delta)),
        recurrence: isFailed ? Math.min(1, skillState.recurrence + 0.2) : Math.max(0, skillState.recurrence - 0.1),
        evidenceCount: skillState.evidenceCount + 1,
        lastSeenAt: new Date(),
      },
    });
  } else {
    await prisma.skillState.create({
      data: {
        userId: event.userId,
        skillNode,
        mastery: isFailed ? 0.3 : 0.7,
        confidence: 0.5,
        recurrence: isFailed ? 0.2 : 0,
        evidenceCount: 1,
        lastSeenAt: new Date(),
      },
    });
  }

  // 4. Update Review Queue
  if (isFailed) {
    await prisma.reviewQueue.upsert({
      where: { userId_entityType_entityId: { userId: event.userId, entityType: "mistake", entityId: diagnosticId } },
      update: { priority: { increment: 10 }, nextReviewAt: new Date() },
      create: {
        userId: event.userId,
        entityType: "mistake",
        entityId: diagnosticId,
        reason: "mistake",
        skillNodes: [skillNode],
        nextReviewAt: new Date(), // Immediate review needed
        priority: 80,
      },
    });
  }

  return diagnostic;
}
