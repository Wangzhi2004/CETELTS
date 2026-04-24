import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[180px] w-full rounded-[20px] border bg-card px-4 py-3 text-sm placeholder:text-muted focus-visible:ring-4 focus-visible:ring-[var(--ring)]",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
