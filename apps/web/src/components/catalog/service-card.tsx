import Link from "next/link";
import {
  ArrowUpRight,
  Fingerprint,
  Plane,
  MapPinned,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Category, Service } from "@/lib/catalog";
import { findCategory } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n/config";
import { copyFor } from "@/lib/product-copy";

export function CategoryIcon({ kind }: { kind: Category["icon"] }) {
  const Icon =
    kind === "identity"
      ? Fingerprint
      : kind === "travel"
        ? Plane
        : kind === "land"
          ? MapPinned
          : Layers;
  return <Icon aria-hidden="true" className="size-6" />;
}
export function ServiceCard({
  service,
  locale,
  prominent = false,
  headingLevel = 3,
}: {
  service: Service;
  locale: Locale;
  prominent?: boolean;
  headingLevel?: 2 | 3;
}) {
  const copy = copyFor(locale);
  const category = findCategory(service.category);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article
      className={`service-card ${prominent ? "service-card-priority" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="topic-icon">
          <CategoryIcon kind={category?.icon ?? "other"} />
        </span>
        <ArrowUpRight
          className="size-5 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <Heading className="mt-5 text-xl font-semibold">
        <Link href={`/${locale}/services/${service.slug}`} prefetch={false}>
          {service.name[locale]}
        </Link>
      </Heading>
      <p className="mt-1 text-sm text-muted-foreground">
        {category?.name[locale]}
      </p>
      <Badge className="mt-4">
        {service.kind === "preparation-topic"
          ? copy.preparation
          : copy.verificationStatuses[service.status]}
      </Badge>
    </article>
  );
}
