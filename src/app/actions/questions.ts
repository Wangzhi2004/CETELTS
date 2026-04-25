"use server";

import { prisma } from "@/server/db/prisma";

export type QuestionWithChoices = {
  id: string;
  questionType: string;
  stem: string;
  explanation: string | null;
  difficulty: number;
  skillTags: unknown;
  errorTags: unknown;
  order: number;
  choices: {
    id: string;
    label: string;
    content: string;
    isCorrect: boolean;
  }[];
};

export type PassageWithQuestions = {
  id: string;
  title: string | null;
  body: string;
  order: number;
  questions: QuestionWithChoices[];
};

export type SectionWithData = {
  id: string;
  title: string;
  sectionType: string;
  instructions: string;
  order: number;
  passages: PassageWithQuestions[];
  questions: QuestionWithChoices[];
};

export async function getReadingSections(exam: "cet6" | "ielts"): Promise<SectionWithData[]> {
  const sections = await prisma.section.findMany({
    where: {
      sectionType: "reading",
      paper: { examType: exam },
    },
    include: {
      passages: {
        include: {
          questions: {
            include: { choices: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
      questions: {
        where: { passageId: null },
        include: { choices: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return sections as SectionWithData[];
}

export async function getListeningSections(exam: "cet6" | "ielts"): Promise<SectionWithData[]> {
  const sections = await prisma.section.findMany({
    where: {
      sectionType: "listening",
      paper: { examType: exam },
    },
    include: {
      passages: {
        include: {
          questions: {
            include: { choices: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
      questions: {
        where: { passageId: null },
        include: { choices: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return sections as SectionWithData[];
}

export async function getWritingQuestions(exam: "cet6" | "ielts") {
  const questions = await prisma.question.findMany({
    where: {
      questionType: "essay",
      section: {
        sectionType: "writing",
        paper: { examType: exam },
      },
    },
    include: { choices: true },
    orderBy: { order: "asc" },
  });

  return questions;
}