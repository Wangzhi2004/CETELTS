"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand } from "@/components/shared/brand";
import { cn } from "@/lib/utils";

const sectionLabels: Record<number, string> = {
  1: "训练模块",
  6: "数据归档",
};

export function SidebarNav({
  items,
  basePath,
}: {
  items: Array<{
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
    absolute?: boolean;
  }>;
  basePath?: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-[calc(100vh-32px)] w-[168px] shrink-0 overflow-hidden rounded-[20px] border border-[#ece7f8] bg-white shadow-[0_8px_24px_rgba(124,92,250,0.06)] lg:flex lg:flex-col dark:border-[#2a2739] dark:bg-[#181722] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
      <div className="border-b border-[#f0ebfa] px-5 py-6 dark:border-[#2a2739]">
        <Brand />
      </div>
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-6">
        {items.map((item, index) => {
          const href = item.absolute ? item.href : `${basePath}/${item.href}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = item.icon;
          const sectionLabel = sectionLabels[index];

          return (
            <div key={item.label}>
              {sectionLabel ? (
                <div className="px-3 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#9aa3b6] first:pt-0 dark:text-[#6b7280]">
                  {sectionLabel}
                </div>
              ) : null}
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[14px] font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-[#7c5cfa] to-[#8b63ff] text-white shadow-[0_6px_16px_rgba(124,92,250,0.18)] dark:from-[#9580ff] dark:to-[#8068ff] dark:shadow-[0_6px_16px_rgba(149,128,255,0.25)]"
                    : "text-[#5d6881] hover:bg-[#f6f2ff] dark:text-[#8b91a3] dark:hover:bg-[rgba(149,128,255,0.08)]",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-[#f0ebfa] px-4 py-4 dark:border-[#2a2739]">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[14px] font-medium text-[#5d6881] transition hover:bg-[#f6f2ff] dark:text-[#8b91a3] dark:hover:bg-[rgba(149,128,255,0.08)]"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f6f2ff] text-[#7c5cfa] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </span>
          设置
        </Link>
      </div>
    </aside>
  );
}
