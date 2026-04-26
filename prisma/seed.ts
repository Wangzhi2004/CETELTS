import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const demoPasswordHash = await bcrypt.hash("demo123", 12);

  const admin = await prisma.user.upsert({
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

  console.log(`Created admin: ${admin.email} (password: admin123)`);
  console.log(`Created demo: ${demo.email} (password: demo123)`);

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

  const existingSection = await prisma.section.findFirst({});
  if (!existingSection) {
    await seedQuestions();
  }

  console.log("Seed completed.");
}

async function seedQuestions() {
  const cet6Paper = await prisma.paper.upsert({
    where: { id: "paper-cet6-sample" },
    update: {},
    create: {
      id: "paper-cet6-sample",
      examType: "cet6",
      title: "CET-6 样卷一",
      year: 2024,
      season: "sample",
    },
  });

  const readingSection = await prisma.section.create({
    data: {
      sectionType: "reading",
      paperId: cet6Paper.id,
      order: 1,
      title: "阅读理解",
    },
  });

  const passage1 = await prisma.passage.create({
    data: {
      sectionId: readingSection.id,
      order: 1,
      title: "The Future of Artificial Intelligence in Education",
      body: `Artificial intelligence is rapidly transforming the landscape of education. From personalized learning paths to automated grading systems, AI technologies are reshaping how students learn and how teachers teach. Recent studies have shown that AI-powered adaptive learning platforms can improve student outcomes by up to 30% compared to traditional one-size-fits-all approaches.

However, the integration of AI in education also raises important ethical questions. Concerns about data privacy, algorithmic bias, and the potential displacement of human educators must be carefully addressed. The challenge lies not in replacing teachers but in augmenting their capabilities, allowing them to focus on what they do best: inspiring curiosity, fostering critical thinking, and providing emotional support.

As we look to the future, the most successful educational institutions will be those that strike the right balance between technological innovation and human connection. AI should serve as a tool that empowers both students and teachers, creating more equitable and effective learning environments for all.`,
    },
  });

  const questions = [
    { stem: "According to the passage, AI-powered adaptive learning platforms can improve student outcomes by:", order: 1, choices: [
      { content: "up to 30%", isCorrect: true, order: 1 },
      { content: "up to 20%", isCorrect: false, order: 2 },
      { content: "up to 50%", isCorrect: false, order: 3 },
      { content: "up to 10%", isCorrect: false, order: 4 },
    ]},
    { stem: "What is the main concern about AI in education mentioned in the passage?", order: 2, choices: [
      { content: "Cost of implementation", isCorrect: false, order: 1 },
      { content: "Data privacy, algorithmic bias, and displacement of educators", isCorrect: true, order: 2 },
      { content: "Lack of student interest", isCorrect: false, order: 3 },
      { content: "Slow technological progress", isCorrect: false, order: 4 },
    ]},
    { stem: "The author suggests that the most successful educational institutions will:", order: 3, choices: [
      { content: "Fully replace teachers with AI", isCorrect: false, order: 1 },
      { content: "Reject AI technology entirely", isCorrect: false, order: 2 },
      { content: "Balance technological innovation with human connection", isCorrect: true, order: 3 },
      { content: "Focus only on online learning", isCorrect: false, order: 4 },
    ]},
    { stem: "The word 'augmenting' in the second paragraph is closest in meaning to:", order: 4, choices: [
      { content: "replacing", isCorrect: false, order: 1 },
      { content: "enhancing", isCorrect: true, order: 2 },
      { content: "reducing", isCorrect: false, order: 3 },
      { content: "complicating", isCorrect: false, order: 4 },
    ]},
  ];

  for (const q of questions) {
    const question = await prisma.question.create({
      data: {
        passageId: passage1.id,
        stem: q.stem,
        questionType: "multiple_choice",
        order: q.order,
        difficulty: 0.5 + Math.random() * 0.3,
        discrimination: 0.3 + Math.random() * 0.4,
      },
    });

    for (const c of q.choices) {
      await prisma.choice.create({
        data: {
          questionId: question.id,
          content: c.content,
          isCorrect: c.isCorrect,
          order: c.order,
        },
      });
    }
  }

  const writingSection = await prisma.section.create({
    data: {
      sectionType: "writing",
      paperId: cet6Paper.id,
      order: 2,
      title: "写作",
    },
  });

  await prisma.question.create({
    data: {
      sectionId: writingSection.id,
      stem: "Directions: For this part, you are allowed 30 minutes to write an essay on the importance of developing critical thinking skills among college students. You should write at least 150 words but no more than 200 words.",
      questionType: "essay",
      order: 1,
      difficulty: 0.6,
      discrimination: 0.5,
    },
  });

  console.log("Seeded CET-6 sample questions");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
