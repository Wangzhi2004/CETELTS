import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/cetelts";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const user = await prisma.user.upsert({
    where: { id: "user-alex" },
    update: {},
    create: {
      id: "user-alex",
      name: "Alex",
      email: "alex@cetelts.com",
      role: "student",
      preferredExam: "cet6",
    },
  });
  console.log(`✅ User: ${user.name}`);

  await prisma.goal.upsert({
    where: { id: "goal-alex-cet6" },
    update: {},
    create: {
      id: "goal-alex-cet6",
      userId: user.id,
      examType: "cet6",
      targetScore: 500,
      examDate: new Date("2026-06-14"),
      dailyMinutes: 90,
      phase: "intensive",
    },
  });
  console.log("✅ Goal created");

  const paper1 = await prisma.examPaper.upsert({
    where: { id: "paper-cet6-2024-06" },
    update: {},
    create: {
      id: "paper-cet6-2024-06",
      examType: "cet6",
      year: 2024,
      month: 6,
      session: "morning",
      title: "2024年6月大学英语六级考试",
      status: "published",
      sourceDocumentId: "doc-seed",
    },
  });
  console.log(`✅ Paper: ${paper1.title}`);

  const doc = await prisma.sourceDocument.upsert({
    where: { id: "doc-seed" },
    update: {},
    create: {
      id: "doc-seed",
      documentType: "exam_paper",
      filename: "cet6-2024-06.pdf",
      storageKey: "seed/cet6-2024-06.pdf",
      checksum: "seed",
      uploadedBy: "system",
      status: "published",
    },
  });

  const readingSection = await prisma.section.upsert({
    where: { id: "sec-cet6-2024-06-reading" },
    update: {},
    create: {
      id: "sec-cet6-2024-06-reading",
      paperId: paper1.id,
      title: "阅读理解",
      sectionType: "reading",
      order: 1,
      instructions: "仔细阅读下列短文，并根据短文内容选择正确答案。",
    },
  });
  console.log("✅ Reading section created");

  const passage1 = await prisma.passage.create({
    data: {
      id: "passage-cet6-ai-education",
      sectionId: readingSection.id,
      title: "人工智能与教育的深度融合",
      body: `Artificial intelligence is rapidly transforming the landscape of education worldwide. In recent years, AI-powered tools have been increasingly adopted in classrooms, from personalized learning platforms that adapt to individual students' pace and learning style, to intelligent tutoring systems that provide instant feedback on assignments.

However, the integration of AI in education is not without controversy. Critics argue that over-reliance on AI could diminish the role of human teachers and reduce students' ability to think critically. They worry that algorithms, no matter how sophisticated, cannot replace the emotional intelligence and mentorship that human educators provide.

Proponents, on the other hand, contend that AI does not aim to replace teachers but to augment their capabilities. By automating routine tasks such as grading and attendance tracking, AI frees up teachers to focus on what they do best: inspiring students, facilitating discussions, and providing individualized guidance.

A recent study by the McKinsey Global Institute found that AI could automate up to 30% of teachers' current tasks, potentially saving them 13 hours per week. This time could be redirected toward activities that have a higher impact on student outcomes, such as one-on-one tutoring and curriculum development.

The challenge lies in finding the right balance between technological efficiency and human connection. As one education researcher put it, "The best classrooms of the future will be those where AI handles the data and teachers handle the humanity."`,
      order: 1,
    },
  });
  console.log("✅ Passage 1 created");

  const questions1 = [
    {
      id: "q-cet6-reading-1",
      stem: "According to the passage, what is the main concern of critics regarding AI in education?",
      questionType: "multiple_choice",
      explanation: "批评者的主要担忧是过度依赖AI可能会削弱人类教师的作用并降低学生的批判性思维能力。见第二段 'over-reliance on AI could diminish the role of human teachers and reduce students' ability to think critically'。",
      difficulty: 0.5,
      skillTags: ["detail_understanding", "critical_analysis"],
      errorTags: ["topic_misread", "detail_misread"],
      order: 1,
      choices: [
        { label: "A", content: "AI is too expensive for most schools to afford", isCorrect: false },
        { label: "B", content: "AI could diminish the role of teachers and reduce critical thinking", isCorrect: true },
        { label: "C", content: "AI cannot grade assignments accurately enough", isCorrect: false },
        { label: "D", content: "AI makes students too dependent on technology for answers", isCorrect: false },
      ],
    },
    {
      id: "q-cet6-reading-2",
      stem: "What does the McKinsey study suggest about AI's potential impact on teachers' workload?",
      questionType: "multiple_choice",
      explanation: "McKinsey研究发现AI可以自动化高达30%的教师任务，每周节省13小时。见第四段 'AI could automate up to 30% of teachers' current tasks, potentially saving them 13 hours per week'。",
      difficulty: 0.4,
      skillTags: ["detail_understanding", "data_interpretation"],
      errorTags: ["detail_misread", "evidence_location_failure"],
      order: 2,
      choices: [
        { label: "A", content: "AI could replace 30% of all teachers within a decade", isCorrect: false },
        { label: "B", content: "AI could automate 30% of teachers' tasks, saving about 13 hours weekly", isCorrect: true },
        { label: "C", content: "AI could reduce the need for teachers by half", isCorrect: false },
        { label: "D", content: "AI could improve student test scores by 30%", isCorrect: false },
      ],
    },
    {
      id: "q-cet6-reading-3",
      stem: 'What does the quote "The best classrooms of the future will be those where AI handles the data and teachers handle the humanity" imply?',
      questionType: "multiple_choice",
      explanation: "这句话暗示AI和教师应该各司其职——AI处理数据，教师负责人文关怀。这是关于找到技术与人类联系的平衡点。见最后一段。",
      difficulty: 0.6,
      skillTags: ["inference", "tone_understanding"],
      errorTags: ["inference_failure", "topic_misread"],
      order: 3,
      choices: [
        { label: "A", content: "AI will eventually take over all aspects of education", isCorrect: false },
        { label: "B", content: "Teachers should focus on data analysis while AI handles students", isCorrect: false },
        { label: "C", content: "The ideal future classroom balances AI efficiency with human empathy", isCorrect: true },
        { label: "D", content: "Humanity is more important than data in education", isCorrect: false },
      ],
    },
    {
      id: "q-cet6-reading-4",
      stem: "According to proponents of AI in education, what is the primary benefit of automating routine tasks?",
      questionType: "multiple_choice",
      explanation: "支持者认为自动化日常任务可以释放教师时间，让他们专注于更有影响力的活动。见第三段 'AI frees up teachers to focus on what they do best'。",
      difficulty: 0.45,
      skillTags: ["detail_understanding", "argument_analysis"],
      errorTags: ["detail_misread", "option_discrimination_failure"],
      order: 4,
      choices: [
        { label: "A", content: "It reduces the number of teachers needed in schools", isCorrect: false },
        { label: "B", content: "It allows teachers to focus on high-impact activities like tutoring", isCorrect: true },
        { label: "C", content: "It ensures all students receive the same quality of instruction", isCorrect: false },
        { label: "D", content: "It eliminates the need for curriculum development", isCorrect: false },
      ],
    },
  ];

  for (const q of questions1) {
    const { choices, ...qData } = q;
    await prisma.question.upsert({
      where: { id: qData.id },
      update: {},
      create: {
        ...qData,
        sectionId: readingSection.id,
        passageId: passage1.id,
        choices: { create: choices },
      },
    });
  }
  console.log("✅ Reading questions created (4)");

  const passage2 = await prisma.passage.create({
    data: {
      id: "passage-cet6-remote-work",
      sectionId: readingSection.id,
      title: "远程办公的未来趋势",
      body: `The COVID-19 pandemic has permanently altered the way we work. Remote work, once considered a rare perk, has become a mainstream arrangement that millions of professionals around the world now consider essential. According to a 2024 survey by FlexJobs, 65% of workers reported wanting to work remotely full-time, while an additional 32% preferred a hybrid arrangement.

Companies are responding to this shift in varied ways. Tech giants like Microsoft and Google have adopted hybrid models, requiring employees to be in the office two to three days per week. Meanwhile, companies like Dropbox and Reddit have embraced fully remote work, arguing that it expands their talent pool and boosts employee satisfaction.

However, remote work presents significant challenges. Communication gaps, feelings of isolation, and the blurring of work-life boundaries are commonly cited drawbacks. Managers struggle with maintaining team cohesion and monitoring productivity without resorting to invasive surveillance tools.

The debate over remote work is ultimately a debate about trust. Organizations that trust their employees to manage their own time and deliver results tend to thrive in remote settings, while those that rely on physical presence as a proxy for productivity often struggle to adapt. As workplace dynamics continue to evolve, the most successful companies will be those that prioritize outcomes over hours logged and flexibility over rigidity.`,
      order: 2,
    },
  });
  console.log("✅ Passage 2 created");

  const questions2 = [
    {
      id: "q-cet6-reading-5",
      stem: "What percentage of workers surveyed by FlexJobs wanted to work remotely full-time?",
      questionType: "multiple_choice",
      explanation: "FlexJobs调查显示65%的受访者希望全职远程工作。见第一段 '65% of workers reported wanting to work remotely full-time'。",
      difficulty: 0.3,
      skillTags: ["detail_understanding", "data_interpretation"],
      errorTags: ["detail_misread"],
      order: 5,
      choices: [
        { label: "A", content: "32%", isCorrect: false },
        { label: "B", content: "65%", isCorrect: true },
        { label: "C", content: "97%", isCorrect: false },
        { label: "D", content: "50%", isCorrect: false },
      ],
    },
    {
      id: "q-cet6-reading-6",
      stem: "According to the passage, what is the core issue underlying the remote work debate?",
      questionType: "multiple_choice",
      explanation: "文章指出远程办公的争论本质上是关于信任的争论。见第四段 'The debate over remote work is ultimately a debate about trust'。",
      difficulty: 0.6,
      skillTags: ["inference", "main_idea"],
      errorTags: ["inference_failure", "topic_misread"],
      order: 6,
      choices: [
        { label: "A", content: "The cost of office space", isCorrect: false },
        { label: "B", content: "Trust between employers and employees", isCorrect: true },
        { label: "C", content: "The availability of technology", isCorrect: false },
        { label: "D", content: "Government regulations", isCorrect: false },
      ],
    },
  ];

  for (const q of questions2) {
    const { choices, ...qData } = q;
    await prisma.question.upsert({
      where: { id: qData.id },
      update: {},
      create: {
        ...qData,
        sectionId: readingSection.id,
        passageId: passage2.id,
        choices: { create: choices },
      },
    });
  }
  console.log("✅ Reading questions created (2 more)");

  const listeningSection = await prisma.section.upsert({
    where: { id: "sec-cet6-2024-06-listening" },
    update: {},
    create: {
      id: "sec-cet6-2024-06-listening",
      paperId: paper1.id,
      title: "听力理解",
      sectionType: "listening",
      order: 2,
      instructions: "请听录音，根据听到的内容选择正确答案。",
    },
  });
  console.log("✅ Listening section created");

  const listeningQuestions = [
    {
      id: "q-cet6-listening-1",
      stem: "What is the main topic of the lecture you just heard?",
      questionType: "multiple_choice",
      explanation: "听力主旨题，考查对讲座整体内容的把握。",
      difficulty: 0.5,
      skillTags: ["listening_main_idea", "listening_comprehension"],
      errorTags: ["listening_keyword_miss", "listening_structure_loss"],
      order: 1,
      choices: [
        { label: "A", content: "The history of renewable energy", isCorrect: false },
        { label: "B", content: "The impact of urbanization on climate", isCorrect: true },
        { label: "C", content: "New technologies in transportation", isCorrect: false },
        { label: "D", content: "Economic growth in developing countries", isCorrect: false },
      ],
    },
    {
      id: "q-cet6-listening-2",
      stem: "According to the speaker, what is the primary cause of the problem discussed?",
      questionType: "multiple_choice",
      explanation: "听力细节题，考查对关键信息的捕捉。",
      difficulty: 0.55,
      skillTags: ["listening_detail", "listening_comprehension"],
      errorTags: ["listening_keyword_miss", "detail_misread"],
      order: 2,
      choices: [
        { label: "A", content: "Industrial emissions from factories", isCorrect: false },
        { label: "B", content: "Rapid expansion of urban areas", isCorrect: true },
        { label: "C", content: "Deforestation in rural regions", isCorrect: false },
        { label: "D", content: "Increased use of private vehicles", isCorrect: false },
      ],
    },
  ];

  for (const q of listeningQuestions) {
    const { choices, ...qData } = q;
    await prisma.question.upsert({
      where: { id: qData.id },
      update: {},
      create: {
        ...qData,
        sectionId: listeningSection.id,
        passageId: null,
        choices: { create: choices },
      },
    });
  }
  console.log("✅ Listening questions created (2)");

  const writingSection = await prisma.section.upsert({
    where: { id: "sec-cet6-2024-06-writing" },
    update: {},
    create: {
      id: "sec-cet6-2024-06-writing",
      paperId: paper1.id,
      title: "写作",
      sectionType: "writing",
      order: 3,
      instructions: "请根据以下题目，写一篇不少于150词的短文。",
    },
  });

  const writingQuestions = [
    {
      id: "q-cet6-writing-1",
      stem: "Directions: For this part, you are allowed 30 minutes to write an essay on the importance of developing critical thinking skills among college students. You should write at least 150 words but no more than 200 words.",
      questionType: "essay",
      explanation: "六级写作题，要求论述大学生培养批判性思维的重要性。",
      difficulty: 0.6,
      skillTags: ["writing_argument", "writing_structure"],
      errorTags: ["writing_task_response_weak", "writing_coherence_weak"],
      order: 1,
      choices: {
        create: [],
      },
    },
    {
      id: "q-cet6-writing-2",
      stem: "Directions: For this part, you are allowed 30 minutes to write a short essay on the topic: Is Artificial Intelligence a Threat or an Opportunity? You should write at least 150 words but no more than 200 words.",
      questionType: "essay",
      explanation: "六级写作题，要求讨论AI是威胁还是机遇。",
      difficulty: 0.55,
      skillTags: ["writing_argument", "writing_balance"],
      errorTags: ["writing_task_response_weak", "writing_grammar_risk"],
      order: 2,
      choices: {
        create: [],
      },
    },
  ];

  for (const q of writingQuestions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        ...q,
        sectionId: writingSection.id,
        passageId: null,
      },
    });
  }
  console.log("✅ Writing questions created (2)");

  console.log("\n🎉 Seed completed!");
  console.log("  - 1 User (user-alex)");
  console.log("  - 1 ExamPaper (CET-6 2024.06)");
  console.log("  - 3 Sections (reading, listening, writing)");
  console.log("  - 2 Passages (AI & Education, Remote Work)");
  console.log("  - 8 Reading questions + 2 Listening questions + 2 Writing questions");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });