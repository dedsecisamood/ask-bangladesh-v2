import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SourceCard } from "./source-card";
import type { SourceSummary } from "@/lib/catalog";

const source: SourceSummary = {
  id: "synthetic-p42",
  title: "Synthetic official-title placeholder",
  kind: "synthetic",
  ownership: "pending",
  evidenceEligible: false,
  language: "en",
  documentType: "pdf",
  publishedAt: undefined,
  checkedAt: "2026-10-24T06:30:00Z",
  page: 7,
  passage: "Synthetic evidence: বাংলাদেশ — NID — ক্ষ যুক্তাক্ষর. ".repeat(12),
};
it("localizes metadata without translating evidence or changing source authority", () => {
  const { container } = render(<SourceCard locale="bn" source={source} />);
  expect(screen.getByText("ইংরেজি")).toBeVisible();
  expect(screen.getByText("PDF নথি")).toBeVisible();
  expect(screen.getByText("৭")).toBeVisible();
  expect(screen.getAllByText("অজানা").length).toBeGreaterThan(0);
  expect(container.querySelector("blockquote p:last-child")).toHaveAttribute(
    "lang",
    "en",
  );
  expect(container.querySelector("blockquote p:last-child")?.textContent).toBe(
    source.passage,
  );
  expect(screen.queryByRole("link")).toBeNull();
});
it("does not guess unknown evidence language from the interface", () => {
  const { container } = render(
    <SourceCard locale="en" source={{ ...source, language: undefined }} />,
  );
  expect(container.querySelector("blockquote p:last-child")).toHaveAttribute(
    "lang",
    "",
  );
  expect(screen.getAllByText("Unknown").length).toBeGreaterThan(0);
});
