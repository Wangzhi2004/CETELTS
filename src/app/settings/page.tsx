import { getAiProviderSettings, getWechatBotStatus } from "@/app/actions/settings";
import { SettingsClient } from "@/app/settings/settings-client";

export default async function SettingsPage() {
  const [settings, botStatus] = await Promise.all([
    getAiProviderSettings(),
    getWechatBotStatus(),
  ]);

  return <SettingsClient initialBotStatus={botStatus} initialSettings={settings} />;
}
