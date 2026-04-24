"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand } from "@/components/shared/brand";
import { cn } from "@/lib/utils";

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
      <nav className="flex-1 space-y-2 px-4 py-8">
        {items.map((item, index) => {
          const href = item.absolute ? item.href : `${basePath}/${item.href}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = item.icon;

          return (
            <div key={item.label}>
              {index === 1 ? (
                <div className="px-4 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9aa3b6]">
                  执行页
                </div>
              ) : null}
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-[12px] px-4 py-2.5 text-[15px] font-medium transition-all",
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
      <div className="mt-auto px-5 py-5 text-sm text-[#7d85a0] dark:text-[#6b7280]">
        <Link href="/settings" className="inline-flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f6f2ff] text-[#7c5cfa] dark:bg-[rgba(149,128,255,0.12)] dark:text-[#9580ff]">
            ⚙
          </span>
          设置
        </Link>
      </div>
    </aside>
  );
}
