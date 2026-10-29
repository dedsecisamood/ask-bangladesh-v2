"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageState } from "@/components/ui/page-state";
import { Button } from "@/components/ui/button";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default function LocalizedNotFound() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dictionary = getDictionary(locale);
  return (
    <PageState
      title={dictionary.states.notFoundTitle}
      description={dictionary.states.notFoundDescription}
    >
      <Button asChild>
        <Link href={localePath(locale)}>{dictionary.preparation.backHome}</Link>
      </Button>
    </PageState>
  );
}
