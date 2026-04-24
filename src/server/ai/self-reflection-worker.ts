import { prisma } from "@/server/db/prisma";
import { evaluatePolicyGradients, applyGradientsToWeights } from "@/server/algorithms/policy-gradient";

const BATCH_SIZE = 500;

export async function runSelfReflectionPolicyUpdate() {
  console.log("[Self-Reflection] Worker starting: Initializing Policy Gradient Ascent...");
  
  try {
    // 1. Fetch recent policy logs with rewards in batch
    const recentLogs = await prisma.policyLog.findMany({
      where: { reward: { not: null } },
      orderBy: { createdAt: "desc" },
      take: BATCH_SIZE,
      select: { weights: true, propensityScore: true, reward: true, policyVersion: true }
    });

    if (recentLogs.length < 5) {
      console.log("[Self-Reflection] Not enough policy logs to evaluate. Skipping.");
      return;
    }

    // 2. Pure Algorithm Execution (Decoupled from DB)
    const logsData = recentLogs.map((l) => ({
      weights: l.weights as Record<string, number>,
      propensityScore: l.propensityScore,
      reward: l.reward ?? 0
    }));
    
    const opeResult = evaluatePolicyGradients(logsData);
    
    console.log(`[Self-Reflection] OPE Results - IPS: ${opeResult.ipsEstimate.toFixed(3)}, DR: ${opeResult.drEstimate.toFixed(3)}`);
    console.log(`[Self-Reflection] Gradients computed:`, opeResult.gradients);

    // 3. Batch Transaction for System Updates
    await prisma.$transaction(async (tx) => {
      await tx.oPEReport.create({
        data: {
          policyVersion: recentLogs[0].policyVersion || "v1",
          evaluationWindow: "batch_latest",
          sampleSize: opeResult.sampleSize,
          drEstimate: opeResult.drEstimate,
          ipsEstimate: opeResult.ipsEstimate,
          dmEstimate: 0.5,
          weightAttribution: opeResult.gradients as unknown as object,
          confidence: opeResult.confidence,
        }
      });

      const usersToUpdate = await tx.userState.findMany({
        where: { targetExam: "cet6" },
        select: { id: true, customWeights: true }
      });

      const updatePromises = usersToUpdate.map((state) => {
        const currentWeights = (state.customWeights as Record<string, number>) ?? {
          examWeight: 0.2, weaknessSeverity: 0.17, recurrence: 0.12,
          forgettingRisk: 0.12, transferGain: 0.09, deadlinePressure: 0.08,
          timeCost: 0.05, fatigueCost: 0.03,
        };

        const newWeights = applyGradientsToWeights(currentWeights, opeResult.gradients);

        return tx.userState.update({
          where: { id: state.id },
          data: { customWeights: newWeights },
        });
      });

      await Promise.all(updatePromises);
    });
    
    console.log("[Self-Reflection] Worker finished: Successfully applied global policy weights via Transaction.");
  } catch (error) {
    console.error("[Self-Reflection] Critical Error during policy update transaction:", error);
  }
}
