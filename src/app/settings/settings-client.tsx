"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, useTransition } from "react";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Check,
  KeyRound,
  Loader2,
  Save,
  Shield,
  User,
} from "lucide-react";

import {
  changePassword,
  getUserSettings,
  saveUserSettings,
  updateUserProfile,
  UserSettings,
} from "@/app/actions/settings";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsClient() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isSaving, startSavingTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isChangingPassword, startPasswordTransition] = useTransition();

  useEffect(() => {
    getUserSettings().then(setSettings);
  }, []);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage("");

    startSavingTransition(async () => {
      const result = await saveUserSettings(settings!);
      if (result.error) {
        setSaveMessage(result.error);
      } else {
        setSaveMessage("保存成功");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    });
  }

  function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage("");

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage("两次密码不一致");
      return;
    }

    startPasswordTransition(async () => {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });
      if (result.error) {
        setPasswordMessage(result.error);
      } else {
        setPasswordMessage("密码修改成功");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPasswordMessage(""), 3000);
      }
    });
  }

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7c5cfa]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(124,92,250,0.10),transparent_18%),#fcfbff] dark:bg-[radial-gradient(circle_at_top_right,rgba(149,128,255,0.06),transparent_18%),#0f0e17]">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#ece7f8] bg-white text-[#6d53ea] transition hover:bg-[#f6f2ff] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#9580ff]"
              href="/cet6/dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#1d1730] dark:text-[#edeef1]">
                设置
              </h1>
              <p className="mt-1 text-sm text-[#627089] dark:text-[#8b91a3]">
                管理你的账户、学习目标和 AI 配置
              </p>
            </div>
          </div>
          <Brand />
        </div>

        <form className="space-y-6" onSubmit={handleSave}>
          <SettingsSection icon={<User className="h-5 w-5" />} title="个人信息">
            <SettingsField label="昵称">
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </SettingsField>
            <SettingsField label="邮箱（不可修改）">
              <Input disabled value={settings.email} />
            </SettingsField>
            <SettingsField label="时区">
              <Input
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              />
            </SettingsField>
          </SettingsSection>

          <SettingsSection icon={<BookOpen className="h-5 w-5" />} title="学习目标">
            <SettingsField label="备考类型">
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    settings.preferredExam === "cet6"
                      ? "border-[#7c5cfa] bg-[#f4edff] text-[#6d53ea] dark:border-[#9580ff] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]"
                      : "border-[#ece7f8] bg-white text-[#647089] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#8b91a3]"
                  }`}
                  onClick={() => setSettings({ ...settings, preferredExam: "cet6" })}
                  type="button"
                >
                  CET-6 六级
                </button>
                <button
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    settings.preferredExam === "ielts"
                      ? "border-[#7c5cfa] bg-[#f4edff] text-[#6d53ea] dark:border-[#9580ff] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]"
                      : "border-[#ece7f8] bg-white text-[#647089] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#8b91a3]"
                  }`}
                  onClick={() => setSettings({ ...settings, preferredExam: "ielts" })}
                  type="button"
                >
                  IELTS 雅思
                </button>
              </div>
            </SettingsField>
            <SettingsField label="目标分数">
              <Input
                type="number"
                value={settings.targetScore}
                onChange={(e) =>
                  setSettings({ ...settings, targetScore: parseInt(e.target.value) || 0 })
                }
              />
            </SettingsField>
            <SettingsField label="考试日期">
              <Input
                type="date"
                value={settings.examDate}
                onChange={(e) => setSettings({ ...settings, examDate: e.target.value })}
              />
            </SettingsField>
            <SettingsField label="每日学习时长（分钟）">
              <Input
                type="number"
                value={settings.dailyMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, dailyMinutes: parseInt(e.target.value) || 0 })
                }
              />
            </SettingsField>
          </SettingsSection>

          <SettingsSection icon={<Brain className="h-5 w-5" />} title="AI 配置">
            <p className="text-xs text-[#7a84a0] dark:text-[#8b91a3]">
              配置 AI 老师使用的模型和 API 密钥。默认使用通义千问（DashScope）。
            </p>
            <SettingsField label="AI 服务商">
              <Input
                value={settings.aiProvider}
                onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
                placeholder="dashscope"
              />
            </SettingsField>
            <SettingsField label="模型名称">
              <Input
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                placeholder="glm-5"
              />
            </SettingsField>
            <SettingsField label="API Key">
              <Input
                type="password"
                value={settings.aiApiKey}
                onChange={(e) => setSettings({ ...settings, aiApiKey: e.target.value })}
                placeholder="sk-..."
              />
            </SettingsField>
          </SettingsSection>

          <div className="flex items-center justify-between">
            {saveMessage && (
              <span
                className={`text-sm font-medium ${
                  saveMessage.includes("成功") ? "text-[#16a34a]" : "text-[#dc2626]"
                }`}
              >
                {saveMessage}
              </span>
            )}
            <Button
              className="ml-auto h-12 justify-between px-6"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "保存中…" : "保存设置"}
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <form className="mt-8" onSubmit={handleChangePassword}>
          <SettingsSection icon={<Shield className="h-5 w-5" />} title="修改密码">
            <SettingsField label="当前密码">
              <Input
                autoComplete="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </SettingsField>
            <SettingsField label="新密码">
              <Input
                autoComplete="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </SettingsField>
            <SettingsField label="确认新密码">
              <Input
                autoComplete="new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </SettingsField>

            <div className="flex items-center justify-between">
              {passwordMessage && (
                <span
                  className={`text-sm font-medium ${
                    passwordMessage.includes("成功") ? "text-[#16a34a]" : "text-[#dc2626]"
                  }`}
                >
                  {passwordMessage}
                </span>
              )}
              <Button
                className="ml-auto h-11 justify-between px-5"
                disabled={isChangingPassword}
                type="submit"
                variant="outline"
              >
                {isChangingPassword ? "修改中…" : "修改密码"}
                <KeyRound className="h-4 w-4" />
              </Button>
            </div>
          </SettingsSection>
        </form>
      </div>
    </div>
  );
}

function SettingsSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#ebe3fb] bg-white p-6 shadow-[0_8px_24px_rgba(124,92,250,0.06)] dark:border-[#2a2739] dark:bg-[#181722] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
      <div className="mb-5 flex items-center gap-3 text-[#6d53ea] dark:text-[#9580ff]">
        {icon}
        <h2 className="text-lg font-black tracking-tight text-[#1d1730] dark:text-[#edeef1]">
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SettingsField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[#344054] dark:text-[#c5c8d4]">{label}</span>
      {children}
    </label>
  );
}
