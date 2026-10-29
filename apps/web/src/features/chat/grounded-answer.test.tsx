import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { retainTurns } from "@/lib/chat";
import { GroundedAnswer } from "./grounded-answer";
import {
  ConversationProvider,
  useConversation,
} from "../questions/conversation-provider";
import {
  answerPayloadSchema,
  type PublicAnswer,
} from "@/lib/answers/contracts";
const id = "35000000-0000-4000-8000-000000000001";
const unavailable: PublicAnswer = {
  ...answerPayloadSchema.parse({
    status: "abstained",
    language: "bn",
    blocks: [],
    citations: [],
    warnings: ["source_conflict"],
    reason_codes: ["source_conflict"],
  }),
  request_id: id,
};
it("important source-conflict warnings are visible and no fake links are added", () => {
  render(<GroundedAnswer answer={unavailable} locale="en" />);
  expect(screen.getByRole("alert")).toHaveTextContent("Sources conflict");
  expect(
    screen.queryByRole("link", { name: "Original official source" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Browse the service directory" }),
  ).toHaveAttribute("href", "/en/services");
});
it("P44 shows Banglish uncertainty with a correct language tag while retaining UI warnings", () => {
  render(
    <GroundedAnswer
      answer={{ ...unavailable, language: "banglish" }}
      locale="en"
    />,
  );
  expect(
    screen.getByText(
      "Utshogulote omil ache; dayittoprapto songsthar nishchitkoron dorkar.",
    ),
  ).toHaveAttribute("lang", "bn-Latn");
  expect(screen.getByRole("alert")).toHaveTextContent("Sources conflict");
});
it("renders supported steps, escaped metadata and exact page citations", () => {
  const a: PublicAnswer = {
    ...unavailable,
    status: "partial",
    language: "en",
    blocks: [
      {
        id: "c1",
        kind: "step",
        text: "Synthetic step only.",
        citation_ids: [id],
      },
    ],
    citations: [
      {
        id,
        source_id: id,
        document_id: id,
        document_version_id: id,
        passage_id: id,
        agency_id: id,
        agency_name: null,
        title: "Synthetic <img src=x onerror=alert(1)>",
        url: "https://synthetic.example.invalid/document.pdf",
        passage: "Synthetic evidence only.",
        content_hash: "a".repeat(64),
        passage_hash: "b".repeat(64),
        locator: {
          type: "pdf",
          page: 2,
          start: null,
          end: null,
          heading_path: [],
        },
        published_at: null,
        checked_at: "2026-10-23T00:00:00Z",
        reviewed_at: "2026-10-23T00:00:00Z",
        ownership_verified_at: "2026-10-23T00:00:00Z",
        effective_from: null,
        effective_to: null,
      },
    ],
  };
  const retained = retainTurns(
    Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      question: "q".repeat(2000),
      answer: {
        kind: "service" as const,
        language: "en" as const,
        shortAnswer: "",
        result: {
          ...a,
          blocks: a.blocks.map((b) => ({ ...b, text: "x".repeat(2000) })),
        },
      },
    })),
  );
  expect(retained).toHaveLength(2);
  const { container } = render(<GroundedAnswer answer={a} locale="en" />);
  expect(screen.getByText("Next step")).toBeVisible();
  expect(screen.getByText("Page: 2")).toBeVisible();
  expect(container.querySelector("img")).toBeNull();
  expect(
    screen.getByRole("link", { name: "Original official source" }),
  ).toHaveAttribute("href", a.citations[0].url);
  expect(
    screen.getByRole("link", { name: "View supporting source" }),
  ).toHaveAttribute("href", `#citation-${id}-${id}`);
});
function Controls() {
  const c = useConversation();
  return (
    <>
      <button
        onClick={() => {
          c.send("passport", "en");
          c.send("duplicate", "en");
        }}
      >
        send
      </button>
      <button onClick={() => c.send("What documents?", "en")}>follow</button>
      <button onClick={c.clear}>reset</button>
      <button onClick={c.stop}>stop</button>
      <output>
        {c.turns.length}:{c.status}
      </output>
    </>
  );
}
it("prevents same-tick duplicate sends and reset cancels delayed responses", async () => {
  const adapter = vi.fn().mockImplementation(
    ({ signal }: { signal: AbortSignal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(Error("cancelled")), {
          once: true,
        });
        void resolve;
      }),
  );
  render(
    <ConversationProvider adapter={adapter}>
      <Controls />
    </ConversationProvider>,
  );
  fireEvent.click(screen.getByText("send"));
  await waitFor(() => expect(adapter).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByText("reset"));
  expect(screen.getByRole("status")).toHaveTextContent("0:cleared");
  expect(adapter.mock.calls[0][0].signal.aborted).toBe(true);
});
it("history contains only user intent and idle expiry clears local memory", async () => {
  vi.useFakeTimers();
  try {
    const adapter = vi.fn().mockResolvedValue({
      kind: "service",
      language: "en",
      shortAnswer: "",
      result: unavailable,
    });
    render(
      <ConversationProvider mode="api" adapter={adapter}>
        <Controls />
      </ConversationProvider>,
    );
    await act(async () => {
      fireEvent.click(screen.getByText("send"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("follow"));
    });
    expect(adapter.mock.calls[1][0].history).toEqual([
      { role: "user", content: "passport" },
    ]);
    await act(async () => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });
    expect(screen.getByRole("status")).toHaveTextContent("0:cleared");
  } finally {
    vi.useRealTimers();
  }
});
