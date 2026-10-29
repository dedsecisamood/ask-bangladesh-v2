import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Separator({ className, ...props }: ComponentProps<"hr">) {
  return (
    <hr
      data-slot="separator"
      className={cn("m-0 w-full border-0 border-t border-border", className)}
      {...props}
    />
  );
}
