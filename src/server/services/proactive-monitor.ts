import { prisma } from "@/server/db/prisma";
import { sendWechatMessage } from "@/server/bots/wechat-bot";
import { calculateDecayRisk, type BktPriors } from "@/server/algorithms/ebbinghaus";

export async function runProactiveMonitor() {
  console.log("[Proactive Agent] Fetching skill states for evaluation...");

  try {
    // 1. Fetch active skills and their associated user in one query
    const activeSkills = await prisma.skillState.findMany({
      where: { lastSeenAt: { not: null } },
      select: {
        id: true,
        userId: true,
        skillNode: true,
        lastSeenAt: true,
        mastery: true,
        pInit: true,
        pLearn: true,
        evidenceCount: true,
        decayRisk: true,
      }
    });

    const userIds = [...new Set(activeSkills.map(s => s.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, wechatId: true, preferredExam: true }
    });
    
    const userMap = new Map(users.map(u => [u.id, u]));

    const now = new Date().getTime();
    const skillsToUpdate: { id: string; decayRisk: number }[] = [];
    const interventionsToCreate: { userId: string; skillNode: string; decayRisk: number; exam: string }[] = [];
    const notificationsToSend: { wechatId: string; message: string }[] = [];

    // 2. Pure Algorithm calculation loop
    for (const skill of activeSkills) {
      if (!skill.lastSeenAt) continue;
      
      const daysElapsed = (now - skill.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24);
      const priors: BktPriors = {
        pInit: skill.pInit,
        pLearn: skill.pLearn,
        mastery: skill.mastery,
        evidenceCount: skill.evidenceCount,
      };

      const calculatedDecayRisk = calculateDecayRisk(daysElapsed, priors);

      // Queue for physical DB update if changed significantly
      if (Math.abs(calculatedDecayRisk - skill.decayRisk) > 0.05) {
        skillsToUpdate.push({ id: skill.id, decayRisk: calculatedDecayRisk });
      }

      // 3. Identify High-Risk Interventions
      if (calculatedDecayRisk > 0.8 && skill.mastery > 0.3) {
        const user = userMap.get(skill.userId);
        if (!user || !user.wechatId) continue; // Only intervene if reachable via WeChat

        interventionsToCreate.push({
          userId: skill.userId,
          skillNode: skill.skillNode,
          decayRisk: calculatedDecayRisk,
          exam: user.preferredExam
        });

        notificationsToSend.push({
          wechatId: user.wechatId,
          message: `⚠️ 拦截提醒：系统检测到『${skill.skillNode}』考点正在快速遗忘（衰减风险 ${Math.round(calculatedDecayRisk * 100)}%）。\n已插入【高危遗忘拦截卡】，回复"开始"立即补救。`
        });
      }
    }

    if (skillsToUpdate.length === 0 && interventionsToCreate.length === 0) {
      console.log("[Proactive Agent] No critical memory decay risks detected. Finished.");
      return;
    }

    // 4. Batch Transaction execution for all DB updates
    await prisma.$transaction(async (tx) => {
      // Update decay risks
      const updatePromises = skillsToUpdate.map(s => 
        tx.skillState.update({ where: { id: s.id }, data: { decayRisk: s.decayRisk } })
      );
      await Promise.all(updatePromises);

      // Create intervention cards for each affected user
      for (const intervention of interventionsToCreate) {
        const session = await tx.scoreCenterSession.findFirst({
          where: { userId: intervention.userId },
          orderBy: { createdAt: "desc" },
        });

        if (session) {
          await tx.taskCard.create({
            data: {
              sessionId: session.sessionId,
              userId: intervention.userId,
              cardId: `proactive-intervention-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              taskType: "review",
              cardType: "pitfall",
              title: `高危遗忘拦截卡: ${intervention.skillNode}`,
              whyThisNow: `能力衰减达 ${Math.round(intervention.decayRisk * 100)}%。继续学新知识前必须先止损。`,
              estimatedMinutes: 10,
              difficulty: "medium",
              expectedImpact: "重置遗忘曲线",
              targetSkills: [intervention.skillNode],
              destinationPage: `/${intervention.exam}/mistakes`,
              successSignal: "完成针对性复盘",
              status: "surfaced",
              sequence: 0,
              originEngine: "proactive_intervention",
              confidence: 0.98,
            }
          });
        }
      }
    });

    console.log(`[Proactive Agent] DB Transaction complete. Updated ${skillsToUpdate.length} skills, generated ${interventionsToCreate.length} interventions.`);

    // 5. Asynchronous Notification Dispatch (Decoupled from DB Tx)
    // Using Promise.allSettled so a single bot failure doesn't crash the loop
    const notifyPromises = notificationsToSend.map(n => sendWechatMessage(n.wechatId, n.message));
    await Promise.allSettled(notifyPromises);

  } catch (error) {
    console.error("[Proactive Agent] Critical error in execution loop:", error);
  }
}
