"use server";

import {
  loadAiProviderSettings,
  redactAiProviderSettings,
  saveAiProviderSettings,
  type AiProviderSettings,
} from "@/server/ai/ai-config";
import fs from "fs/promises";
import path from "path";

export async function getAiProviderSettings() {
  return redactAiProviderSettings(await loadAiProviderSettings());
}

export async function updateAiProviderSettings(input: Partial<AiProviderSettings>) {
  const saved = await saveAiProviderSettings(input);
  return redactAiProviderSettings(saved);
}

export async function getWechatBotStatus() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), ".wechat-bot-status.json"), "utf-8");
    return JSON.parse(data);
  } catch {
    return { status: "stopped" };
  }
}
