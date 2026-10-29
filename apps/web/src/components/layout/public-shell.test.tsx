import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicShell } from "./public-shell";
import { PageLoading, PageState } from "@/components/ui/page-state";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { locales, localePath } from "@/lib/i18n/config";

const route = vi.hoisted(() => ({ pathname: "/bn" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
beforeEach(() => {
  route.pathname = "/bn";
});

describe("public application shell", () => {
  it.each(locales)(
    "renders %s landmarks, translated navigation and bilingual independence",
    (locale) => {
      route.pathname = localePath(locale);
      const dictionary = getDictionary(locale);
      render(
        <PublicShell locale={locale} dictionary={dictionary}>
          <h1>Shell content</h1>
        </PublicShell>,
      );
      expect(screen.getByRole("banner")).toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
      expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
      expect(
        screen.getByRole("link", { name: dictionary.skipLink }),
      ).toHaveAttribute("href", "#main-content");
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Shell content",
      );
      const nav = screen.getByRole("navigation", {
        name: dictionary.navigation.label,
      });
      expect(
        within(nav).getByRole("link", { name: dictionary.navigation.ask }),
      ).toHaveAttribute("href", localePath(locale, "ask"));
      const footer = screen.getByRole("contentinfo");
      for (const disclosureLocale of locales) {
        expect(
          within(footer).getByText(
            getDictionary(disclosureLocale).footer.independentDisclosure,
          ),
        ).toHaveAttribute("lang", disclosureLocale);
      }
      for (const page of [
        "about",
        "howItWorks",
        "trust",
        "feedback",
        "sources",
        "privacy",
        "terms",
        "accessibility",
      ] as const) {
        expect(
          within(footer).getByRole("link", {
            name: dictionary.pages[page].title,
          }),
        ).toHaveAttribute("href", localePath(locale, page));
      }
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    },
  );

  it("opens a labelled mobile navigation dialog and returns focus after Escape", async () => {
    const dictionary = getDictionary("bn");
    render(
      <PublicShell locale="bn" dictionary={dictionary}>
        <p>Content</p>
      </PublicShell>,
    );
    const trigger = screen.getByRole("button", {
      name: dictionary.mobileMenu.open,
    });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", {
      name: dictionary.mobileMenu.title,
    });
    expect(dialog).toHaveAccessibleDescription(
      dictionary.mobileMenu.description,
    );
    expect(
      within(dialog).getByRole("link", {
        name: dictionary.navigation.services,
      }),
    ).toHaveAttribute("href", "/bn/services");
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    fireEvent.click(trigger);
    const reopened = await screen.findByRole("dialog", {
      name: dictionary.mobileMenu.title,
    });
    const serviceLink = within(reopened).getByRole("link", {
      name: dictionary.navigation.services,
    });
    serviceLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(serviceLink);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it.each(locales)(
    "offers a resource-preserving language choice from %s",
    async (locale) => {
      route.pathname = localePath(locale, "services");
      const dictionary = getDictionary(locale);
      render(
        <PublicShell locale={locale} dictionary={dictionary}>
          <p>Content</p>
        </PublicShell>,
      );
      const trigger = screen.getByRole("button", {
        name: new RegExp(dictionary.language.label),
      });
      trigger.focus();
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
      const menu = await screen.findByRole("menu");
      for (const target of locales) {
        expect(
          within(menu).getByRole("menuitem", {
            name: new RegExp(dictionary.language[target]),
          }),
        ).toHaveAttribute("href", localePath(target, "services"));
      }
      fireEvent.keyDown(menu, { key: "Escape" });
      await waitFor(() => expect(trigger).toHaveFocus());
    },
  );

  it("exposes a concise loading status and a readable generic error state", () => {
    const dictionary = getDictionary("bn");
    render(
      <>
        <PageLoading label={dictionary.states.loading} />
        <PageState
          title={dictionary.states.errorTitle}
          description={dictionary.states.errorDescription}
        />
      </>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      dictionary.states.loading,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      dictionary.states.errorTitle,
    );
  });
});
