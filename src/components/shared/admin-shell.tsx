"use client";

import { SidebarNav } from "@/components/shared/sidebar-nav";
import { adminNavigation } from "@/config/navigation";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row">
        <SidebarNav items={adminNavigation} />
        <main className="flex-1 space-y-4">{children}</main>
      </div>
    </div>
  );
}
