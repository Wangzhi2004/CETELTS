import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-[12px] border bg-card px-3 text-sm placeholder:text-muted focus-visible:ring-4 focus-visible:ring-[var(--ring)]",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
