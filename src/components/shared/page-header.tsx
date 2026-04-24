import { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-border bg-card/85 p-6 shadow-[var(--shadow-soft)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        {eyebrow ? <Badge>{eyebrow}</Badge> : null}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="max-w-3xl text-sm text-muted sm:text-base">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
