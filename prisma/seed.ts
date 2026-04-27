import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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

  const existingSourceDoc = await prisma.sourceDocument.findFirst({
    where: { id: "doc-cet6-2019-12" },
  });

  if (!existingSourceDoc) {
    await prisma.sourceDocument.create({
      data: {
        id: "doc-cet6-2019-12",
        documentType: "exam_paper",
        filename: "cet6-2019-12-set2.pdf",
        storageKey: "papers/cet6-2019-12-set2.pdf",
        checksum: "seed-data",
        uploadedBy: "user-admin",
        status: "published",
      },
    });
    console.log("Created source document for CET-6 2019-12");
  }

  const existingPaper = await prisma.examPaper.findFirst({
    where: { id: "paper-2019-12-set2" },
  });

  if (!existingPaper) {
    await prisma.examPaper.create({
      data: {
        id: "paper-2019-12-set2",
        examType: "cet6",
        year: 2019,
        month: 12,
        session: "第2套",
        title: "2019年12月CET-6第2套",
        status: "published",
        sourceDocumentId: "doc-cet6-2019-12",
      },
    });
    console.log("Created CET-6 exam paper");
  }

  const existingSection = await prisma.section.findFirst({
    where: { id: "section-reading-2019-12-a" },
  });

  if (!existingSection) {
    await prisma.section.create({
      data: {
        id: "section-reading-2019-12-a",
        paperId: "paper-2019-12-set2",
        title: "仔细阅读 Section A",
        sectionType: "reading",
        order: 1,
        instructions: "阅读以下文章，然后根据文章内容回答问题。每题只有一个正确答案。",
      },
    });
    console.log("Created reading section");
  }

  const existingPassage = await prisma.passage.findFirst({
    where: { id: "passage-rivers" },
  });

  if (!existingPassage) {
    await prisma.passage.create({
      data: {
        id: "passage-rivers",
        sectionId: "section-reading-2019-12-a",
        title: "Passage 1: 河流的重要性与威胁",
        body: "Rivers make life possible for communities and people around the world. They are a pervasive part of the landscape, providing water for drinking, irrigation, and industrial use. They also serve as transportation routes and support a wide range of ecosystems.\n\nDespite their importance, rivers are facing serious threats. Pollution from industries, agriculture, and households has degraded water quality in many places. Dams and water diversion projects have altered the natural flow of rivers, affecting both the environment and the people who depend on them.\n\nRestoring and protecting rivers requires collective efforts. Effective management, stronger regulations, and public awareness are essential to ensure that rivers continue to sustain life and support development.",
        order: 1,
      },
    });
    console.log("Created reading passage");
  }

  const existingQuestions = await prisma.question.count({
    where: { sectionId: "section-reading-2019-12-a" },
  });

  if (existingQuestions === 0) {
    await prisma.question.createMany({
      data: [
        {
          id: "q-1",
          sectionId: "section-reading-2019-12-a",
          passageId: "passage-rivers",
          questionType: "single_choice",
          stem: "What does the author say about the underlined word \"pervasive\" in paragraph 1?",
          explanation: "pervasive 意为 \"widespread\"（无处不在的、广泛存在的），与 widespread 同义。",
          difficulty: 0.6,
          skillTags: ["vocab", "detail"],
          errorTags: ["vocabulary_gap", "option_discrimination_failure"],
          order: 1,
        },
        {
          id: "q-2",
          sectionId: "section-reading-2019-12-a",
          passageId: "passage-rivers",
          questionType: "single_choice",
          stem: "According to the passage, what are the major threats to rivers?",
          explanation: "文中明确指出 pollution（污染）和 dams（水坝/水利工程）是两大威胁。",
          difficulty: 0.4,
          skillTags: ["detail", "comprehension"],
          errorTags: ["evidence_location_failure", "topic_misread"],
          order: 2,
        },
        {
          id: "q-3",
          sectionId: "section-reading-2019-12-a",
          passageId: "passage-rivers",
          questionType: "single_choice",
          stem: "What does the author suggest as solutions to protect rivers?",
          explanation: "作者在第三段提出了三个解决方案：effective management、stronger regulations、public awareness。",
          difficulty: 0.45,
          skillTags: ["comprehension", "inference"],
          errorTags: ["topic_misread", "inference_failure"],
          order: 3,
        },
      ],
    });

    await prisma.choice.createMany({
      data: [
        { id: "q1-a", questionId: "q-1", label: "A", content: "It is widespread.", isCorrect: true },
        { id: "q1-b", questionId: "q-1", label: "B", content: "It is increasingly popular.", isCorrect: false },
        { id: "q1-c", questionId: "q-1", label: "C", content: "It causes many problems.", isCorrect: false },
        { id: "q1-d", questionId: "q-1", label: "D", content: "It is difficult to control.", isCorrect: false },
        { id: "q2-a", questionId: "q-2", label: "A", content: "Pollution and dams.", isCorrect: true },
        { id: "q2-b", questionId: "q-2", label: "B", content: "Climate change and deforestation.", isCorrect: false },
        { id: "q2-c", questionId: "q-2", label: "C", content: "Overfishing and urbanization.", isCorrect: false },
        { id: "q2-d", questionId: "q-2", label: "D", content: "Industrial waste only.", isCorrect: false },
        { id: "q3-a", questionId: "q-3", label: "A", content: "Effective management, stronger regulations, and public awareness.", isCorrect: true },
        { id: "q3-b", questionId: "q-3", label: "B", content: "Building more dams and water diversion projects.", isCorrect: false },
        { id: "q3-c", questionId: "q-3", label: "C", content: "Reducing industrial use of rivers only.", isCorrect: false },
        { id: "q3-d", questionId: "q-3", label: "D", content: "Relocating communities away from rivers.", isCorrect: false },
      ],
    });
    console.log("Created reading questions and choices");
  }

  const existingListeningSection = await prisma.section.findFirst({
    where: { id: "section-listening-2020-06-a" },
  });

  if (!existingListeningSection) {
    const existingListeningDoc = await prisma.sourceDocument.findFirst({
      where: { id: "doc-cet6-2020-06" },
    });

    if (!existingListeningDoc) {
      await prisma.sourceDocument.create({
        data: {
          id: "doc-cet6-2020-06",
          documentType: "exam_paper",
          filename: "cet6-2020-06-set1.pdf",
          storageKey: "papers/cet6-2020-06-set1.pdf",
          checksum: "seed-data",
          uploadedBy: "user-admin",
          status: "published",
        },
      });
    }

    const existingListeningPaper = await prisma.examPaper.findFirst({
      where: { id: "paper-2020-06-set1" },
    });

    if (!existingListeningPaper) {
      await prisma.examPaper.create({
        data: {
          id: "paper-2020-06-set1",
          examType: "cet6",
          year: 2020,
          month: 6,
          session: "第1套",
          title: "2020年6月CET-6第1套",
          status: "published",
          sourceDocumentId: "doc-cet6-2020-06",
        },
      });
    }

    await prisma.section.create({
      data: {
        id: "section-listening-2020-06-a",
        paperId: "paper-2020-06-set1",
        title: "长对话 Section A",
        sectionType: "listening",
        order: 1,
        instructions: "听以下对话，选择正确答案。",
      },
    });
    console.log("Created listening section");
  }

  const existingListeningQuestions = await prisma.question.count({
    where: { sectionId: "section-listening-2020-06-a" },
  });

  if (existingListeningQuestions === 0) {
    await prisma.question.createMany({
      data: [
        {
          id: "q-l1",
          sectionId: "section-listening-2020-06-a",
          passageId: null,
          questionType: "single_choice",
          stem: "What is the main topic of the conversation?",
          explanation: "对话主要讨论大学课程选择的问题。",
          difficulty: 0.4,
          skillTags: ["listening", "comprehension"],
          errorTags: ["topic_misread", "inference_failure"],
          order: 1,
        },
        {
          id: "q-l2",
          sectionId: "section-listening-2020-06-a",
          passageId: null,
          questionType: "single_choice",
          stem: "Why does the man decide to take the course?",
          explanation: "男士选择课程是因为教授的教学风格有趣。",
          difficulty: 0.5,
          skillTags: ["listening", "detail"],
          errorTags: ["evidence_location_failure", "vocabulary_gap"],
          order: 2,
        },
      ],
    });

    await prisma.choice.createMany({
      data: [
        { id: "ql1-a", questionId: "q-l1", label: "A", content: "University course selection.", isCorrect: true },
        { id: "ql1-b", questionId: "q-l1", label: "B", content: "Career planning advice.", isCorrect: false },
        { id: "ql1-c", questionId: "q-l1", label: "C", content: "Study abroad opportunities.", isCorrect: false },
        { id: "ql1-d", questionId: "q-l1", label: "D", content: "Library resource management.", isCorrect: false },
        { id: "ql2-a", questionId: "q-l2", label: "A", content: "The professor has an engaging teaching style.", isCorrect: true },
        { id: "ql2-b", questionId: "q-l2", label: "B", content: "The course is required for graduation.", isCorrect: false },
        { id: "ql2-c", questionId: "q-l2", label: "C", content: "His friend recommended it.", isCorrect: false },
        { id: "ql2-d", questionId: "q-l2", label: "D", content: "It is the easiest course available.", isCorrect: false },
      ],
    });
    console.log("Created listening questions and choices");
  }

  const existingWritingSection = await prisma.section.findFirst({
    where: { id: "section-writing-cet6" },
  });

  if (!existingWritingSection) {
    await prisma.section.create({
      data: {
        id: "section-writing-cet6",
        paperId: "paper-2019-12-set2",
        title: "写作 Section",
        sectionType: "writing",
        order: 4,
        instructions: "请根据以下题目写一篇议论文，字数不少于150字。",
      },
    });
    console.log("Created writing section");
  }

  const existingWritingQuestions = await prisma.question.count({
    where: { sectionId: "section-writing-cet6" },
  });

  if (existingWritingQuestions === 0) {
    await prisma.question.createMany({
      data: [
        {
          id: "q-writing-1",
          sectionId: "section-writing-cet6",
          passageId: null,
          questionType: "essay",
          stem: "Directions: For this part, you are allowed 30 minutes to write an essay on the importance of cooperation. You should write at least 150 words but no more than 200 words.",
          explanation: null,
          difficulty: 0.5,
          skillTags: ["writing", "argumentation"],
          errorTags: [],
          order: 1,
        },
      ],
    });
    console.log("Created writing question");
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