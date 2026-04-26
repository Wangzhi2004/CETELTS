import { prisma } from "@/server/db/prisma";

export async function startWechatBot() {
  console.log("[WeChat Bot] wechaty dependencies not installed. Bot feature is disabled.");
}

export async function sendWechatMessage(wechatId: string, message: string) {
  console.log("[WeChat Bot] Disabled. Cannot send message to", wechatId);
}