import { afterEach, expect, it, vi } from "vitest";
import { fetchPublishedDirectory } from "./adapter";
afterEach(() => vi.unstubAllGlobals());
it("explicit directory adapter preserves empty success and rejects failures", async () => {
  const fetcher = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: [],
      meta: {
        limit: 20,
        next_cursor: null,
        policy_revision: "p17-metadata-v1",
      },
      request_id: "17000000-0000-4000-8000-000000000001",
    }),
  });
  vi.stubGlobal("fetch", fetcher);
  expect((await fetchPublishedDirectory("services", "bn")).data).toEqual([]);
  expect(fetcher).toHaveBeenCalledWith(
    "/api/v1/services?locale=bn",
    expect.objectContaining({ credentials: "omit", cache: "no-store" }),
  );
  fetcher.mockResolvedValue({ ok: false });
  await expect(fetchPublishedDirectory("services", "bn")).rejects.toThrow(
    "unavailable",
  );
});
