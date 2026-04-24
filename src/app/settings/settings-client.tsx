"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, RefreshCw, Settings2, Smartphone, WifiOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import {
  getAiProviderSettings,
  getWechatBotStatus,
  updateAiProviderSettings,
} from "@/app/actions/settings";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockUser } from "@/mocks/student-data";

type AiSettingsForm = {
  provider: "openai-compatible";
  apiKey: string;
  baseURL: string;
  model: string;
  teacherModel: string;
  enabled: boolean;
};

type BotStatus = {
  status: "stopped" | "starting" | "scan" | "logged_in" | "error";
  qrcode?: string;
  userName?: string;
  error?: string;
};

const copy = {
  title: "\u6211\u7684\u8bbe\u7f6e",
  description: "\u7ba1\u7406 AI \u8001\u5e08\u63a5\u53e3\u3001\u6a21\u578b\u3001\u6d4b\u8bd5\u8d26\u53f7\u548c\u5fae\u4fe1\u667a\u80fd\u4f53\u63a5\u5165\u72b6\u6001\u3002",
  back: "\u8fd4\u56de\u63d0\u5206\u4e2d\u5fc3",
  account: "\u6d4b\u8bd5\u8d26\u53f7",
  userId: "\u7528\u6237 ID",
  currentExam: "\u5f53\u524d\u8003\u8bd5",
  wechatBinding: "\u5fae\u4fe1\u7ed1\u5b9a",
  unbound: "\u672a\u7ed1\u5b9a",
  loggedIn: "\u5df2\u767b\u5f55",
  wechatAgent: "\u5fae\u4fe1\u667a\u80fd\u4f53",
  refresh: "\u5237\u65b0\u72b6\u6001",
  providerType: "Provider \u7c7b\u578b",
  apiKeyHelp: "\u5df2\u4fdd\u5b58\u7684\u5bc6\u94a5\u4f1a\u8131\u654f\u663e\u793a\uff1b\u4e0d\u91cd\u65b0\u8f93\u5165\u65f6\uff0c\u4fdd\u5b58\u4e0d\u4f1a\u8986\u76d6\u539f\u5bc6\u94a5\u3002",
  enabled: "\u542f\u7528 AI Responses \u8c03\u7528",
  modelConfig: "\u6a21\u578b\u914d\u7f6e",
  generalModel: "\u901a\u7528\u6a21\u578b",
  teacherModel: "\u8001\u5e08\u89e3\u91ca\u6a21\u578b",
  saving: "\u4fdd\u5b58\u4e2d...",
  save: "\u4fdd\u5b58 AI \u63a5\u53e3\u8bbe\u7f6e",
  saved: "\u5df2\u4fdd\u5b58",
  botStopped: "\u5fae\u4fe1\u667a\u80fd\u4f53\u672a\u542f\u52a8",
  botStoppedHelp: "\u672c\u5730\u8c03\u8bd5\u53ef\u8fd0\u884c",
  botStoppedSuffix: "\u540e\u5237\u65b0\u72b6\u6001\u3002",
  botStarting: "\u5fae\u4fe1\u667a\u80fd\u4f53\u6b63\u5728\u542f\u52a8\uff0c\u8bf7\u7a0d\u540e\u5237\u65b0\u3002",
  botScan: "\u4f7f\u7528\u5fae\u4fe1\u626b\u7801\u767b\u5f55\u8001\u5e08\u667a\u80fd\u4f53",
  botScanHelp: "\u767b\u5f55\u540e\uff0c\u7528\u53e6\u4e00\u5fae\u4fe1\u5411\u8be5\u8d26\u53f7\u53d1\u9001\u201c\u7ed1\u5b9a\u201d\uff0c\u5373\u53ef\u63a5\u5165\u5f53\u524d\u6d4b\u8bd5\u8d26\u53f7\u3002",
  botOnline: "\u5fae\u4fe1\u667a\u80fd\u4f53\u5728\u7ebf",
  botCurrent: "\u5f53\u524d\u767b\u5f55\u5fae\u4fe1\u53f7",
  botError: "\u667a\u80fd\u4f53\u5f02\u5e38",
  unknown: "\u672a\u77e5\u9519\u8bef",
};

