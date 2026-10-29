// Adapted from shadcn/ui (MIT): https://ui.shadcn.com/docs/components/radix/alert
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert"
      className={cn(
        "rounded-xl border border-border bg-muted p-4 text-sm leading-relaxed text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("mb-1 font-semibold leading-relaxed", className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}
