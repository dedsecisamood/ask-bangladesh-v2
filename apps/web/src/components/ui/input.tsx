// Adapted from shadcn/ui (MIT): https://ui.shadcn.com/docs/components/radix/input
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type = "text",
  ...props
}: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive",
        className,
      )}
      {...props}
    />
  );
}
