import { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  hint,
  trend,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  trend?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="bg-white/90">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm text-muted">{label}</p>
            <p className="font-[800] text-3xl tracking-tight">{value}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>{hint}</span>
              {trend ? <span className="text-success">{trend}</span> : null}
            </div>
          </div>
          {icon ? <div className="text-primary">{icon}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
