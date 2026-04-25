import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type AiProviderSettings = {
  provider: "openai-compatible";
  apiKey: string;
  baseURL: string;
  model: string;
  teacherModel: string;
  enabled: boolean;
};

const SETTINGS_FILE = path.join(process.cwd(), ".tmp", "ai-provider-settings.json");

const DEFAULT_SETTINGS: AiProviderSettings = {
  provider: "openai-compatible",
  apiKey: process.env.OPENAI_API_KEY ?? "",
  baseURL: process.env.OPENAI_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",
  model: process.env.OPENAI_MODEL ?? "glm-5",
  teacherModel: process.env.OPENAI_TEACHER_MODEL ?? process.env.OPENAI_MODEL ?? "glm-5",
  enabled: Boolean(process.env.OPENAI_API_KEY),
};

export function normalizeAiProviderSettings(
  partial?: Partial<AiProviderSettings> | null,
): AiProviderSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    provider: "openai-compatible",
    baseURL: (partial?.baseURL ?? DEFAULT_SETTINGS.baseURL).replace(/\/+$/, ""),
    model: partial?.model?.trim() || DEFAULT_SETTINGS.model,
    teacherModel: partial?.teacherModel?.trim() || partial?.model?.trim() || DEFAULT_SETTINGS.teacherModel,
    apiKey: partial?.apiKey?.trim() ?? DEFAULT_SETTINGS.apiKey,
    enabled:
      typeof partial?.enabled === "boolean"
        ? partial.enabled
        : Boolean(partial?.apiKey?.trim() ?? DEFAULT_SETTINGS.apiKey),
  };
}

export function redactAiProviderSettings(settings: AiProviderSettings) {
  const apiKey =
    settings.apiKey.length <= 8
      ? settings.apiKey.replace(/.(?=.{2})/g, "*")
      : `${settings.apiKey.slice(0, 4)}****${settings.apiKey.slice(-4)}`;

  return {
    ...settings,
    apiKey,
  };
}

export async function loadAiProviderSettings() {
  try {
    const raw = await readFile(SETTINGS_FILE, "utf8");
    return normalizeAiProviderSettings(JSON.parse(raw) as Partial<AiProviderSettings>);
  } catch {
    return normalizeAiProviderSettings();
  }
}

export async function saveAiProviderSettings(settings: Partial<AiProviderSettings>) {
  const normalized = normalizeAiProviderSettings(settings);
  try {
    await mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
    await writeFile(SETTINGS_FILE, JSON.stringify(normalized, null, 2), "utf8");
  } catch (error) {
    console.error("[ai-config] Failed to save settings file:", error);
  }
  return normalized;
}