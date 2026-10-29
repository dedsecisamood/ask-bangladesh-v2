// Adapted from shadcn/ui (MIT): https://ui.shadcn.com/docs/components/radix/badge
import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold leading-relaxed",
  {
    variants: {
      variant: {
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-muted-foreground",
        warning: "border-border bg-muted text-foreground",
      },
    },
    defaultVariants: { variant: "secondary" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
