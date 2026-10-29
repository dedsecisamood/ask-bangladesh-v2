import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DirectoryPage,
  ServiceDetail,
  CategoryPage,
  AgencyDetail,
  SourceDetail,
} from "./catalog-pages";
import { InformationPage } from "@/features/information/information-page";
import { FeedbackForm } from "@/features/information/feedback-form";
import { SourceCard } from "@/components/evidence/source-card";
import { ServiceCard } from "@/components/catalog/service-card";
import RouteError from "@/app/[locale]/error";
import { catalog, categories } from "@/lib/catalog";
import { information } from "@/lib/information";
import { copyFor } from "@/lib/product-copy";
import type { Locale } from "@/lib/i18n/config";
vi.mock("next/navigation", () => ({ useParams: () => ({ locale: "en" }) }));

describe("directory interfaces", () => {
  it.each(["draft", "pending", "verified", "outdated", "unavailable"] as const)(
    "renders the supplied %s metadata status without conflating it with live guidance",
    (status) => {
      render(
        <ServiceCard
          locale="en"
          service={{ ...catalog.services[0], kind: "reviewed-backend", status }}
        />,
      );
      expect(
        screen.getByText(copyFor("en").verificationStatuses[status]),
      ).toBeVisible();
    },
  );
  it.each(["bn", "en"] as Locale[])(
    "searches and filters preparation topics in %s",
    (locale) => {
      const copy = copyFor(locale);
      render(<DirectoryPage locale={locale} kind="services" />);
      expect(screen.getAllByRole("article")).toHaveLength(8);
      fireEvent.change(screen.getByLabelText(copy.search), {
        target: { value: "PASSPORT" },
      });
      expect(screen.getAllByRole("article")).toHaveLength(1);
      expect(screen.getByRole("article")).toHaveTextContent(copy.preparation);
      fireEvent.change(screen.getByLabelText(copy.filter), {
        target: { value: "land" },
      });
      expect(screen.getByText(copy.noResults)).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: copy.clearFilters }));
      expect(screen.getAllByRole("article")).toHaveLength(8);
    },
  );
  it("lists all categories, deriving real preparation counts and safe links", () => {
    render(<DirectoryPage locale="en" kind="categories" />);
    expect(screen.getAllByRole("article")).toHaveLength(16);
    expect(
      screen.getByRole("link", { name: "National Identity Card" }),
    ).toHaveAttribute("href", "/en/categories/identity");
  });
  it.each(["agencies", "sources"] as const)(
    "shows an honest empty %s directory",
    (kind) => {
      render(<DirectoryPage locale="en" kind={kind} />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        "No verified",
      );
      expect(screen.queryByRole("article")).not.toBeInTheDocument();
    },
  );
  it("shows no matching topics in an empty category", () => {
    render(
      <CategoryPage
        locale="en"
        category={categories.find((category) => category.slug === "health")!}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "0 preparation topics",
    );
    expect(screen.getByText("No matching preparation topics.")).toBeVisible();
  });
  it.each([false, true])(
    "withholds all unverified procedures in service/guide mode %s",
    (guide) => {
      render(
        <ServiceDetail
          locale="en"
          service={catalog.services[0]}
          guide={guide}
        />,
      );
      expect(
        screen.getByRole("heading", {
          name: "Verified instructions are not available yet.",
        }),
      ).toBeVisible();
      expect(screen.getByRole("heading", { name: "Fees" })).toBeVisible();
      expect(
        screen.getByRole("link", { name: "Official Sources" }),
      ).toHaveAttribute("href", "/en/sources");
      expect(
        screen.getByText("Agency relationship has not been verified."),
      ).toBeVisible();
    },
  );
  it("supports missing agency metadata without inventing official websites", () => {
    render(
      <AgencyDetail
        locale="en"
        agency={{
          slug: "unit-only",
          name: { bn: "পরীক্ষার নমুনা", en: "Unit-only fictional agency" },
          status: "unavailable",
          sourceIds: [],
        }}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Unit-only",
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
describe("source and information contracts", () => {
  it("labels unknown dates without inventing pages or links in source details", () => {
    render(
      <SourceDetail
        locale="en"
        source={{
          id: "unit-only",
          title: "Unit-only source",
          kind: "synthetic",
          ownership: "pending",
          evidenceEligible: false,
        }}
      />,
    );
    expect(
      screen.getByText("Synthetic example · Not an official source"),
    ).toBeVisible();
    expect(screen.getByText("Published")).toBeVisible();
    expect(screen.getAllByText("Unknown").length).toBeGreaterThan(0);
    expect(screen.queryByText("PDF page")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open original source" }),
    ).not.toBeInTheDocument();
  });
  it("uses only supplied locators and dates with a reviewed backend link", () => {
    render(
      <SourceCard
        locale="en"
        source={{
          id: "unit-only",
          title: "Unit test fixture",
          kind: "reviewed-backend",
          ownership: "verified",
          evidenceEligible: true,
          originalUrl: "https://example.org/document.pdf",
          agency: "Unit fixture",
          publishedAt: "2020-01-02",
          checkedAt: "2020-02-01",
          effectiveAt: "2020-02-02",
          version: "fixture-v1",
          page: 7,
          passage: "Synthetic unit-only passage",
          documentType: "pdf",
          language: "en",
          category: "Unit category",
        }}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Open original source" }),
    ).toHaveAttribute("href", "https://example.org/document.pdf");
    expect(screen.getByText("7")).toBeVisible();
    expect(screen.getByText("1 Feb 2020")).toBeVisible();
  });
  it.each(["bn", "en"] as Locale[])(
    "provides complete %s information content and explicit draft policies",
    (locale) => {
      for (const page of Object.keys(
        information,
      ) as (keyof typeof information)[]) {
        const result = render(<InformationPage locale={locale} page={page} />);
        expect(
          within(result.container).getByRole("heading", { level: 1 }),
        ).toBeVisible();
        if (page === "privacy" || page === "terms")
          expect(
            within(result.container).getByText(copyFor(locale).draft),
          ).toBeVisible();
        if (page === "status")
          expect(
            within(result.container).getAllByText(copyFor(locale).notConnected),
          ).toHaveLength(3);
        result.unmount();
      }
    },
  );
  it("validates feedback locally and never claims delivery", () => {
    render(<FeedbackForm locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Check demo form" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a category");
    fireEvent.change(screen.getByLabelText("Feedback category"), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "x".repeat(2001) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check demo form" }));
    expect(screen.getByRole("alert")).toHaveTextContent("2,000");
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Synthetic interface issue" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check demo form" }));
    expect(screen.getByRole("status")).toHaveTextContent("NOT submitted");
    expect(screen.queryByLabelText(/email|contact/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear form" }));
    expect(screen.getByLabelText("Description")).toHaveValue("");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it("sanitizes route failures and offers a real retry", () => {
    const retry = vi.fn();
    render(
      <RouteError error={new Error("private-secret-detail")} retry={retry} />,
    );
    expect(screen.queryByText("private-secret-detail")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
