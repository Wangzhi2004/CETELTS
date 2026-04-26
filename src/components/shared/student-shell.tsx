"use client";

import Link from "next/link";
import { Bell, CalendarDays, Flame, UserRound } from "lucide-react";

import { SidebarNav } from "@/components/shared/sidebar-nav";
import { studentNavigation } from "@/config/navigation";
import { examConfigs } from "@/config/exams";
import { mockUser } from "@/mocks/student-data";
import { cn } from "@/lib/utils";

export function StudentShell({
  exam,
  children,
}: {
  exam: "cet6" | "ielts";
  children: React.ReactNode;
}) {
  const config = examConfigs[exam];
  const mobileTabs = studentNavigation.slice(0, 5);

  return (
    <div className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(124,92,250,0.10),transparent_18%),#fcfbff] px-3 py-3 sm:px-4 lg:px-4 dark:bg-[radial-gradient(circle_at_top_right,rgba(149,128,255,0.06),transparent_18%),#0f0e17]">
      <div className="mx-auto flex h-full min-h-0 max-w-[1510px] gap-4">
        <SidebarNav items={studentNavigation} basePath={`/${exam}`} />
        <main className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-[#ece7f8] bg-white shadow-[0_12px_50px_rgba(124,92,250,0.08)] dark:border-[#2a2739] dark:bg-[#181722] dark:shadow-[0_12px_50px_rgba(0,0,0,0.35)]">
          <header className="shrink-0 flex items-center justify-between border-b border-[#f2eef9] px-4 py-1.5 sm:px-6 dark:border-[#2a2739]">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="text-sm font-bold text-[#171717] dark:text-[#edeef1]">提分教练</div>
              <div className="rounded-full bg-[#f4f0ff] px-2.5 py-1 text-xs font-medium text-[#7c5cfa] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
                {config.shortLabel}
              </div>
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#ede8f7] bg-white text-[#56627c] dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#8b91a3]" title="学习日历">
                <CalendarDays className="h-4 w-4" />
              </button>
              <div className="inline-flex items-center gap-2 rounded-[10px] px-2 py-1 text-sm text-[#56627c] dark:text-[#8b91a3]">
                <Flame className="h-4 w-4 text-[#ff9f43]" />
                <span className="font-medium">连续 7 天</span>
              </div>
              <div className="hidden items-center gap-2 rounded-[12px] border border-[#ede8f7] px-1.5 py-1 sm:inline-flex dark:border-[#2a2739]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2ff] text-[#4c5c8a] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
                  <UserRound className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-[#222] dark:text-[#edeef1]">{mockUser.name}</span>
              </div>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#ede8f7] bg-white text-[#56627c] lg:hidden dark:border-[#2a2739] dark:bg-[#1c1a28] dark:text-[#8b91a3]" title="通知">
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-auto px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-4">
            {children}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-20 rounded-[24px] border border-[#ebe5f5] bg-white/95 p-2 shadow-[0_12px_40px_rgba(124,92,250,0.12)] backdrop-blur lg:hidden dark:border-[#2a2739] dark:bg-[#181722]/95 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div className="grid grid-cols-5 gap-1">
          {mobileTabs.map((item, index) => {
            const href = item.absolute ? item.href : `/${exam}/${item.href}`;
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[16px] px-2 py-2 text-[11px] font-medium",
                  index === 0 ? "text-[#7c5cfa]" : "text-[#73809a]",
                )}
              >
                <Icon className={cn("h-5 w-5", index === 0 && "fill-current")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
