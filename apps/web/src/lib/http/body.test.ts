// @vitest-environment node
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readBodyText } from "./body";
const streamRequest = (
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
) =>
  new Request("http://localhost/test", {
    method: "POST",
    body: stream,
    duplex: "half",
    signal,
  } as RequestInit);
it("audit body reader bounds complete, malformed UTF-8 and chunked oversized bodies", async () => {
  expect(
    await readBodyText(
      new Request("http://localhost", { method: "POST", body: "বাংলা" }),
    ),
  ).toBe("বাংলা");
  await expect(
    readBodyText(
      new Request("http://localhost", {
        method: "POST",
        body: new Uint8Array([255]),
      }),
    ),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    readBodyText(
      new Request("http://localhost", {
        method: "POST",
        body: "x".repeat(4097),
      }),
    ),
  ).rejects.toMatchObject({ status: 413 });
});
it("audit body reader rejects never-ending input without awaiting stalled cancel", async () => {
  const cancel = vi.fn(() => new Promise<void>(() => {}));
  await expect(
    readBodyText(streamRequest(new ReadableStream({ cancel })), 4096, 15),
  ).rejects.toMatchObject({ status: 408 });
  expect(cancel).toHaveBeenCalledOnce();
});
it("audit body reader honors cancellation and clears a pending read", async () => {
  const controller = new AbortController();
  const read = readBodyText(
    streamRequest(new ReadableStream({}), controller.signal),
  );
  controller.abort();
  await expect(read).rejects.toMatchObject({ status: 408 });
});
