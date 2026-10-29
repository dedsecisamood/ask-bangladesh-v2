import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-2xl font-semibold leading-relaxed text-foreground sm:text-3xl",
        className,
      )}
      {...props}
    />
  );
}
