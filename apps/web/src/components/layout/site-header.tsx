import { Brand } from "./brand";
import { HeaderNavigation } from "./header-navigation";
import { Container } from "@/components/ui/container";
import type { Locale } from "@/lib/i18n/config";
import type { ShellDictionary } from "@/lib/i18n/dictionaries";

export function SiteHeader({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: ShellDictionary;
}) {
  return (
    <header className="site-header">
      <Container className="header-inner">
        <Brand
          locale={locale}
          brand={dictionary.brand}
          homeLabel={dictionary.navigation.home}
        />
        <HeaderNavigation
          locale={locale}
          copy={{
            navigation: dictionary.navigation,
            mobileMenu: dictionary.mobileMenu,
            language: dictionary.language,
          }}
        />
      </Container>
    </header>
  );
}
