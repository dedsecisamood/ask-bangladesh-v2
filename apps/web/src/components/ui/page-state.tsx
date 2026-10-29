import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Container } from "./container";
import { Skeleton } from "./skeleton";

export function PageState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Container>
      <section className="state-panel" aria-labelledby="state-title">
        <Info className="size-8 text-primary" aria-hidden="true" />
        <h1 id="state-title" className="page-heading">
          {title}
        </h1>
        <p className="text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-3">{children}</div>
      </section>
    </Container>
  );
}
export function PageLoading({ label }: { label: string }) {
  return (
    <Container>
      <div className="state-panel" role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        <div aria-hidden="true" className="space-y-5">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      </div>
    </Container>
  );
}
