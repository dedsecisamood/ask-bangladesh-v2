import Link from "next/link";
import Image from "next/image";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { ShellDictionary } from "@/lib/i18n/dictionaries";

export function Brand({
  locale,
  brand,
  homeLabel,
}: {
  locale: Locale;
  brand: ShellDictionary["brand"];
  homeLabel: string;
}) {
  return (
    <Link href={localePath(locale)} prefetch={false} className="brand">
      <span className="brand-mark" aria-hidden="true">
        <Image
          src="/ask-bangladesh-logo.png"
          alt=""
          width={1312}
          height={1199}
          sizes="56px"
          className="brand-logo"
        />
      </span>
      <span className="brand-copy">
        <span className="brand-name" lang="en">
          {brand.name}
        </span>
        <span className="brand-tagline">{brand.tagline}</span>
      </span>
      <span className="sr-only"> — {homeLabel}</span>
    </Link>
  );
}
