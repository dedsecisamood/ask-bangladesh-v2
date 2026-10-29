import { afterEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/directory/repository", () => ({ readDirectory: vi.fn() }));
import { PublishedSearch } from "./published-search";
import { OfficialLink } from "./published-pages";
const item = {
  id: "19000000-0000-4000-8000-000000000001",
  slug: "test",
  name: "Synthetic service",
  locale: "en" as const,
  coverage: "metadata_only" as const,
};
afterEach(() => vi.unstubAllGlobals());
it("published search uses a POST body, accessible status and honest failures", async () => {
  const fetcher = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: [item],
      meta: {
        limit: 20,
        next_cursor: null,
        policy_revision: "p20-metadata-v1",
      },
      request_id: item.id,
    }),
  });
  vi.stubGlobal("fetch", fetcher);
  render(
    <PublishedSearch locale="en" initial={[]} categories={[]} agencies={[]} />,
  );
  expect(screen.getByText(/No published services found/)).toBeVisible();
  fireEvent.change(
    screen.getByRole("textbox", { name: "Service name or familiar term" }),
    { target: { value: "Passport renew" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  await waitFor(() =>
    expect(
      screen.getByRole("link", { name: "Synthetic service" }),
    ).toHaveAttribute("href", "/en/services/test"),
  );
  expect(fetcher).toHaveBeenCalledWith(
    "/api/v1/search",
    expect.objectContaining({
      method: "POST",
      credentials: "omit",
      body: expect.stringContaining("Passport renew"),
    }),
  );
  fetcher.mockResolvedValue({ ok: false });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Information could not be loaded",
    ),
  );
  expect(screen.queryByRole("link", { name: "Synthetic service" })).toBeNull();
});
it("official links preserve exact reviewed destinations and reject unsafe schemes", () => {
  const source = {
    id: item.id,
    name: "registry.example.com",
    locale: "en" as const,
    coverage: "metadata_only" as const,
    agency_id: item.id,
    url: "https://registry.example.com/exact/?type=nid",
    evidence_eligible: false as const,
    ownership_verified_at: "2026-10-20T00:00:00Z",
  };
  const { rerender } = render(<OfficialLink item={source} locale="en" />);
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", source.url);
  expect(link).toHaveAttribute("rel", "noopener noreferrer external");
  expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
  rerender(
    <OfficialLink
      item={{ ...source, url: "javascript:alert(1)" }}
      locale="en"
    />,
  );
  expect(screen.queryByRole("link")).toBeNull();
});
