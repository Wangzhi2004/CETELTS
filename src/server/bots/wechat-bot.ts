import { WechatyBuilder, Wechaty } from "wechaty";
import qrcodeTerminal from "qrcode-terminal";
import { prisma } from "@/server/db/prisma";
import { submitCommand } from "@/app/actions/score-center";
import fs from "fs/promises";
import path from "path";

const STATUS_FILE = path.join(process.cwd(), ".wechat-bot-status.json");

async function writeBotStatus(status: Record<string, unknown>) {
  try {
    await fs.writeFile(STATUS_FILE, JSON.stringify({ ...status, updatedAt: new Date().toISOString() }));
  } catch (err) {
    console.error("[WeChat Bot] Failed to write status file", err);
  }
}

let botInstance: Wechaty | null = null;

export async function startWechatBot() {
  if (botInstance) {
    console.log("[WeChat Bot] Already running.");
    return;
  }

  const bot = WechatyBuilder.build({
    name: "cetelts-bot",
    puppet: "wechaty-puppet-wechat",
  });

  bot.on("scan", (qrcode, status) => {
    console.log(`[WeChat Bot] Scan QR Code to login: ${status}`);
    qrcodeTerminal.generate(qrcode, { small: true });
    writeBotStatus({ status: "scan", qrcode });
  });

  bot.on("login", (user) => {
    console.log(`[WeChat Bot] User ${user} logged in`);
    writeBotStatus({ status: "logged_in", userName: user.name() });
  });

  bot.on("message", async (msg) => {
    if (msg.self() || msg.room()) return;

    const text = msg.text();
    const contact = msg.talker();
    const wechatId = contact.id;

    console.log(`[WeChat Bot] Message from ${contact.name()}: ${text}`);

    // Try to find the mapped user
    const user = await prisma.user.findUnique({
      where: { wechatId },
    });

    if (!user) {
      if (text === "绑定") {
        await prisma.user.update({
          where: { id: "user-student-001" }, // mockUser.id
          data: { wechatId },
        });
        await msg.say(`绑定成功！你的个人微信已接入提分中心。你可以向我发送类似“今天只有20分钟，帮我调整任务”等指令。`);
        return;
      }
      
      // If user is not mapped, ask them to link their account
      await msg.say(`你好！这里是提分中心小助手。你的微信号尚未绑定。请回复“绑定”来接入当前测试账号。你的WeChatID是: ${wechatId}`);
      return;
    }

    try {
      // Forward the user's message as a command to the Score Center AI
      const newState = await submitCommand(user.id, user.preferredExam, text);
      
      const teacherMessage = newState.teacherMessages.slice().reverse().find(m => m.role === "teacher");
      const reply = teacherMessage ? teacherMessage.content : "提分中心已更新您的状态。";
      
      await msg.say(reply);
    } catch (error) {
      console.error("[WeChat Bot] Error processing message:", error);
      await msg.say("抱歉，我现在脑子有点乱，处理你的请求失败了。");
    }
  });

  try {
    await writeBotStatus({ status: "starting" });
    await bot.start();
    botInstance = bot;
    console.log("[WeChat Bot] Started successfully.");
  } catch (error) {
    console.error("[WeChat Bot] Failed to start:", error);
    await writeBotStatus({ status: "error", error: String(error) });
  }
}

export async function sendWechatMessage(wechatId: string, message: string) {
  if (!botInstance || !botInstance.isLoggedIn) {
    console.log("[WeChat Bot] Bot is not ready, cannot send message to", wechatId);
    return;
  }

  try {
    const contact = await botInstance.Contact.find({ id: wechatId });
    if (contact) {
      await contact.say(message);
    } else {
      console.log("[WeChat Bot] Contact not found for ID:", wechatId);
    }
  } catch (error) {
    console.error("[WeChat Bot] Error sending message:", error);
  }
}
