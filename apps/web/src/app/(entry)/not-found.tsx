import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { PageState } from "@/components/ui/page-state";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default function NotFound() {
  const dictionary = getDictionary("bn");
  return (
    <PublicShell locale="bn" dictionary={dictionary}>
      <PageState
        title={dictionary.states.notFoundTitle}
        description={dictionary.states.notFoundDescription}
      >
        <Button asChild>
          <Link href="/bn">{dictionary.preparation.backHome}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/en" lang="en">
            English
          </Link>
        </Button>
      </PageState>
    </PublicShell>
  );
}
