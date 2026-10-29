// Adapted from shadcn/ui (MIT): https://ui.shadcn.com/docs/components/radix/skeleton
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-muted motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