export function SettingsClient({
  initialSettings,
  initialBotStatus,
}: {
  initialSettings: AiSettingsForm;
  initialBotStatus: BotStatus;
}) {
  const [settings, setSettings] = useState<AiSettingsForm>(initialSettings);
  const [botStatus, setBotStatus] = useState<BotStatus>(initialBotStatus);
  const [apiKeyTouched, setApiKeyTouched] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refreshSettings() {
    const [result, botResult] = await Promise.all([
      getAiProviderSettings(),
      getWechatBotStatus(),
    ]);

    setSettings(result as AiSettingsForm);
    setBotStatus(botResult as BotStatus);
    setApiKeyTouched(false);
  }

  function saveSettings() {
    startTransition(async () => {
      const payload: Partial<AiSettingsForm> = {
        provider: settings.provider,
        baseURL: settings.baseURL,
        model: settings.model,
        teacherModel: settings.teacherModel,
        enabled: settings.enabled,
      };

      if (apiKeyTouched) {
        payload.apiKey = settings.apiKey;
      }

      const updated = await updateAiProviderSettings(payload);
      setSettings(updated as AiSettingsForm);
      setApiKeyTouched(false);
      setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    });
  }

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_right,rgba(124,92,250,0.10),transparent_18%),#fcfbff] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader title={copy.title} description={copy.description} />
          <Link
            className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[#ece7f8] bg-white px-4 text-sm font-semibold text-[#5f6983] transition hover:bg-[#faf8ff]"
            href={`/${mockUser.preferredExam}/dashboard`}
          >
            {copy.back}
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-5">
            <Card className="bg-white/92">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1d1730]">
                  <Settings2 className="h-5 w-5 text-[#6d53ea]" />
                  {copy.account}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-[#667085]">
                <label className="block space-y-2">
                  <span>{copy.userId}</span>
                  <Input value={mockUser.id} readOnly />
                </label>
                <label className="block space-y-2">
                  <span>{copy.currentExam}</span>
                  <Input value={mockUser.preferredExam.toUpperCase()} readOnly />
                </label>
                <label className="block space-y-2">
                  <span>{copy.wechatBinding}</span>
                  <Input
                    value={
                      botStatus.userName
                        ? `${copy.loggedIn}: ${botStatus.userName}`
                        : copy.unbound
                    }
                    readOnly
                  />
                </label>
              </CardContent>
            </Card>

            <Card className="bg-white/92">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1d1730]">
                  <Smartphone className="h-5 w-5 text-[#6d53ea]" />
                  {copy.wechatAgent}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-[#667085]">
                <BotStatusPanel botStatus={botStatus} />
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-[13px] border border-[#ece7f8] bg-white px-3 text-sm font-semibold text-[#5f6983] transition hover:bg-[#faf8ff]"
                  onClick={() => void refreshSettings()}
                  type="button"
                >
                  <RefreshCw className="h-4 w-4" />
                  {copy.refresh}
                </button>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-5">
            <Card className="bg-white/92">
              <CardHeader>
                <CardTitle className="text-[#1d1730]">AI Provider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-[#667085]">
                <label className="block space-y-2">
                  <span>{copy.providerType}</span>
                  <Input value={settings.provider} readOnly />
                </label>
                <label className="block space-y-2">
                  <span>Responses Base URL</span>
                  <Input
                    value={settings.baseURL}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, baseURL: event.target.value }))
                    }
                    placeholder="https://api.openai.com/v1"
                  />
                </label>
                <label className="block space-y-2">
                  <span>API Key</span>
                  <Input
                    value={settings.apiKey}
                    onChange={(event) => {
                      setApiKeyTouched(true);
                      setSettings((current) => ({ ...current, apiKey: event.target.value }));
                    }}
                    placeholder="sk-..."
                    type="password"
                  />
                  <span className="block text-xs leading-5 text-[#8a94aa]">{copy.apiKeyHelp}</span>
                </label>
                <label className="flex items-center gap-3 rounded-[14px] border border-[#ece7f8] px-4 py-3">
                  <input
                    checked={settings.enabled}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, enabled: event.target.checked }))
                    }
                    type="checkbox"
                  />
                  <span className="font-medium text-[#344054]">{copy.enabled}</span>
                </label>
              </CardContent>
            </Card>

            <Card className="bg-white/92">
              <CardHeader>
                <CardTitle className="text-[#1d1730]">{copy.modelConfig}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-[#667085]">
                <label className="block space-y-2">
                  <span>{copy.generalModel}</span>
                  <Input
                    value={settings.model}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, model: event.target.value }))
                    }
                    placeholder="gpt-5.2"
                  />
                </label>
                <label className="block space-y-2">
                  <span>{copy.teacherModel}</span>
                  <Input
                    value={settings.teacherModel}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, teacherModel: event.target.value }))
                    }
                    placeholder="gpt-5.2"
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button className="h-11 flex-1" disabled={isPending} onClick={saveSettings} type="button">
                    {isPending ? copy.saving : copy.save}
                  </Button>
                  {savedAt ? (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-[#267a55]">
                      <CheckCircle2 className="h-4 w-4" />
                      {copy.saved} {savedAt}
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}

function BotStatusPanel({ botStatus }: { botStatus: BotStatus }) {
  if (botStatus.status === "stopped") {
    return (
      <div className="rounded-[16px] border border-[#fed7d7] bg-[#fff5f5] px-4 py-3 text-[#b42318]">
        <div className="flex items-center gap-2 font-semibold">
          <WifiOff className="h-4 w-4" />
          {copy.botStopped}
        </div>
        <p className="mt-2 leading-6">
          {copy.botStoppedHelp} <code>npx tsx src/server/bots/start-bot.ts</code>{" "}
          {copy.botStoppedSuffix}
        </p>
      </div>
    );
  }

  if (botStatus.status === "starting") {
    return (
      <div className="rounded-[16px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-[#175cd3]">
        {copy.botStarting}
      </div>
    );
  }

  if (botStatus.status === "scan" && botStatus.qrcode) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[18px] border border-[#ece7f8] bg-[#faf8ff] px-4 py-5">
        <p className="font-semibold text-[#1d1730]">{copy.botScan}</p>
        <div className="rounded-[18px] bg-white p-4 shadow-sm ring-1 ring-[#ece7f8]">
          <QRCodeSVG value={botStatus.qrcode} size={200} />
        </div>
        <p className="text-xs leading-5 text-[#667085]">{copy.botScanHelp}</p>
      </div>
    );
  }

  if (botStatus.status === "logged_in") {
    return (
      <div className="rounded-[16px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[#067647]">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          {copy.botOnline}
        </div>
        <p className="mt-2">
          {copy.botCurrent}: {botStatus.userName}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[#fed7d7] bg-[#fff5f5] px-4 py-3 text-[#b42318]">
      {copy.botError}: {botStatus.error ?? copy.unknown}
    </div>
  );
}
