import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CETELTS | 六级 / 雅思 AI 提分操作系统",
  description: "围绕今日任务、真题训练、AI 反馈、错题沉淀和模考冲刺构建的应试训练网站。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
