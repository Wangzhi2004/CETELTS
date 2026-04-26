import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const demoPasswordHash = await bcrypt.hash("demo123", 12);

  await prisma.user.upsert({
    where: { email: "admin@cetelts.com" },
    update: {},
    create: {
      id: "user-admin",
      name: "管理员",
      email: "admin@cetelts.com",
      passwordHash: adminPasswordHash,
      role: "admin",
      preferredExam: "cet6",
      timezone: "Asia/Shanghai",
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: "demo@cetelts.com" },
    update: {},
    create: {
      id: "user-alex",
      name: "同学",
      email: "demo@cetelts.com",
      passwordHash: demoPasswordHash,
      role: "student",
      preferredExam: "cet6",
      timezone: "Asia/Shanghai",
    },
  });

  console.log("Created admin: admin@cetelts.com / admin123");
  console.log("Created demo:  demo@cetelts.com / demo123");

  const existingGoal = await prisma.goal.findFirst({
    where: { userId: demo.id },
  });

  if (!existingGoal) {
    await prisma.goal.create({
      data: {
        userId: demo.id,
        examType: "cet6",
        targetScore: 500,
        examDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        dailyMinutes: 90,
        phase: "intensive",
      },
    });
    console.log("Created demo goal for CET-6");
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });