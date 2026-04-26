"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/server/db/prisma";
import { signIn } from "@/server/auth";

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  preferredExam?: "cet6" | "ielts";
}) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    return { error: "该邮箱已被注册" };
  }

  if (input.password.length < 6) {
    return { error: "密码至少 6 位" };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      preferredExam: input.preferredExam ?? "cet6",
      role: "student",
    },
  });

  await prisma.goal.create({
    data: {
      userId: user.id,
      examType: user.preferredExam,
      targetScore: user.preferredExam === "cet6" ? 500 : 7,
      examDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      dailyMinutes: 90,
      phase: "intensive",
    },
  });

  return { success: true, userId: user.id };
}

export async function loginWithCredentials(input: {
  email: string;
  password: string;
}) {
  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirectTo: "/",
    });
    return { success: true };
  } catch (error) {
    if ((error as unknown as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      return { success: true };
    }
    return { error: "邮箱或密码不正确" };
  }
}

export async function getCurrentUser() {
  const { auth } = await import("@/server/auth");
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      preferredExam: true,
      timezone: true,
      image: true,
    },
  });

  return user;
}

export async function updateUserProfile(input: {
  name?: string;
  preferredExam?: "cet6" | "ielts";
  timezone?: string;
}) {
  const { auth } = await import("@/server/auth");
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "未登录" };
  }

  const data: { name?: string; preferredExam?: "cet6" | "ielts"; timezone?: string } = {};
  if (input.name) data.name = input.name;
  if (input.preferredExam) data.preferredExam = input.preferredExam;
  if (input.timezone) data.timezone = input.timezone;

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return { success: true };
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const { auth } = await import("@/server/auth");
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "未登录" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.passwordHash) {
    return { error: "账户未设置密码" };
  }

  const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isValid) {
    return { error: "当前密码不正确" };
  }

  if (input.newPassword.length < 6) {
    return { error: "新密码至少 6 位" };
  }

  const newHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return { success: true };
}